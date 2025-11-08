import { Request, Response, Router } from 'express';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { processActivity, deleteActivityAndRestoreHexagons } from '../services/activityProcessing.service';
import { StravaOAuthTokenResponse, StravaActivity, StravaAthleteStats } from '../types/strava.types';
import { Activity } from '../models/Activity';
import { processAndUploadProfileImage } from '../utils/imageProcessing';
import { geocodeToHex } from '../utils/geocoding';

const router = Router();

// Step 1: Redirect to Strava OAuth
router.get('/api/strava/auth', (req: Request, res: Response) => {
	const clientId = process.env.STRAVA_CLIENT_ID;
	const redirectUri = process.env.FRONTEND_URL; // Redirect to home page where StravaSection handles callback
	const scope = 'read,activity:read_all';

	const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=auto&scope=${scope}`;

	res.json({ authUrl });
});

// Step 2: Exchange code for tokens and create/update user
router.post('/api/strava/callback', async (req: Request, res: Response) => {
	try {
		const { code } = req.body;

		if (!code) {
			return res.status(400).json({ error: 'Authorization code is required' });
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
			const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
			console.error('❌ Strava API error:', response.status, errorData);

			// Common OAuth errors
			const message = typeof errorData.message === 'string' ? errorData.message : '';
			if (response.status === 400 && message.includes('expired')) {
				throw new Error('Authorization code has expired. Please try logging in again.');
			}
			if (response.status === 400) {
				throw new Error('Authorization code is invalid or already used. Please try logging in again.');
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

		// Check if this user should have admin privileges (specific Strava ID)
		const isAdminStravaId = data.athlete.id === 27159758; // Jan's Strava ID

		// Find or create user
		let user = await User.findOne({ stravaId: data.athlete.id });

		// Track if this is a new user
		const isNewUser = !user;

		// Create temporary user to get ID for S3 path (for new users)
		// For existing users, we'll use their existing ID
		let tempUserId: string;
		if (user) {
			tempUserId = user._id.toString();
		} else {
			// Need to create user first to get ID
			console.log('👤 Creating new user:', data.athlete.firstname);
			user = new User({
				stravaId: data.athlete.id,
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				tokenExpiresAt: data.expires_at,
				isAdmin: isAdminStravaId,
				stravaProfile: {
					firstname: data.athlete.firstname,
					lastname: data.athlete.lastname,
					profile: '', // Will update after S3 upload
					imghex: '', // Will update after S3 upload
					city: data.athlete.city,
					state: data.athlete.state,
					country: data.athlete.country,
					sex: data.athlete.sex,
					username: data.athlete.username,
				},
			});
			await user.save();
			tempUserId = user._id.toString();

			if (isAdminStravaId) {
				console.log('👑 Admin Strava ID detected - granted admin privileges!');
			}
		}

		// Process profile image and upload to S3 (optional - only if user has a photo)
		const stravaImageUrl = data.athlete.profile || data.athlete.profile_medium || '';
		let s3ProfileUrl = user.stravaProfile.profile; // Keep existing if already set
		let s3HexagonUrl = user.stravaProfile.imghex;

		if (stravaImageUrl) {
			try {
				console.log('📸 Processing and uploading profile image to S3...');
				const { originalUrl, hexagonUrl } = await processAndUploadProfileImage(
					stravaImageUrl,
					tempUserId,
					400
				);
				s3ProfileUrl = originalUrl;
				s3HexagonUrl = hexagonUrl;
				console.log('✅ Profile images uploaded to S3');
			} catch (error) {
				console.error('⚠️ Failed to process profile image, using Strava URL as fallback');
				console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
				// Fall back to Strava URL if S3 upload fails - don't break authentication!
				s3ProfileUrl = stravaImageUrl;
				s3HexagonUrl = undefined; // Clear hexagon URL if processing failed
			}
		} else {
			console.log('ℹ️ User has no profile photo from Strava - skipping image processing');
			s3ProfileUrl = undefined;
			s3HexagonUrl = undefined;
		}

		// Update user with final profile URLs
		user.accessToken = data.access_token;
		user.refreshToken = data.refresh_token;
		user.tokenExpiresAt = data.expires_at;
		user.isAdmin = user.isAdmin || isAdminStravaId; // Ensure admin status for specific Strava ID
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

		console.log('👤 User profile updated:', user.stravaProfile.firstname);

		// For new users, try to geocode their city to set initial lastHex (best effort)
		if (isNewUser && !user.lastHex) {
			const initialHex = await geocodeToHex(
				user.stravaProfile.city,
				user.stravaProfile.state,
				user.stravaProfile.country
			);
			if (initialHex) {
				user.lastHex = initialHex;
				await user.save();
				console.log('✅ Set initial lastHex from location');
			}
		}

		// Generate JWT token
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

// Step 3: Get Strava activities - REQUIRES AUTH
router.get('/api/strava/activities', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		console.log('🏃 Fetching Strava activities for user:', req.user?.stravaProfile.firstname);

		// Get paging parameters from query string
		const page = parseInt(req.query.page as string) || 1;
		const per_page = Math.min(parseInt(req.query.per_page as string) || 30, 200); // Max 200 per Strava API

		console.log(`📄 Fetching page ${page} with ${per_page} activities per page`);

		// Use user's access token (frontend handles refresh)
		const accessToken = req.user!.accessToken;

		// Fetch activities from Strava with paging
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

		console.log(`✅ Fetched ${activities.length} activities from Strava`);

		// Check if Strava has more pages (if we got a full page, there might be more)
		const hasMorePages = activities.length === per_page;

		// Filter to only include running activities after Nov 1, 2025
		const cutoffDate = new Date('2025-11-01T00:00:00Z');
		const runningActivities = activities.filter((activity: StravaActivity) => {
			const type = activity.type;
			const sportType = activity.sport_type;
			const isRunning = type === 'Run' || sportType === 'TrailRun' || sportType === 'VirtualRun';

			// Check if activity is after cutoff date
			const activityDate = new Date(activity.start_date);
			const isAfterCutoff = activityDate >= cutoffDate;

			return isRunning && isAfterCutoff;
		});

		console.log(`🏃 Filtered to ${runningActivities.length} running activities after ${cutoffDate.toISOString()} (from ${activities.length} total)`);

		// Check which activities are already stored in our database
		const stravaActivityIds = runningActivities.map((a: StravaActivity) => a.id);

		const storedActivities = await Activity.find(
			{ stravaActivityId: { $in: stravaActivityIds } },
			{ stravaActivityId: 1 }
		);

		const storedActivityIds = new Set(storedActivities.map((a) => a.stravaActivityId));

		// Add isStored flag to each activity
		const activitiesWithStoredFlag = runningActivities.map((activity: StravaActivity) => ({
			...activity,
			isStored: storedActivityIds.has(activity.id),
		}));

		console.log(`💾 ${storedActivityIds.size} of ${runningActivities.length} activities already stored in database`);

		res.json({
			success: true,
			count: runningActivities.length,
			page,
			per_page,
			hasMorePages, // Based on Strava's response, not filtered results
			activities: activitiesWithStoredFlag,
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

// Step 4: Get single activity details - REQUIRES AUTH
router.get('/api/strava/activities/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		const activityId = req.params.id;
		console.log(`🏃 Fetching Strava activity ${activityId} for user:`, req.user?.stravaProfile.firstname);

		// Use user's access token (frontend handles refresh)
		const accessToken = req.user!.accessToken;

		// Fetch single activity from Strava
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

		console.log(`✅ Fetched activity ${activityId}`);

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
});

// Get athlete stats - REQUIRES AUTH
router.get('/api/strava/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		console.log('📊 Fetching Strava stats for user:', req.user?.stravaProfile.firstname);

		// Use user's access token (frontend handles refresh)
		const accessToken = req.user!.accessToken;

		// Fetch stats from Strava
		const response = await fetch(`https://www.strava.com/api/v3/athletes/${req.user?.stravaId}/stats`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Strava API error: ${response.status}`);
		}

		const stats = (await response.json()) as StravaAthleteStats;

		console.log('✅ Fetched athlete stats');

		// Extract run counts from stats
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

// Delete Strava activity - removes activity and restores/deletes hexagons
router.delete('/api/strava/activities/:stravaActivityId', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		const { stravaActivityId } = req.params;
		const currentUser = req.user!;

		if (!stravaActivityId) {
			return res.status(400).json({ error: 'stravaActivityId is required' });
		}

		const result = await deleteActivityAndRestoreHexagons(parseInt(stravaActivityId), currentUser);

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
});

