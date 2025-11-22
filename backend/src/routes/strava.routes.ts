import { Request, Response, Router } from 'express';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import {
	processActivity,
	deleteActivityAndRestoreHexagons,
} from '../services/activityProcessing.service';
import {
	StravaOAuthTokenResponse,
	StravaActivity,
	StravaAthleteStats,
} from '../types/strava.types';
import { Activity } from '../models/Activity';
import { processAndUploadProfileImage } from '../utils/imageProcessing';
import { geocodeToHex } from '../utils/geocoding';
import { getValidAccessToken } from '../services/strava.service';
import {
	sendNewUserSignupNotification,
	sendActivityProcessedNotification,
	sendActivityProcessingErrorNotification,
} from '../services/slack.service';
import { authLimiter, activityProcessingLimiter } from '../middleware/rateLimiter';

const router = Router();

// No authLimiter here - this just returns a URL, globalLimiter is sufficient
router.get('/api/strava/auth', (req: Request, res: Response) => {
	const clientId = process.env.STRAVA_CLIENT_ID;
	const redirectUri = process.env.FRONTEND_URL;
	const scope = 'read,activity:read_all';

	if (!clientId || !redirectUri) {
		console.error('❌ Missing Strava configuration:', {
			hasClientId: !!clientId,
			hasRedirectUri: !!redirectUri,
		});
		return res.status(500).json({
			error: 'Strava authentication is not properly configured',
			details: 'Missing required environment variables. Please spam jan.kondula@gmail.com',
		});
	}

	const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=auto&scope=${scope}`;

	res.json({ authUrl });
});

router.post('/api/strava/callback', authLimiter, async (req: Request, res: Response) => {
	try {
		const { code, scope } = req.body;

		if (!code) {
			return res.status(400).json({ error: 'Authorization code is required' });
		}

		if (!scope) {
			return res
				.status(400)
				.json({ error: 'Scope is required - not provided by authorization redirect' });
		}

		if (!scope.includes('activity:read_all')) {
			return res.status(403).json({
				error: 'Insufficient Permissions',
				details:
					`We are sorry, but we need access to the 'private' activities permission, otherwise we cannot process any activities. ` +
					`Please try registering again and accept all permissions. ` +
					`(Granted: '${scope}', Required: 'read,activity:read_all')`,
			});
		}

		console.log('🔐 Exchanging authorization code for tokens...');

		const response = await fetch('https://www.strava.com/oauth/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				client_id: process.env.STRAVA_CLIENT_ID,
				client_secret: process.env.STRAVA_CLIENT_SECRET,
				code,
				grant_type: 'authorization_code',
			}),
		});

		if (!response.ok) {
			const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
			console.error('❌ Strava API error:', response.status, errorData);

			const message = typeof errorData.message === 'string' ? errorData.message : '';
			if (response.status === 400 && message.includes('expired')) {
				throw new Error('Authorization code has expired. Please try logging in again.');
			}
			if (response.status === 400) {
				throw new Error(
					'Authorization code is invalid or already used. Please try logging in again.'
				);
			}

			throw new Error(`Strava token exchange failed: ${response.status}`);
		}

		const data = (await response.json()) as StravaOAuthTokenResponse;

		console.log('✅ Tokens received from Strava');
		console.log('📊 Token data from Strava:', {
			expires_at: data.expires_at,
			expires_in: data.expires_in,
			expires_at_date: data.expires_at ? new Date(data.expires_at * 1000).toISOString() : 'N/A',
		});
		console.log('👤 Athlete data:', data.athlete);
		console.log(`✅ Granted scope: ${scope}`);

		const adminStravaId = process.env.ADMIN_STRAVA_ID
			? parseInt(process.env.ADMIN_STRAVA_ID, 10)
			: null;
		const isAdminStravaId = adminStravaId !== null && data.athlete.id === adminStravaId;

		let user = await User.findOne({ stravaId: data.athlete.id });

		const isNewUser = !user;

		let tempUserId: string;
		if (user) {
			tempUserId = user._id.toString();
		} else {
			user = new User({
				stravaId: data.athlete.id,
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				tokenExpiresAt: data.expires_at,
				isAdmin: isAdminStravaId,
				stravaProfile: {
					firstname: data.athlete.firstname,
					lastname: data.athlete.lastname,
					profile: '',
					imghex: '',
					city: data.athlete.city,
					state: data.athlete.state,
					country: data.athlete.country,
					sex: data.athlete.sex,
					username: data.athlete.username,
				},
			});
			await user.save();
			tempUserId = user._id.toString();
		}

		const stravaImageUrl = data.athlete.profile || data.athlete.profile_medium || '';
		let s3ProfileUrl = user.stravaProfile.profile;
		let s3HexagonUrl = user.stravaProfile.imghex;

		if (stravaImageUrl) {
			try {
				const { originalUrl, hexagonUrl } = await processAndUploadProfileImage(
					stravaImageUrl,
					tempUserId,
					150
				);
				s3ProfileUrl = originalUrl;
				s3HexagonUrl = hexagonUrl;
			} catch (error) {
				console.error(
					'⚠️ Failed to process profile image:',
					error instanceof Error ? error.message : 'Unknown error'
				);
				s3ProfileUrl = stravaImageUrl;
				s3HexagonUrl = undefined;
			}
		} else {
			s3ProfileUrl = undefined;
			s3HexagonUrl = undefined;
		}

		user.accessToken = data.access_token;
		user.refreshToken = data.refresh_token;
		user.tokenExpiresAt = data.expires_at;
		user.isAdmin = user.isAdmin || isAdminStravaId;
		user.stravaProfile = {
			firstname: data.athlete.firstname,
			lastname: data.athlete.lastname,
			profile: s3ProfileUrl,
			imghex: s3HexagonUrl,
			city: data.athlete.city,
			state: data.athlete.state,
			country: data.athlete.country,
			sex: data.athlete.sex,
			username: data.athlete.username,
		};
		await user.save();

		if (isNewUser && !user.lastHex) {
			const initialHex = await geocodeToHex(
				user.stravaProfile.city,
				user.stravaProfile.state,
				user.stravaProfile.country
			);
			if (initialHex) {
				user.lastHex = initialHex;
				await user.save();
			}
		}

		if (isNewUser) {
			await sendNewUserSignupNotification({
				userName: `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`,
				userStravaId: user.stravaId,
				userId: tempUserId,
			});
		}

		const token = generateToken(user);

		console.log('✅ Authentication successful');

		res.json({
			success: true,
			message: 'Authentication successful',
			token,
			isNewUser,
			user: {
				id: user._id,
				stravaId: user.stravaId,
				isAdmin: user.isAdmin,
				profile: user.stravaProfile,
				tokenExpiresAt: user.tokenExpiresAt,
				lastHex: user.lastHex,
			},
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		console.error('❌ Token exchange error:', errorMessage);
		res.status(500).json({
			error: 'Failed to exchange authorization code',
			details: errorMessage,
		});
	}
});

router.get('/api/strava/activities', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		console.log('🏃 Fetching Strava activities for user:', req.user?.stravaProfile.firstname);

		const page = parseInt(req.query.page as string) || 1;
		const per_page = Math.min(parseInt(req.query.per_page as string) || 30, 200);

		const accessToken = await getValidAccessToken(req.userId!);

		const stravaUrl = new URL('https://www.strava.com/api/v3/athlete/activities');
		stravaUrl.searchParams.set('page', page.toString());
		stravaUrl.searchParams.set('per_page', per_page.toString());

		const response = await fetch(stravaUrl.toString(), {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Strava API error: ${response.status}`);
		}

		const activities = (await response.json()) as StravaActivity[];

		const hasMorePages = activities.length === per_page;

		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - 7);
		cutoffDate.setHours(0, 0, 0, 0);

		const runningActivities = activities.filter((activity: StravaActivity) => {
			const type = activity.type;
			const sportType = activity.sport_type;
			const isRunning = type === 'Run' || sportType === 'TrailRun' || sportType === 'VirtualRun';

			const activityDate = new Date(activity.start_date);
			const isAfterCutoff = activityDate >= cutoffDate;

			return isRunning && isAfterCutoff;
		});

		const stravaActivityIds = runningActivities.map((a: StravaActivity) => a.id);

		const storedActivities = await Activity.find(
			{ stravaActivityId: { $in: stravaActivityIds } },
			{ stravaActivityId: 1, lastHex: 1 }
		);

		const storedActivityMap = new Map(storedActivities.map((a) => [a.stravaActivityId, a.lastHex]));

		const activitiesWithStoredFlag = runningActivities.map((activity: StravaActivity) => ({
			...activity,
			isStored: storedActivityMap.has(activity.id),
			lastHex: storedActivityMap.get(activity.id) || undefined,
		}));

		res.json({
			success: true,
			count: runningActivities.length,
			page,
			per_page,
			hasMorePages,
			activities: activitiesWithStoredFlag,
			infoMessage: 'You cannot fetch activities older than 7 days.',
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		console.error('❌ Strava API error:', errorMessage);
		res.status(500).json({
			error: 'Failed to fetch activities',
			details: errorMessage,
		});
	}
});

