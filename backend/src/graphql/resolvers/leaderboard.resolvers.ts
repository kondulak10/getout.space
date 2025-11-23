import { GraphQLError } from 'graphql';
import { getGlobalLeaderboard } from '../../services/leaderboard.service';
import LeaderboardCache from '../../models/LeaderboardCache';
import { GraphQLContext, requireAuth } from './auth.helpers';

export const leaderboardResolvers = {
	Query: {
		/**
		 * Get global leaderboard (cached, updates hourly)
		 * Public query - no authentication required
		 */
		globalLeaderboard: async () => {
			try {
				const entries = await getGlobalLeaderboard();
				return entries;
			} catch (error) {
				console.error('Error fetching global leaderboard:', error);
				throw new GraphQLError('Failed to fetch leaderboard');
			}
		},

		/**
		 * Get full leaderboard cache with metadata
		 * Public query - no authentication required
		 */
		leaderboardCache: async () => {
			try {
				const cache = await LeaderboardCache.findOne({ type: 'global' });
				return cache;
			} catch (error) {
				console.error('Error fetching leaderboard cache:', error);
				throw new GraphQLError('Failed to fetch leaderboard cache');
			}
		},

		/**
		 * Get current user's global rank (just one number!)
		 * Requires authentication
		 */
		myGlobalRank: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const user = requireAuth(context);

			try {
				const cache = await LeaderboardCache.findOne({ type: 'global' });
				if (!cache) return null;

				// Find user's entry in cached leaderboard
				const entry = cache.entries.find((e) => e.userId.toString() === user._id.toString());
				return entry?.rank || null;
			} catch (error) {
				console.error('Error fetching user global rank:', error);
				throw new GraphQLError('Failed to fetch global rank');
			}
		},
	},
};
