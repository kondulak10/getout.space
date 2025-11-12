import { GraphQLError } from 'graphql';
import { User, IUser } from '../../models/User';
import { Activity } from '../../models/Activity';
import { Hexagon } from '../../models/Hexagon';
import { refreshStravaToken } from '../../utils/strava';
import { GraphQLContext, requireAuth, requireAdmin } from './auth.helpers';
import { IdArg, UserIdArg } from './resolver.types';

export const userResolvers = {
	User: {
		tokenIsExpired: (parent: IUser) => {
			// Always return the value - these fields are only accessed via 'me' query (own data) or by admins
			const now = Math.floor(Date.now() / 1000);
			return parent.tokenExpiresAt < now;
		},

		tokenExpiresAt: (parent: IUser) => {
			// Always return the value - these fields are only accessed via 'me' query (own data) or by admins
			return parent.tokenExpiresAt;
		},
	},

	Query: {
		me: async (_: unknown, __: Record<string, never>, context: GraphQLContext) => {
			const user = requireAuth(context);
			return user;
		},

		users: async (_: unknown, __: Record<string, never>, context: GraphQLContext) => {
			requireAdmin(context);

			try {
				const users = await User.find().sort({ createdAt: -1 });
				return users;
			} catch (error) {
				throw new GraphQLError('Failed to fetch users');
			}
		},

		usersCount: async (_: unknown, __: Record<string, never>, context: GraphQLContext) => {
			requireAdmin(context);

			try {
				const count = await User.countDocuments();
				return count;
			} catch (error) {
				throw new GraphQLError('Failed to count users');
			}
		},

		user: async (_: unknown, { id }: IdArg, context: GraphQLContext) => {
			requireAuth(context);

			try {
				const user = await User.findById(id);
				if (!user) {
					throw new GraphQLError('User not found', {
						extensions: { code: 'NOT_FOUND' },
					});
				}
				return user;
			} catch (error) {
				throw new GraphQLError('Failed to fetch user');
			}
		},

		usersByIds: async (_: unknown, { ids }: { ids: string[] }, context: GraphQLContext) => {
			requireAuth(context);

			try {
				const users = await User.find({ _id: { $in: ids } });
				return users;
			} catch (error) {
				throw new GraphQLError('Failed to fetch users');
			}
		},

		userPublicStats: async (_: unknown, { userId }: UserIdArg, context: GraphQLContext) => {
			requireAuth(context);

			try {
				const user = await User.findById(userId);
				if (!user) {
					throw new GraphQLError('User not found', {
						extensions: { code: 'NOT_FOUND' },
					});
				}

				// Count activities and sum distance, moving time
				const activities = await Activity.find({ userId }).sort({ startDate: -1 });
				const totalActivities = activities.length;
				const totalDistance = activities.reduce(
					(sum, activity) => sum + (activity.distance || 0),
					0
				);
				const totalMovingTime = activities.reduce(
					(sum, activity) => sum + (activity.movingTime || 0),
					0
				);
				const latestActivityDate = activities.length > 0 ? activities[0].startDate : null;

				// Count hexagons owned by this user
				const totalHexagons = await Hexagon.countDocuments({ currentOwnerId: userId });

				return {
					id: user._id,
					stravaId: user.stravaId,
					stravaProfile: user.stravaProfile,
					totalActivities,
					totalDistance,
					totalMovingTime,
					latestActivityDate,
					totalHexagons,
					createdAt: user.createdAt,
				};
			} catch (error) {
				throw new GraphQLError('Failed to fetch user public stats');
			}
		},
	},

	Mutation: {
		deleteUser: async (_: unknown, { id }: IdArg, context: GraphQLContext) => {
			requireAdmin(context);

			try {
				const result = await User.findByIdAndDelete(id);
				return result !== null;
			} catch (error) {
				return false;
			}
		},

		deleteMyAccount: async (_: unknown, __: Record<string, never>, context: GraphQLContext) => {
			const currentUser = requireAuth(context);

			try {
				await Activity.deleteMany({ userId: currentUser._id });
				await Hexagon.deleteMany({ currentOwnerId: currentUser._id });
				await User.findByIdAndDelete(currentUser._id);

				return true;
			} catch (error) {
				throw new GraphQLError('Failed to delete account');
			}
		},

		refreshUserToken: async (_: unknown, { id }: IdArg, context: GraphQLContext) => {
			requireAdmin(context);

			try {
				const user = await User.findById(id);

				if (!user) {
					throw new GraphQLError('User not found', {
						extensions: { code: 'NOT_FOUND' },
					});
				}

				const tokenData = await refreshStravaToken(user);

				user.accessToken = tokenData.access_token;
				user.refreshToken = tokenData.refresh_token;
				user.tokenExpiresAt = tokenData.expires_at;
				await user.save();

				return user;
			} catch (error) {
				if (error instanceof GraphQLError) {
					throw error;
				}
				throw new GraphQLError('Failed to refresh token');
			}
		},
	},
};
