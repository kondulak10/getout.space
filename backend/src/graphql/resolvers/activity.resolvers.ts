import { GraphQLError } from 'graphql';
import { User } from '@/models/User';
import { Activity, IActivity } from '@/models/Activity';
import { Hexagon } from '@/models/Hexagon';
import { GraphQLContext, requireAuth, requireAdmin } from '@/graphql/resolvers/auth.helpers';
import mongoose from 'mongoose';

export const activityResolvers = {
	Activity: {
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

		userActivities: async (
			_: any,
			{ userId, limit = 50, offset = 0 }: { userId: string; limit?: number; offset?: number },
			context: GraphQLContext
		) => {
			const currentUser = requireAuth(context);

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

		activity: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
			const currentUser = requireAuth(context);

			try {
				const activity = await Activity.findById(id);
				if (!activity) {
					throw new GraphQLError('Activity not found', {
						extensions: { code: 'NOT_FOUND' },
					});
				}

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

		activities: async (
			_: any,
			{ limit = 50, offset = 0 }: { limit?: number; offset?: number },
			context: GraphQLContext
		) => {
			requireAdmin(context);

			try {
				const activities = await Activity.find().sort({ startDate: -1 }).limit(limit).skip(offset);
				return activities;
			} catch (error) {
				console.error('Error fetching all activities:', error);
				throw new GraphQLError('Failed to fetch activities');
			}
		},

		activitiesCount: async (_: any, __: any, context: GraphQLContext) => {
			requireAdmin(context);

			try {
				const count = await Activity.countDocuments();
				return count;
			} catch (error) {
				console.error('Error counting activities:', error);
				throw new GraphQLError('Failed to count activities');
			}
		},
	},

	Mutation: {
		deleteActivity: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
			const currentUser = requireAuth(context);
			const session = await mongoose.startSession();
			session.startTransaction();

			try {
				const activity = await Activity.findById(id).session(session);

				if (!activity) {
					await session.abortTransaction();
					throw new GraphQLError('Activity not found', {
						extensions: { code: 'NOT_FOUND' },
					});
				}

				if (!currentUser.isAdmin && String(activity.userId) !== String(currentUser._id)) {
					await session.abortTransaction();
					throw new GraphQLError('You can only delete your own activities', {
						extensions: { code: 'FORBIDDEN' },
					});
				}

				console.log(`🗑️ Deleting activity ${id} (Strava ID: ${activity.stravaActivityId})`);

				const hexagons = await Hexagon.find({
					currentActivityId: activity._id,
				}).session(session);

				console.log(`📦 Found ${hexagons.length} hexagons to process`);

				const hexagonsToDelete: string[] = [];
				const bulkUpdateOps: any[] = [];
				let restored = 0;
				let deleted = 0;

				for (const hexagon of hexagons) {
					if (hexagon.captureHistory && hexagon.captureHistory.length > 0) {
						const previousCapture = hexagon.captureHistory[hexagon.captureHistory.length - 1];

						bulkUpdateOps.push({
							updateOne: {
								filter: { _id: hexagon._id },
								update: {
									$set: {
										currentOwnerId: previousCapture.userId,
										currentOwnerStravaId: previousCapture.stravaId,
										currentActivityId: previousCapture.activityId,
										currentStravaActivityId: previousCapture.stravaActivityId,
										lastCapturedAt: previousCapture.capturedAt,
										activityType: previousCapture.activityType,
									},
									$pop: { captureHistory: 1 },
									$inc: { captureCount: -1 },
								},
							},
						});
						restored++;
					} else {
						hexagonsToDelete.push(hexagon.hexagonId);
						deleted++;
					}
				}

				if (bulkUpdateOps.length > 0) {
					await Hexagon.bulkWrite(bulkUpdateOps, { session });
					console.log(`✅ Restored ${restored} hexagons to previous owners`);
				}

				if (hexagonsToDelete.length > 0) {
					await Hexagon.deleteMany({
						hexagonId: { $in: hexagonsToDelete },
					}).session(session);
					console.log(`✅ Deleted ${deleted} hexagons with no capture history`);
				}

				await Activity.findByIdAndDelete(id).session(session);
				console.log(`✅ Activity deleted successfully`);

				await session.commitTransaction();
				return true;
			} catch (error) {
				await session.abortTransaction();
				console.error('Error deleting activity:', error);
				if (error instanceof GraphQLError) {
					throw error;
				}
				return false;
			} finally {
				session.endSession();
			}
		},
	},
};