// Process Strava activity - fetch, decode polyline, create hexagons
router.post('/api/strava/process-activity', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		const { activityId } = req.body;
		const currentUser = req.user!;

		if (!activityId) {
			return res.status(400).json({ error: 'activityId is required' });
		}

		const result = await processActivity(activityId, currentUser, req.userId!);

		res.json({
			success: true,
			...result,
		});
	} catch (error: unknown) {
		console.error('❌ Error processing activity:', error);

		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		// Handle specific error types
		if (errorMessage.includes('Only running activities')) {
			return res.status(400).json({
				error: 'Only running activities are allowed',
				details: errorMessage,
			});
		}

		if (errorMessage.includes('no GPS data')) {
			return res.status(400).json({ error: errorMessage });
		}

		if (errorMessage.includes('Strava API error')) {
			return res.status(502).json({ error: errorMessage });
		}

		res.status(500).json({
			error: 'Failed to process activity',
			details: errorMessage,
		});
	}
});

// Get current authenticated user
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

// Refresh user's Strava token
router.post('/api/auth/refresh-token', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		const user = await User.findById(req.userId);

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		const now = Math.floor(Date.now() / 1000);
		const timeUntilExpiry = user.tokenExpiresAt - now;

		console.log(`🔄 Token refresh requested for user: ${user.stravaProfile.firstname}`);
		console.log(`⏰ Token expires in ${timeUntilExpiry}s (${Math.floor(timeUntilExpiry / 60)} minutes)`);

		// Refresh if token expires in less than 1 hour (3600 seconds)
		if (timeUntilExpiry < 3600) {
			console.log(`🔄 Refreshing token (expires in ${timeUntilExpiry}s)...`);

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

				// If refresh fails, token may be revoked
				if (response.status === 401) {
					return res.status(401).json({
						error: 'Token refresh failed - user may have revoked access',
						needsReauth: true,
					});
				}

				throw new Error(`Token refresh failed: ${response.status}`);
			}

			const tokenData = await response.json() as {
				access_token: string;
				refresh_token: string;
				expires_at: number;
				expires_in: number;
			};

			// Update user's tokens in database
			user.accessToken = tokenData.access_token;
			user.refreshToken = tokenData.refresh_token;
			user.tokenExpiresAt = tokenData.expires_at;
			await user.save();

			console.log(`✅ Token refreshed successfully (new expiry: ${new Date(tokenData.expires_at * 1000).toISOString()})`);
		} else {
			console.log(`✅ Token still valid (expires in ${timeUntilExpiry}s), no refresh needed`);
		}

		// Return updated user with token expiry
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
});

// Get latest activity for the authenticated user
router.get('/api/activities/latest', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		console.log('📊 Fetching latest activity for user:', req.user?.stravaProfile.firstname);

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

// Get all activities for the authenticated user from database
router.get('/api/activities/all', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		console.log('📊 Fetching all activities for user:', req.user?.stravaProfile.firstname);

		const activities = await Activity.find({ userId: req.userId })
			.sort({ startDate: -1 })
			.select('stravaActivityId name distance startDate')
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
