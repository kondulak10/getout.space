import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import polyline from '@mapbox/polyline';
import { User } from '../models/User';
import { Activity } from '../models/Activity';
import { Hexagon, IHexagon, ICaptureHistoryEntry } from '../models/Hexagon';
import { generateToken } from '../utils/jwt';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { refreshStravaToken } from '../utils/strava';
import { analyzeRouteAndConvertToHexagons } from '../utils/routeToHexagons';

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
			const errorData = await response.json().catch(() => ({})) as any;
			console.error('❌ Strava API error:', response.status, errorData);

			// Common OAuth errors
			if (response.status === 400 && errorData.message?.includes('expired')) {
				throw new Error('Authorization code has expired. Please try logging in again.');
			}
			if (response.status === 400) {
				throw new Error('Authorization code is invalid or already used. Please try logging in again.');
			}

			throw new Error(`Strava token exchange failed: ${response.status}`);
		}

		const data = (await response.json()) as any;

		console.log('✅ Tokens received from Strava');
		console.log('📊 Token data from Strava:', {
			expires_at: data.expires_at,
			expires_in: data.expires_in,
			expires_at_date: data.expires_at ? new Date(data.expires_at * 1000).toISOString() : 'N/A',
		});
		console.log('👤 Athlete data:', data.athlete);

		// Check if this is the first user (for admin privileges)
		const userCount = await User.countDocuments();
		const isFirstUser = userCount === 0;

		// Find or create user
		let user = await User.findOne({ stravaId: data.athlete.id });

		if (user) {
			// Update existing user's tokens
			console.log('👤 Updating existing user:', user.stravaProfile.firstname);
			user.accessToken = data.access_token;
			user.refreshToken = data.refresh_token;
			user.tokenExpiresAt = data.expires_at;
			// Update profile in case it changed
			user.stravaProfile = {
				firstname: data.athlete.firstname,
				lastname: data.athlete.lastname,
				profile: data.athlete.profile || data.athlete.profile_medium,
				city: data.athlete.city,
				state: data.athlete.state,
				country: data.athlete.country,
				sex: data.athlete.sex,
				username: data.athlete.username,
			};
			await user.save();
		} else {
			// Create new user
			console.log('👤 Creating new user:', data.athlete.firstname);
			user = new User({
				stravaId: data.athlete.id,
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				tokenExpiresAt: data.expires_at,
				isAdmin: isFirstUser, // First user becomes admin
				stravaProfile: {
					firstname: data.athlete.firstname,
					lastname: data.athlete.lastname,
					profile: data.athlete.profile || data.athlete.profile_medium,
					city: data.athlete.city,
					state: data.athlete.state,
					country: data.athlete.country,
					sex: data.athlete.sex,
					username: data.athlete.username,
				},
			});
			await user.save();

			if (isFirstUser) {
				console.log('👑 First user registered as admin!');
			}
		}

		// Generate JWT token
		const token = generateToken(user);

		console.log('✅ Authentication successful');

		res.json({
			success: true,
			message: 'Authentication successful',
			token,
			user: {
				id: user._id,
				stravaId: user.stravaId,
				isAdmin: user.isAdmin,
				profile: user.stravaProfile,
			},
		});
	} catch (error: any) {
		console.error('❌ Token exchange error:', error.message);
		res.status(500).json({
			error: 'Failed to exchange authorization code',
			details: error.message,
		});
	}
});

// Helper: Refresh access token if expired for a specific user
// Exported so it can be used by webhooks
export async function getValidAccessToken(userId: string): Promise<string> {
	const user = await User.findById(userId);

	if (!user) {
		throw new Error('User not found');
	}

	const now = Math.floor(Date.now() / 1000);

	// If token expires in less than 5 minutes, refresh it
	if (user.tokenExpiresAt - now < 300) {
		console.log('🔄 Access token expired or expiring soon, refreshing...');

		const tokenData = await refreshStravaToken(user);

		// Update user's tokens in database
		user.accessToken = tokenData.access_token;
		user.refreshToken = tokenData.refresh_token;
		user.tokenExpiresAt = tokenData.expires_at;
		await user.save();

		console.log('✅ Token refreshed and saved to DB');
	}

	return user.accessToken;
}

