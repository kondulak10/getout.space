import cron from 'node-cron';
import { Mutex } from 'async-mutex';
import LeaderboardCache, { ILeaderboardEntry } from '../models/LeaderboardCache';
import { Hexagon } from '../models/Hexagon';

// Mutex to prevent concurrent leaderboard updates
const leaderboardMutex = new Mutex();

/**
 * Calculate and cache the global leaderboard
 * This runs an expensive aggregation query and stores results
 * Uses a mutex to prevent concurrent updates
 */
export async function updateGlobalLeaderboard(): Promise<void> {
	// Acquire mutex to prevent concurrent updates
	const release = await leaderboardMutex.acquire();

	try {
		console.log('🏆 Starting global leaderboard calculation...');
		const startTime = Date.now();
		// Single aggregation pipeline: count hexes, join users, join activities - ONE QUERY!
		const results = await Hexagon.aggregate([
			// 1. Only hexagons with owners
			{
				$match: {
					currentOwnerId: { $exists: true, $ne: null },
				},
			},
			// 2. Group by owner and count hexagons
			{
				$group: {
					_id: '$currentOwnerId',
					hexagonCount: { $sum: 1 },
				},
			},
			// 3. Join with User collection
			{
				$lookup: {
					from: 'users',
					localField: '_id',
					foreignField: '_id',
					as: 'user',
				},
			},
			{
				$unwind: '$user',
			},
			// 4. Join with Activity collection to count activities and sum distance
			{
				$lookup: {
					from: 'activities',
					localField: '_id',
					foreignField: 'userId',
					as: 'activities',
				},
			},
			// 5. Calculate activity stats
			{
				$addFields: {
					activityCount: { $size: '$activities' },
					totalDistance: { $sum: '$activities.distance' },
				},
			},
			// 6. Sort by hexagon count (descending)
			{
				$sort: { hexagonCount: -1 },
			},
			// 7. Project final shape
			{
				$project: {
					userId: '$_id',
					stravaId: '$user.stravaId',
					username: {
						$ifNull: [
							'$user.stravaProfile.username',
							{ $concat: ['$user.stravaProfile.firstname', ' ', '$user.stravaProfile.lastname'] },
						],
					},
					imghex: { $ifNull: ['$user.stravaProfile.imghex', 'default'] },
					profileImageUrl: '$user.stravaProfile.profile',
					hexagonCount: 1,
					activityCount: 1,
					totalDistance: 1,
				},
			},
		]);

		console.log(`📊 Found ${results.length} users with hexagons`);

		// Add ranks (can't do in aggregation because we need sequential numbers)
		const leaderboardEntries: ILeaderboardEntry[] = results.map((result, index) => ({
			...result,
			rank: index + 1,
		}));

		// Calculate next update time (1 hour from now)
		const now = new Date();
		const nextUpdate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

		// Upsert the leaderboard cache
		await LeaderboardCache.findOneAndUpdate(
			{ type: 'global' },
			{
				type: 'global',
				entries: leaderboardEntries,
				lastUpdated: now,
				nextUpdate: nextUpdate,
			},
			{ upsert: true, new: true }
		);

		const duration = Date.now() - startTime;
		console.log(
			`✅ Global leaderboard updated in ${duration}ms. Next update: ${nextUpdate.toISOString()}`
		);
	} catch (error) {
		console.error('❌ Error updating global leaderboard:', error);
		throw error;
	} finally {
		// Always release the mutex
		release();
	}
}

/**
 * Get the cached global leaderboard
 */
export async function getGlobalLeaderboard(): Promise<ILeaderboardEntry[]> {
	const cache = await LeaderboardCache.findOne({ type: 'global' });

	if (!cache) {
		// If no cache exists, trigger an immediate update
		console.log('⚠️ No leaderboard cache found, triggering immediate update...');
		await updateGlobalLeaderboard();

		// Fetch the newly created cache
		const newCache = await LeaderboardCache.findOne({ type: 'global' });
		return newCache?.entries || [];
	}

	return cache.entries;
}

/**
 * Initialize the leaderboard cron job
 * Runs every hour at minute 0
 */
export function initializeLeaderboardCron(): void {
	// Cron expression: "0 * * * *" = At minute 0 of every hour
	// For testing: "*/5 * * * *" = Every 5 minutes
	const cronExpression = '0 * * * *'; // Every hour

	cron.schedule(cronExpression, async () => {
		console.log('⏰ Leaderboard cron job triggered');
		await updateGlobalLeaderboard();
	});

	console.log(`🚀 Leaderboard cron job initialized (runs ${cronExpression})`);

	// Run immediately on startup to ensure we have data
	updateGlobalLeaderboard().catch((error) => {
		console.error('Failed to run initial leaderboard update:', error);
	});
}
