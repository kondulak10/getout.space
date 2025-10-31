import { GraphQLError } from 'graphql';
import { User, IUser } from '../models/User';
import { Activity, IActivity } from '../models/Activity';
import { Hexagon, IHexagon, ICaptureHistoryEntry } from '../models/Hexagon';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { refreshStravaToken } from '../utils/strava';

// GraphQL Context type
export interface GraphQLContext {
  user?: IUser;
  userId?: string;
  isAuthenticated: boolean;
}

// Helper to check if user is authenticated
function requireAuth(context: GraphQLContext): IUser {
  if (!context.isAuthenticated || !context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

// Helper to check if user is admin
function requireAdmin(context: GraphQLContext): IUser {
  const user = requireAuth(context);
  if (!user.isAdmin) {
    throw new GraphQLError('Admin access required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}

export const resolvers = {
  User: {
    // Field resolver: Check if token is expired
    tokenIsExpired: (parent: IUser) => {
      const now = Math.floor(Date.now() / 1000);
      return parent.tokenExpiresAt < now;
    },
  },

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

  Hexagon: {
    // Field resolver: Populate current owner
    currentOwner: async (parent: IHexagon) => {
      try {
        const user = await User.findById(parent.currentOwnerId);
        return user;
      } catch (error) {
        console.error('Error fetching current owner for hexagon:', error);
        return null;
      }
    },
    // Field resolver: Populate current activity
    currentActivity: async (parent: IHexagon) => {
      try {
        const activity = await Activity.findById(parent.currentActivityId);
        return activity;
      } catch (error) {
        console.error('Error fetching current activity for hexagon:', error);
        return null;
      }
    },
    // Field resolver: Populate first capturer
    firstCapturedBy: async (parent: IHexagon) => {
      try {
        const user = await User.findById(parent.firstCapturedBy);
        return user;
      } catch (error) {
        console.error('Error fetching first capturer for hexagon:', error);
        return null;
      }
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

    // Get hexagons owned by current user
    myHexagons: async (
      _: any,
      { limit = 1000, offset = 0 }: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      try {
        const hexagons = await Hexagon.find({ currentOwnerId: user._id })
          .sort({ lastCapturedAt: -1 })
          .limit(limit)
          .skip(offset);
        return hexagons;
      } catch (error) {
        console.error('Error fetching user hexagons:', error);
        throw new GraphQLError('Failed to fetch hexagons');
      }
    },

    // Get hexagons owned by a specific user
    userHexagons: async (
      _: any,
      { userId, limit = 1000, offset = 0 }: { userId: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const hexagons = await Hexagon.find({ currentOwnerId: userId })
          .sort({ lastCapturedAt: -1 })
          .limit(limit)
          .skip(offset);
        return hexagons;
      } catch (error) {
        console.error('Error fetching user hexagons:', error);
        throw new GraphQLError('Failed to fetch hexagons');
      }
    },

    // Get single hexagon by H3 ID
    hexagon: async (_: any, { hexagonId }: { hexagonId: string }, context: GraphQLContext) => {
      requireAuth(context);

      try {
        const hexagon = await Hexagon.findOne({ hexagonId });
        return hexagon;
      } catch (error) {
        console.error('Error fetching hexagon:', error);
        throw new GraphQLError('Failed to fetch hexagon');
      }
    },

    // Get most contested hexagons
    contestedHexagons: async (
      _: any,
      { limit = 100 }: { limit?: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      try {
        const hexagons = await Hexagon.find()
          .sort({ captureCount: -1 })
          .limit(limit);
        return hexagons;
      } catch (error) {
        console.error('Error fetching contested hexagons:', error);
        throw new GraphQLError('Failed to fetch contested hexagons');
      }
    },

    // Get all hexagons (Admin only)
    hexagons: async (
      _: any,
      { limit = 1000, offset = 0 }: { limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      requireAdmin(context);

      try {
        const hexagons = await Hexagon.find()
          .sort({ lastCapturedAt: -1 })
          .limit(limit)
          .skip(offset);
        return hexagons;
      } catch (error) {
        console.error('Error fetching all hexagons:', error);
        throw new GraphQLError('Failed to fetch hexagons');
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

    // Capture hexagons from an activity
    captureHexagons: async (
      _: any,
      { activityId, hexagonIds, routeType }: { activityId: string; hexagonIds: string[]; routeType?: string },
      context: GraphQLContext
    ) => {
      const currentUser = requireAuth(context);

      try {
        // Verify activity exists and belongs to current user
        const activity = await Activity.findById(activityId);

        if (!activity) {
          throw new GraphQLError('Activity not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        if (String(activity.userId) !== String(currentUser._id)) {
          throw new GraphQLError('You can only capture hexagons from your own activities', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        console.log(`🎯 Capturing ${hexagonIds.length} hexagons for activity ${activity.name}`);

        const capturedHexagons: IHexagon[] = [];
        let newCaptures = 0;
        let recaptures = 0;
        let ownHexagons = 0;

        // Process each hexagon
        for (const hexagonId of hexagonIds) {
          const existingHex = await Hexagon.findOne({ hexagonId });

          if (!existingHex) {
            // First capture - create new hexagon
            const newHex = new Hexagon({
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

            await newHex.save();
            capturedHexagons.push(newHex);
            newCaptures++;
          } else if (String(existingHex.currentOwnerId) !== String(currentUser._id)) {
            // Recapture - hex owned by someone else
            // Add previous owner to history
            const historyEntry: ICaptureHistoryEntry = {
              userId: existingHex.currentOwnerId,
              stravaId: existingHex.currentOwnerStravaId,
              activityId: existingHex.currentActivityId,
              stravaActivityId: existingHex.currentStravaActivityId,
              capturedAt: existingHex.lastCapturedAt,
              activityType: existingHex.activityType,
            };
            existingHex.captureHistory.push(historyEntry);

            // Update to new owner
            existingHex.currentOwnerId = currentUser._id;
            existingHex.currentOwnerStravaId = currentUser.stravaId;
            existingHex.currentActivityId = activity._id;
            existingHex.currentStravaActivityId = activity.stravaActivityId;
            existingHex.captureCount += 1;
            existingHex.lastCapturedAt = activity.startDate;
            existingHex.activityType = activity.sportType || activity.type;
            if (routeType) existingHex.routeType = routeType as 'line' | 'area';

            await existingHex.save();
            capturedHexagons.push(existingHex);
            recaptures++;
          } else {
            // Already owned by current user - no action needed
            capturedHexagons.push(existingHex);
            ownHexagons++;
          }
        }

        console.log(`✅ Capture complete: ${newCaptures} new, ${recaptures} recaptured, ${ownHexagons} already owned`);

        return capturedHexagons;
      } catch (error) {
        console.error('Error capturing hexagons:', error);
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('Failed to capture hexagons');
      }
    },

    // Delete hexagon by H3 ID (Admin only)
    deleteHexagon: async (_: any, { hexagonId }: { hexagonId: string }, context: GraphQLContext) => {
      requireAdmin(context);

      try {
        const result = await Hexagon.findOneAndDelete({ hexagonId });
        return result !== null;
      } catch (error) {
        console.error('Error deleting hexagon:', error);
        return false;
      }
    },
  },
};