// Step 3: Get Strava activities (with auto token refresh) - REQUIRES AUTH
router.get('/api/strava/activities', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		console.log('🏃 Fetching Strava activities for user:', req.user?.stravaProfile.firstname);

		// Get paging parameters from query string
		const page = parseInt(req.query.page as string) || 1;
		const per_page = Math.min(parseInt(req.query.per_page as string) || 30, 200); // Max 200 per Strava API

		console.log(`📄 Fetching page ${page} with ${per_page} activities per page`);

		// Get valid access token (auto-refreshes if needed)
		const accessToken = await getValidAccessToken(req.userId!);

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

		const activities = (await response.json()) as any[];

		console.log(`✅ Fetched ${activities.length} activities from Strava`);

		// Check if Strava has more pages (if we got a full page, there might be more)
		const hasMorePages = activities.length === per_page;

		// Filter to only include running activities
		const runningActivities = activities.filter((activity: any) => {
			const type = activity.type;
			const sportType = activity.sport_type;
			return type === 'Run' || sportType === 'TrailRun' || sportType === 'VirtualRun';
		});

		console.log(`🏃 Filtered to ${runningActivities.length} running activities (from ${activities.length} total)`);

		// Check which activities are already stored in our database
		const { Activity } = await import('../models/Activity');
		const stravaActivityIds = runningActivities.map((a: any) => a.id);

		const storedActivities = await Activity.find(
			{ stravaActivityId: { $in: stravaActivityIds } },
			{ stravaActivityId: 1 }
		);

		const storedActivityIds = new Set(storedActivities.map((a: any) => a.stravaActivityId));

		// Add isStored flag to each activity
		const activitiesWithStoredFlag = runningActivities.map((activity: any) => ({
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
	} catch (error: any) {
		console.error('❌ Strava API error:', error.message);
		res.status(500).json({
			error: 'Failed to fetch activities',
			details: error.message,
		});
	}
});

// Step 4: Get single activity details - REQUIRES AUTH
router.get('/api/strava/activities/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		const activityId = req.params.id;
		console.log(`🏃 Fetching Strava activity ${activityId} for user:`, req.user?.stravaProfile.firstname);

		// Get valid access token (auto-refreshes if needed)
		const accessToken = await getValidAccessToken(req.userId!);

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

		const activity = (await response.json()) as any;

		console.log(`✅ Fetched activity ${activityId}`);

		res.json({
			success: true,
			activity: activity,
		});
	} catch (error: any) {
		console.error('❌ Strava API error:', error.message);
		res.status(500).json({
			error: 'Failed to fetch activity details',
			details: error.message,
		});
	}
});

