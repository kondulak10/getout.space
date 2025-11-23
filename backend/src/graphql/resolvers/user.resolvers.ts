import { GraphQLError } from 'graphql';
import { User, IUser } from '../../models/User';
import { Activity } from '../../models/Activity';
import { Hexagon } from '../../models/Hexagon';
import { refreshStravaToken } from '../../utils/strava';
import { GraphQLContext, requireAuth, requireAdmin } from './auth.helpers';
import { IdArg, UserIdArg } from './resolver.types';
import { isValidEmail } from '../../constants/validation';

export const userResolvers = {
	User: {
		tokenIsExpired: (parent: IUser, _: unknown, context: GraphQLContext) => {
			// Only return for own profile or admin
			if (context.userId?.toString() === parent._id.toString() || context.user?.isAdmin) {
				const now = Math.floor(Date.now() / 1000);
				return parent.tokenExpiresAt < now;
			}
			throw new GraphQLError('Unauthorized to view token status', {
				extensions: { code: 'FORBIDDEN' },
			});
		},

		tokenExpiresAt: (parent: IUser, _: unknown, context: GraphQLContext) => {
			// Only return for own profile or admin
			if (context.userId?.toString() === parent._id.toString() || context.user?.isAdmin) {
				return parent.tokenExpiresAt;
			}
			throw new GraphQLError('Unauthorized to view token expiration', {
				extensions: { code: 'FORBIDDEN' },
			});
		},

		email: (parent: IUser, _: unknown, context: GraphQLContext) => {
			// Only return for own profile or admin
			if (context.userId?.toString() === parent._id.toString() || context.user?.isAdmin) {
				return parent.email || null;
			}
			return null; // Hide email from others
		},

		/**
		 * Conditional resolver for activityCount
		 *
		 * IMPORTANT: This field is ONLY populated when user.email is null.
		 * This is intentional to determine if we should show the email collection overlay.
		 *
		 * Frontend dependency: AuthProvider.tsx checks both hasEmail and activityCount
		 * to show the overlay after 3+ activities if email is not set.
		 *
		 * @returns {number|null} Activity count if email is null, otherwise null
		 */
		activityCount: async (parent: IUser) => {
			// Only count activities if email is null (to decide if we should show email overlay)
			if (parent.email) {
				return null;
			}
			try {
				const count = await Activity.countDocuments({ userId: parent._id });
				return count;
			} catch (error) {
				return null;
			}
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

		updateEmail: async (_: unknown, { email }: { email: string }, context: GraphQLContext) => {
			const currentUser = requireAuth(context);

			// Validate email format using shared validation function
			if (!isValidEmail(email)) {
				throw new GraphQLError('Invalid email format', {
					extensions: { code: 'INVALID_INPUT' },
				});
			}

			try {
				// Check if email already exists (excluding current user)
				// Note: email.toLowerCase() is redundant since User model has lowercase: true,
				// but keeping for explicit clarity
				const existingUser = await User.findOne({
					email: email.toLowerCase(),
					_id: { $ne: currentUser._id },
				});

				if (existingUser) {
					throw new GraphQLError('Email already in use', {
						extensions: { code: 'EMAIL_IN_USE' },
					});
				}

				// Update user email
				currentUser.email = email.toLowerCase();
				await currentUser.save();

				return currentUser;
			} catch (error) {
				if (error instanceof GraphQLError) {
					throw error;
				}
				throw new GraphQLError('Failed to update email');
			}
		},
	},
};