router.get(
	'/api/strava/activities/:id',
	authenticateToken,
	async (req: AuthRequest, res: Response) => {
		try {
			const activityId = req.params.id;
			console.log(
				`🏃 Fetching Strava activity ${activityId} for user:`,
				req.user?.stravaProfile.firstname
			);

			const accessToken = await getValidAccessToken(req.userId!);

			const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			if (!response.ok) {
				if (response.status === 404) {
					return res.status(404).json({ error: 'Activity not found' });
				}
				throw new Error(`Strava API error: ${response.status}`);
			}

			const activity = (await response.json()) as StravaActivity;

			res.json({
				success: true,
				activity: activity,
			});
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			console.error('❌ Strava API error:', errorMessage);
			res.status(500).json({
				error: 'Failed to fetch activity details',
				details: errorMessage,
			});
		}
	}
);

router.get('/api/strava/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		console.log('📊 Fetching Strava stats for user:', req.user?.stravaProfile.firstname);

		const accessToken = await getValidAccessToken(req.userId!);

		const response = await fetch(
			`https://www.strava.com/api/v3/athletes/${req.user?.stravaId}/stats`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (!response.ok) {
			throw new Error(`Strava API error: ${response.status}`);
		}

		const stats = (await response.json()) as StravaAthleteStats;

		const runCount = stats.all_run_totals?.count || 0;

		res.json({
			success: true,
			stats: stats,
			runCount: runCount,
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		console.error('❌ Strava API error:', errorMessage);
		res.status(500).json({
			error: 'Failed to fetch stats',
			details: errorMessage,
		});
	}
});

router.delete(
	'/api/strava/activities/:stravaActivityId',
	authenticateToken,
	async (req: AuthRequest, res: Response) => {
		try {
			const { stravaActivityId } = req.params;
			const currentUser = req.user!;

			if (!stravaActivityId) {
				return res.status(400).json({ error: 'stravaActivityId is required' });
			}

			const result = await deleteActivityAndRestoreHexagons(
				parseInt(stravaActivityId),
				currentUser
			);

			res.json({
				success: true,
				...result,
			});
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			console.error('❌ Error deleting activity:', error);

			if (errorMessage === 'Activity not found in database') {
				return res.status(404).json({ error: errorMessage });
			}

			if (errorMessage === 'You can only delete your own activities') {
				return res.status(403).json({ error: errorMessage });
			}

			res.status(500).json({
				error: 'Failed to delete activity',
				details: errorMessage,
			});
		}
	}
);

router.post(
	'/api/strava/process-activity',
	activityProcessingLimiter,
	authenticateToken,
	async (req: AuthRequest, res: Response) => {
		const { activityId, source = 'manual' } = req.body;
		const currentUser = req.user!;

		if (!activityId) {
			return res.status(400).json({ error: 'activityId is required' });
		}

		// Helper to build notification params
		const buildNotificationParams = () => ({
			userName: `${currentUser.stravaProfile.firstname} ${currentUser.stravaProfile.lastname}`,
			userStravaId: currentUser.stravaId,
			userId: req.userId!,
			stravaActivityId: activityId,
			source: source as 'manual' | 'after_signup',
		});

		try {
			const result = await processActivity(activityId, currentUser, req.userId!);

			await sendActivityProcessedNotification(buildNotificationParams());

			res.json({
				success: true,
				...result,
			});
		} catch (error: unknown) {
			console.error('❌ Error processing activity:', error);

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			const isNonRunningActivity = errorMessage.includes('Only running activities');
			const hasNoGPS = errorMessage.includes('no GPS data') || errorMessage.includes('summary_polyline missing');

			// Send Slack notification for real errors (skip non-running activities and GPS-less activities)
			if (!isNonRunningActivity && !hasNoGPS) {
				await sendActivityProcessingErrorNotification({
					...buildNotificationParams(),
					error: errorMessage,
				});
			}

			// Return appropriate error response
			if (isNonRunningActivity) {
				return res.status(400).json({
					error: 'Only running activities are allowed',
					details: errorMessage,
				});
			}

			if (hasNoGPS) {
				return res.status(400).json({
					error: 'Activity has no GPS data',
					details: errorMessage
				});
			}

			if (errorMessage.includes('Strava API error')) {
				return res.status(502).json({ error: errorMessage });
			}

			res.status(500).json({
				error: 'Failed to process activity',
				details: errorMessage,
			});
		}
	}
);

router.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		const user = req.user!;

		res.json({
			success: true,
			user: {
				id: user._id,
				stravaId: user.stravaId,
				isAdmin: user.isAdmin,
				profile: user.stravaProfile,
				tokenExpiresAt: user.tokenExpiresAt,
				createdAt: user.createdAt,
				lastHex: user.lastHex,
			},
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		console.error('❌ Error fetching user:', errorMessage);
		res.status(500).json({
			error: 'Failed to fetch user',
			details: errorMessage,
		});
	}
});

