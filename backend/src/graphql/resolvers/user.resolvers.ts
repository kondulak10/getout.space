import { GraphQLError } from 'graphql';
import { User, IUser } from '../../models/User';
import { refreshStravaToken } from '../../utils/strava';
import { GraphQLContext, requireAuth, requireAdmin } from './auth.helpers';

export const userResolvers = {
  User: {
    // Field resolver: Check if token is expired
    tokenIsExpired: (parent: IUser) => {
      const now = Math.floor(Date.now() / 1000);
      return parent.tokenExpiresAt < now;
    },
  },

  Query: {
    // Get current authenticated user
    me: async (_: any, __: any, context: GraphQLContext) => {
      const user = requireAuth(context);
      return user;
    },

    // Get all users (Admin only)
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

    // Get user by ID (Admin or own profile)
    user: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const currentUser = requireAuth(context);

      // Allow if admin or requesting own profile
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
    // Delete user by ID (Admin only)
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

    // Delete current user's account and all data
    deleteMyAccount: async (_: any, __: any, context: GraphQLContext) => {
      const currentUser = requireAuth(context);

      try {
        const { Activity } = require('../../models/Activity');
        const { Hexagon } = require('../../models/Hexagon');

        console.log(`🗑️ User ${currentUser.stravaProfile.firstname} is deleting their account...`);

        // Delete all activities by this user
        const deletedActivities = await Activity.deleteMany({ userId: currentUser._id });
        console.log(`   ✓ Deleted ${deletedActivities.deletedCount} activities`);

        // Delete all hexagons owned by this user
        const deletedHexagons = await Hexagon.deleteMany({ currentOwnerId: currentUser._id });
        console.log(`   ✓ Deleted ${deletedHexagons.deletedCount} hexagons`);

        // Delete the user
        await User.findByIdAndDelete(currentUser._id);
        console.log(`   ✓ User account deleted`);

        return true;
      } catch (error) {
        console.error('❌ Error deleting user account:', error);
        throw new GraphQLError('Failed to delete account');
      }
    },

    // Refresh user's Strava token (Admin only)
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

        // Use shared token refresh helper
        const tokenData = await refreshStravaToken(user);

        // Update user's tokens in database
        user.accessToken = tokenData.access_token;
        user.refreshToken = tokenData.refresh_token;
        user.tokenExpiresAt = tokenData.expires_at;
        await user.save();

        // Return updated user
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
