import { GraphQLError } from 'graphql';
import { User, IUser } from '../../models/User';
import { Activity } from '../../models/Activity';
import { Hexagon } from '../../models/Hexagon';
import { refreshStravaToken } from '../../utils/strava';
import { GraphQLContext, requireAuth, requireAdmin } from './auth.helpers';

export const userResolvers = {
	User: {
		tokenIsExpired: (parent: IUser) => {
			const now = Math.floor(Date.now() / 1000);
			return parent.tokenExpiresAt < now;
		},
	},

	Query: {
		me: async (_: any, __: any, context: GraphQLContext) => {
			const user = requireAuth(context);
			return user;
		},

		users: async (_: any, __: any, context: GraphQLContext) => {
			requireAdmin(context);

			try {
				const users = await User.find().sort({ createdAt: -1 });
				return users;
			} catch (error) {
				console.error('Error fetching users:', error);
				throw new GraphQLError('Failed to fetch users');
			}
		},

		usersCount: async (_: any, __: any, context: GraphQLContext) => {
			requireAdmin(context);

			try {
				const count = await User.countDocuments();
				return count;
			} catch (error) {
				console.error('Error counting users:', error);
				throw new GraphQLError('Failed to count users');
			}
		},

		user: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
			const currentUser = requireAuth(context);

			if (!currentUser.isAdmin && String(currentUser._id) !== id) {
				throw new GraphQLError('You can only view your own profile', {
					extensions: { code: 'FORBIDDEN' },
				});
			}

			try {
				const user = await User.findById(id);
				if (!user) {
					throw new GraphQLError('User not found', {
						extensions: { code: 'NOT_FOUND' },
					});
				}
				return user;
			} catch (error) {
				console.error('Error fetching user:', error);
				throw new GraphQLError('Failed to fetch user');
			}
		},
	},

	Mutation: {
		deleteUser: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
			requireAdmin(context);

			try {
				const result = await User.findByIdAndDelete(id);
				return result !== null;
			} catch (error) {
				console.error('Error deleting user:', error);
				return false;
			}
		},

		deleteMyAccount: async (_: any, __: any, context: GraphQLContext) => {
			const currentUser = requireAuth(context);

			try {
				console.log(`🗑️ User ${currentUser.stravaProfile.firstname} is deleting their account...`);

				const deletedActivities = await Activity.deleteMany({ userId: currentUser._id });
				console.log(`   ✓ Deleted ${deletedActivities.deletedCount} activities`);

				const deletedHexagons = await Hexagon.deleteMany({ currentOwnerId: currentUser._id });
				console.log(`   ✓ Deleted ${deletedHexagons.deletedCount} hexagons`);

				await User.findByIdAndDelete(currentUser._id);
				console.log(`   ✓ User account deleted`);

				return true;
			} catch (error) {
				console.error('❌ Error deleting user account:', error);
				throw new GraphQLError('Failed to delete account');
			}
		},

		refreshUserToken: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
			requireAdmin(context);

			try {
				const user = await User.findById(id);

				if (!user) {
					throw new GraphQLError('User not found', {
						extensions: { code: 'NOT_FOUND' },
					});
				}

				console.log(`🔄 Admin-initiated token refresh for user: ${user.stravaProfile.firstname}`);

				const tokenData = await refreshStravaToken(user);

				user.accessToken = tokenData.access_token;
				user.refreshToken = tokenData.refresh_token;
				user.tokenExpiresAt = tokenData.expires_at;
				await user.save();

				return user;
			} catch (error) {
				console.error('Error refreshing user token:', error);
				if (error instanceof GraphQLError) {
					throw error;
				}
				throw new GraphQLError('Failed to refresh token');
			}
		},
	},
};