router.post(
	'/api/auth/refresh-token',
	authLimiter,
	authenticateToken,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = await User.findById(req.userId);

			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			const now = Math.floor(Date.now() / 1000);
			const timeUntilExpiry = user.tokenExpiresAt - now;

			// Strava tokens expire after 6 hours (21600 seconds)
			// We refresh when less than 2 hours remain for consistency with webhook processing
			const TOKEN_REFRESH_THRESHOLD = 7200;

			console.log(`🔄 Token refresh requested for user: ${user.stravaProfile.firstname}`);
			console.log(
				`⏰ Token expires in ${timeUntilExpiry}s (${Math.floor(timeUntilExpiry / 60)} minutes)`
			);

			if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD) {
				console.log(
					`🔄 Refreshing token (expires in ${Math.floor(timeUntilExpiry / 60)} minutes)...`
				);

				const response = await fetch('https://www.strava.com/oauth/token', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						client_id: process.env.STRAVA_CLIENT_ID,
						client_secret: process.env.STRAVA_CLIENT_SECRET,
						refresh_token: user.refreshToken,
						grant_type: 'refresh_token',
					}),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					console.error('❌ Token refresh failed:', response.status, errorData);

					if (response.status === 401) {
						return res.status(401).json({
							error: 'Token refresh failed - user may have revoked access',
							needsReauth: true,
						});
					}

					throw new Error(`Token refresh failed: ${response.status}`);
				}

				const tokenData = (await response.json()) as {
					access_token: string;
					refresh_token: string;
					expires_at: number;
					expires_in: number;
				};

				user.accessToken = tokenData.access_token;
				user.refreshToken = tokenData.refresh_token;
				user.tokenExpiresAt = tokenData.expires_at;
				await user.save();

				console.log(
					`✅ Token refreshed successfully (new expiry: ${new Date(tokenData.expires_at * 1000).toISOString()})`
				);
			} else {
				console.log(
					`✅ Token still valid (expires in ${Math.floor(timeUntilExpiry / 60)} minutes), no refresh needed`
				);
			}

			res.json({
				success: true,
				user: {
					id: user._id,
					stravaId: user.stravaId,
					isAdmin: user.isAdmin,
					profile: user.stravaProfile,
					tokenExpiresAt: user.tokenExpiresAt,
					createdAt: user.createdAt,
				},
			});
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			console.error('❌ Error refreshing token:', errorMessage);
			res.status(500).json({
				error: 'Failed to refresh token',
				details: errorMessage,
			});
		}
	}
);

