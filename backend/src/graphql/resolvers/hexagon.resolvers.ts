import { GraphQLError } from 'graphql';
import { User } from '../../models/User';
import { Activity } from '../../models/Activity';
import { Hexagon, IHexagon, ICaptureHistoryEntry } from '../../models/Hexagon';
import { GraphQLContext, requireAuth, requireAdmin } from './auth.helpers';

export const hexagonResolvers = {
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