// Get athlete stats - REQUIRES AUTH
router.get('/api/strava/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
	try {
		console.log('📊 Fetching Strava stats for user:', req.user?.stravaProfile.firstname);

		// Get valid access token (auto-refreshes if needed)
		const accessToken = await getValidAccessToken(req.userId!);

		// Fetch stats from Strava
		const response = await fetch(`https://www.strava.com/api/v3/athletes/${req.user?.stravaId}/stats`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Strava API error: ${response.status}`);
		}

		const stats = (await response.json()) as any;

		console.log('✅ Fetched athlete stats');

		// Extract run counts from stats
		const runCount = stats.all_run_totals?.count || 0;

		res.json({
			success: true,
			stats: stats,
			runCount: runCount,
		});
	} catch (error: any) {
		console.error('❌ Strava API error:', error.message);
		res.status(500).json({
			error: 'Failed to fetch stats',
			details: error.message,
		});
	}
});

// Process Strava activity - fetch, decode polyline, create hexagons
router.post('/api/strava/process-activity', authenticateToken, async (req: AuthRequest, res: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { activityId } = req.body;
		const currentUser = req.user!;

		if (!activityId) {
			return res.status(400).json({ error: 'activityId is required' });
		}

		console.log(`🎯 Processing Strava activity ${activityId} for user: ${currentUser.stravaProfile.firstname}`);

		// Get valid access token (auto-refreshes if needed)
		const accessToken = await getValidAccessToken(req.userId!);

		// Fetch activity details from Strava
		const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			await session.abortTransaction();
			return res.status(response.status).json({ error: `Strava API error: ${response.status}` });
		}

		const stravaActivity = (await response.json()) as any;

		// Validate activity type - only allow running activities
		const activityType = stravaActivity.type;
		const sportType = stravaActivity.sport_type;
		const isRunningActivity = activityType === 'Run' || sportType === 'TrailRun' || sportType === 'VirtualRun';

		if (!isRunningActivity) {
			await session.abortTransaction();
			return res.status(400).json({
				error: 'Only running activities are allowed',
				details: `Activity type "${activityType}" (sport type: "${sportType}") is not supported. Only Run, TrailRun, and VirtualRun activities can be processed.`,
			});
		}

		// Validate activity has polyline
		if (!stravaActivity.map?.summary_polyline) {
			await session.abortTransaction();
			return res.status(400).json({ error: 'Activity has no GPS data (summary_polyline missing)' });
		}

		console.log(`📍 Activity: ${stravaActivity.name} - ${stravaActivity.type}`);

		// Decode polyline to coordinates
		const coordinates = polyline.decode(stravaActivity.map.summary_polyline) as [number, number][];
		console.log(`📍 Decoded ${coordinates.length} GPS points`);

		// Convert coordinates to hexagons
		const { hexagons, type: routeType } = analyzeRouteAndConvertToHexagons(coordinates);
		console.log(`🔷 Generated ${hexagons.length} hexagons (type: ${routeType})`);

		// Save/Update Activity
		let activity = await Activity.findOne({ stravaActivityId: activityId }).session(session);
		let wasActivityCreated = false;

		if (activity) {
			console.log(`📝 Updating existing activity ${activity._id}`);
			// Update all fields
			activity.userId = currentUser._id;
			activity.source = 'api';
			activity.name = stravaActivity.name;
			activity.type = stravaActivity.type;
			activity.sportType = stravaActivity.sport_type;
			activity.description = stravaActivity.description;
			activity.startDate = new Date(stravaActivity.start_date);
			activity.startDateLocal = new Date(stravaActivity.start_date_local);
			activity.timezone = stravaActivity.timezone;
			activity.movingTime = stravaActivity.moving_time;
			activity.elapsedTime = stravaActivity.elapsed_time;
			activity.distance = stravaActivity.distance;
			activity.elevationGain = stravaActivity.total_elevation_gain;
			activity.averageSpeed = stravaActivity.average_speed;
			activity.startLocation = stravaActivity.start_latlng ? {
				lat: stravaActivity.start_latlng[0],
				lng: stravaActivity.start_latlng[1],
			} : undefined;
			activity.endLocation = stravaActivity.end_latlng ? {
				lat: stravaActivity.end_latlng[0],
				lng: stravaActivity.end_latlng[1],
			} : undefined;
			activity.summaryPolyline = stravaActivity.map.summary_polyline;
			activity.isManual = stravaActivity.manual;
			activity.isPrivate = stravaActivity.private;
			await activity.save({ session });
		} else {
			console.log(`✨ Creating new activity`);
			activity = new Activity({
				stravaActivityId: activityId,
				userId: currentUser._id,
				source: 'api',
				name: stravaActivity.name,
				type: stravaActivity.type,
				sportType: stravaActivity.sport_type,
				description: stravaActivity.description,
				startDate: new Date(stravaActivity.start_date),
				startDateLocal: new Date(stravaActivity.start_date_local),
				timezone: stravaActivity.timezone,
				movingTime: stravaActivity.moving_time,
				elapsedTime: stravaActivity.elapsed_time,
				distance: stravaActivity.distance,
				elevationGain: stravaActivity.total_elevation_gain,
				averageSpeed: stravaActivity.average_speed,
				startLocation: stravaActivity.start_latlng ? {
					lat: stravaActivity.start_latlng[0],
					lng: stravaActivity.start_latlng[1],
				} : undefined,
				endLocation: stravaActivity.end_latlng ? {
					lat: stravaActivity.end_latlng[0],
					lng: stravaActivity.end_latlng[1],
				} : undefined,
				summaryPolyline: stravaActivity.map.summary_polyline,
				isManual: stravaActivity.manual,
				isPrivate: stravaActivity.private,
			});
			await activity.save({ session });
			wasActivityCreated = true;
		}

		console.log(`✅ Activity saved: ${activity._id}`);

		// Process hexagons in batch
		// Step 1: Fetch all existing hexagons in one query
		const existingHexagons = await Hexagon.find({
			hexagonId: { $in: hexagons },
		}).session(session);

		// Create a map for quick lookup
		const existingHexMap = new Map<string, IHexagon>();
		existingHexagons.forEach((hex) => {
			existingHexMap.set(hex.hexagonId, hex);
		});

		// Step 2: Separate into creates, updates, and skips
		const hexagonsToCreate: any[] = [];
		const bulkUpdateOps: any[] = [];
		const createdIds: string[] = [];
		const updatedIds: string[] = [];
		const skippedIds: string[] = [];

		const activityDate = activity.startDate.getTime();

		for (const hexagonId of hexagons) {
			const existingHex = existingHexMap.get(hexagonId);

			if (!existingHex) {
				// New hexagon - prepare for batch insert
				hexagonsToCreate.push({
					hexagonId,
					currentOwnerId: currentUser._id,
					currentOwnerStravaId: currentUser.stravaId,
					currentActivityId: activity._id,
					currentStravaActivityId: activity.stravaActivityId,
					captureCount: 1,
					firstCapturedAt: activity.startDate,
					firstCapturedBy: currentUser._id,
					lastCapturedAt: activity.startDate,
					activityType: activity.sportType || activity.type,
					routeType,
					captureHistory: [],
				});
				createdIds.push(hexagonId);
			} else {
				// Existing hexagon - check if we can update it
				const hexDate = existingHex.lastCapturedAt.getTime();

				if (activityDate > hexDate) {
					// Activity is newer - prepare update operation
					const updateDoc: any = {
						currentOwnerId: currentUser._id,
						currentOwnerStravaId: currentUser.stravaId,
						currentActivityId: activity._id,
						currentStravaActivityId: activity.stravaActivityId,
						lastCapturedAt: activity.startDate,
						activityType: activity.sportType || activity.type,
						routeType,
					};

					// Check if ownership changed
					if (String(existingHex.currentOwnerId) !== String(currentUser._id)) {
						// Add previous owner to capture history
						updateDoc.$push = {
							captureHistory: {
								userId: existingHex.currentOwnerId,
								stravaId: existingHex.currentOwnerStravaId,
								activityId: existingHex.currentActivityId,
								stravaActivityId: existingHex.currentStravaActivityId,
								capturedAt: existingHex.lastCapturedAt,
								activityType: existingHex.activityType,
							},
						};
						updateDoc.$inc = { captureCount: 1 };
					}

					bulkUpdateOps.push({
						updateOne: {
							filter: { hexagonId },
							update: updateDoc,
						},
					});
					updatedIds.push(hexagonId);
				} else {
					// Activity is older - skip
					skippedIds.push(hexagonId);
				}
			}
		}

		// Step 3: Execute batch operations
		let created = 0;
		let updated = 0;

		if (hexagonsToCreate.length > 0) {
			await Hexagon.insertMany(hexagonsToCreate, { session });
			created = hexagonsToCreate.length;
			console.log(`✅ Batch created ${created} hexagons`);
		}

		if (bulkUpdateOps.length > 0) {
			const result = await Hexagon.bulkWrite(bulkUpdateOps, { session });
			updated = result.modifiedCount;
			console.log(`✅ Batch updated ${updated} hexagons`);
		}

		const couldNotUpdate = skippedIds.length;

		// Commit transaction
		await session.commitTransaction();

		console.log(`✅ Transaction committed`);
		console.log(`📊 Hexagons: ${created} created, ${updated} updated, ${couldNotUpdate} skipped`);

		res.json({
			success: true,
			activity: {
				id: activity._id,
				stravaActivityId: activity.stravaActivityId,
				name: activity.name,
				distance: activity.distance,
				wasCreated: wasActivityCreated,
			},
			hexagons: {
				totalParsed: hexagons.length,
				created,
				updated,
				couldNotUpdate,
				hexagonIds: hexagons,
				details: {
					created: createdIds,
					updated: updatedIds,
					skipped: skippedIds,
				},
			},
		});
	} catch (error: any) {
		await session.abortTransaction();
		console.error('❌ Error processing activity:', error);
		res.status(500).json({
			error: 'Failed to process activity',
			details: error.message,
		});
	} finally {
		session.endSession();
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
				createdAt: user.createdAt,
			},
		});
	} catch (error: any) {
		console.error('❌ Error fetching user:', error.message);
		res.status(500).json({
			error: 'Failed to fetch user',
			details: error.message,
		});
	}
});

export default router;