router.get('/api/activities/latest', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		const latestActivity = await Activity.findOne({ userId: req.userId })
			.sort({ startDate: -1 })
			.limit(1)
			.lean();

		if (!latestActivity) {
			return res.json({
				success: true,
				activity: null,
			});
		}

		res.json({
			success: true,
			activity: {
				id: latestActivity._id,
				stravaActivityId: latestActivity.stravaActivityId,
				name: latestActivity.name,
				distance: latestActivity.distance,
				startDate: latestActivity.startDate,
				lastHex: latestActivity.lastHex,
			},
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		console.error('❌ Error fetching latest activity:', errorMessage);
		res.status(500).json({
			error: 'Failed to fetch latest activity',
			details: errorMessage,
		});
	}
});

router.get('/api/activities/all', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		const activities = await Activity.find({ userId: req.userId })
			.sort({ startDate: -1 })
			.select('stravaActivityId name distance startDate lastHex')
			.lean();

		res.json({
			success: true,
			count: activities.length,
			activities: activities.map((activity) => ({
				id: activity._id,
				stravaActivityId: activity.stravaActivityId,
				name: activity.name,
				distance: activity.distance,
				startDate: activity.startDate,
				lastHex: activity.lastHex,
			})),
		});
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		console.error('❌ Error fetching activities:', errorMessage);
		res.status(500).json({
			error: 'Failed to fetch activities',
			details: errorMessage,
		});
	}
});

export default router;
