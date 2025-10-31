import { GraphQLError } from 'graphql';
import { User } from '../../models/User';
import { Activity, IActivity } from '../../models/Activity';
import { GraphQLContext, requireAuth, requireAdmin } from './auth.helpers';

export const activityResolvers = {
  Activity: {
    // Field resolver: Populate user data
    user: async (parent: IActivity) => {
      try {
        const user = await User.findById(parent.userId);
        return user;
      } catch (error) {
        console.error('Error fetching user for activity:', error);
        return null;
      }
    },
  },

  Query: {
    // Get activities for current user
    myActivities: async (
      _: any,
      { limit = 50, offset = 0 }: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      try {
        const activities = await Activity.find({ userId: user._id })
          .sort({ startDate: -1 })
          .limit(limit)
          .skip(offset);
        return activities;
      } catch (error) {
        console.error('Error fetching activities:', error);
        throw new GraphQLError('Failed to fetch activities');
      }
    },

    // Get activities for a specific user
    userActivities: async (
      _: any,
      { userId, limit = 50, offset = 0 }: { userId: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const currentUser = requireAuth(context);

      // Allow if admin or requesting own activities
      if (!currentUser.isAdmin && String(currentUser._id) !== userId) {
        throw new GraphQLError('You can only view your own activities', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      try {
        const activities = await Activity.find({ userId })
          .sort({ startDate: -1 })
          .limit(limit)
          .skip(offset);
        return activities;
      } catch (error) {
        console.error('Error fetching user activities:', error);
        throw new GraphQLError('Failed to fetch activities');
      }
    },

    // Get single activity by ID
    activity: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const currentUser = requireAuth(context);

      try {
        const activity = await Activity.findById(id);
        if (!activity) {
          throw new GraphQLError('Activity not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Allow if admin or activity owner
        if (!currentUser.isAdmin && String(activity.userId) !== String(currentUser._id)) {
          throw new GraphQLError('You can only view your own activities', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        return activity;
      } catch (error) {
        console.error('Error fetching activity:', error);
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('Failed to fetch activity');
      }
    },

    // Get all activities (Admin only)
    activities: async (
      _: any,
      { limit = 50, offset = 0 }: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requireAdmin(context);

      try {
        const activities = await Activity.find()
          .sort({ startDate: -1 })
          .limit(limit)
          .skip(offset);
        return activities;
      } catch (error) {
        console.error('Error fetching all activities:', error);
        throw new GraphQLError('Failed to fetch activities');
      }
    },
  },

  Mutation: {
    // Delete activity by ID
    deleteActivity: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const currentUser = requireAuth(context);

      try {
        const activity = await Activity.findById(id);

        if (!activity) {
          throw new GraphQLError('Activity not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Allow if admin or activity owner
        if (!currentUser.isAdmin && String(activity.userId) !== String(currentUser._id)) {
          throw new GraphQLError('You can only delete your own activities', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        await Activity.findByIdAndDelete(id);
        return true;
      } catch (error) {
        console.error('Error deleting activity:', error);
        if (error instanceof GraphQLError) {
          throw error;
        }
        return false;
      }
    },
  },
};
