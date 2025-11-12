import { GraphQLError } from 'graphql';
import { User } from '../../models/User';
import { Activity, IActivity } from '../../models/Activity';
import { GraphQLContext, requireAuth, requireAdmin } from './auth.helpers';
import { PaginationArgs, IdArg, UserIdWithPaginationArgs } from './resolver.types';
import { deleteActivityAndRestoreHexagons } from '../../services/activityProcessing.service';

export const activityResolvers = {
	Activity: {
		user: async (parent: IActivity) => {
			try {
				const user = await User.findById(parent.userId);
				return user;
			} catch (error) {
				return null;
			}
		},
	},

	Query: {
		myActivities: async (
			_: unknown,
			{ limit = 50, offset = 0 }: PaginationArgs,
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
				throw new GraphQLError('Failed to fetch activities');
			}
		},

		userActivities: async (
			_: unknown,
			{ userId, limit = 50, offset = 0 }: UserIdWithPaginationArgs,
			context: GraphQLContext
		) => {
			const currentUser = requireAuth(context);

			// Only allow viewing own activities or if admin
			if (!currentUser.isAdmin && String(currentUser._id) !== String(userId)) {
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
				throw new GraphQLError('Failed to fetch activities');
			}
		},

		activity: async (_: unknown, { id }: IdArg, context: GraphQLContext) => {
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
				if (error instanceof GraphQLError) {
					throw error;
				}
				throw new GraphQLError('Failed to fetch activity');
			}
		},

		activities: async (
			_: unknown,
			{ limit = 50, offset = 0 }: PaginationArgs,
			context: GraphQLContext
		) => {
			requireAdmin(context);

			try {
				const activities = await Activity.find().sort({ startDate: -1 }).limit(limit).skip(offset);
				return activities;
			} catch (error) {
				throw new GraphQLError('Failed to fetch activities');
			}
		},

		activitiesCount: async (_: unknown, __: Record<string, never>, context: GraphQLContext) => {
			requireAdmin(context);

			try {
				const count = await Activity.countDocuments();
				return count;
			} catch (error) {
				throw new GraphQLError('Failed to count activities');
			}
		},
	},

	Mutation: {
		deleteActivity: async (_: unknown, { id }: IdArg, context: GraphQLContext) => {
			const currentUser = requireAuth(context);

			try {
				const activity = await Activity.findById(id);

				if (!activity) {
					throw new GraphQLError('Activity not found', {
						extensions: { code: 'NOT_FOUND' },
					});
				}

				if (!currentUser.isAdmin && String(activity.userId) !== String(currentUser._id)) {
					throw new GraphQLError('You can only delete your own activities', {
						extensions: { code: 'FORBIDDEN' },
					});
				}

				await deleteActivityAndRestoreHexagons(activity.stravaActivityId, currentUser);
				return true;
			} catch (error) {
				if (error instanceof GraphQLError) {
					throw error;
				}
				const errorMessage = error instanceof Error ? error.message : 'Failed to delete activity';
				throw new GraphQLError(errorMessage, {
					extensions: { code: 'INTERNAL_SERVER_ERROR' },
				});
			}
		},
	},
};
