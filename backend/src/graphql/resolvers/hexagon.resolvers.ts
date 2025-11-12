import { GraphQLError } from 'graphql';
import * as h3 from 'h3-js';
import { User } from '../../models/User';
import { Activity } from '../../models/Activity';
import { Hexagon, IHexagon, ICaptureHistoryEntry } from '../../models/Hexagon';
import { GraphQLContext, requireAuth, requireAdmin } from './auth.helpers';
import {
	PaginationArgs,
	UserIdWithPaginationArgs,
	BboxCoordinatesArgs,
	ParentHexagonIdsArg,
	HexagonIdArg,
	LimitArg,
	ParentHexagonIdsWithLimitArgs,
	CaptureHexagonsArgs,
} from './resolver.types';

export const hexagonResolvers = {
	Hexagon: {
		currentOwner: async (parent: IHexagon) => {
			try {
				const user = await User.findById(parent.currentOwnerId);
				return user;
			} catch (error) {
				return null;
			}
		},
		currentActivity: async (parent: IHexagon) => {
			try {
				const activity = await Activity.findById(parent.currentActivityId);
				return activity;
			} catch (error) {
				return null;
			}
		},
		firstCapturedBy: async (parent: IHexagon) => {
			try {
				const user = await User.findById(parent.firstCapturedBy);
				return user;
			} catch (error) {
				return null;
			}
		},
	},

	CaptureHistoryEntry: {
		user: async (parent: ICaptureHistoryEntry) => {
			try {
				const user = await User.findById(parent.userId);
				return user;
			} catch (error) {
				return null;
			}
		},
		activity: async (parent: ICaptureHistoryEntry) => {
			try {
				const activity = await Activity.findById(parent.activityId);
				return activity;
			} catch (error) {
				return null;
			}
		},
	},

	Query: {
		myHexagons: async (
			_: unknown,
			{ limit = 1000, offset = 0 }: PaginationArgs,
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
				throw new GraphQLError('Failed to fetch hexagons');
			}
		},

		myHexagonsInBbox: async (
			_: unknown,
			{ south, west, north, east }: BboxCoordinatesArgs,
			context: GraphQLContext
		) => {
			const user = requireAuth(context);

			try {
				const MAX_HEXAGONS = 5000;
				const hexagons = await Hexagon.find({ currentOwnerId: user._id })
					.select('-captureHistory')
					.limit(MAX_HEXAGONS)
					.sort({ lastCapturedAt: -1 });

				const hexagonsInBbox = hexagons.filter((hex) => {
					const center = h3.cellToLatLng(hex.hexagonId);
					const [lat, lng] = center;

					return lat >= south && lat <= north && lng >= west && lng <= east;
				});

				return hexagonsInBbox;
			} catch (error) {
				throw new GraphQLError('Failed to fetch hexagons in bounding box');
			}
		},

		hexagonsInBbox: async (
			_: unknown,
			{ south, west, north, east }: BboxCoordinatesArgs,
			context: GraphQLContext
		) => {
			requireAuth(context);

			try {
				const MAX_HEXAGONS = 10000;
				const hexagons = await Hexagon.find({})
					.select('-captureHistory')
					.limit(MAX_HEXAGONS)
					.sort({ lastCapturedAt: -1 });

				const hexagonsInBbox = hexagons.filter((hex) => {
					const center = h3.cellToLatLng(hex.hexagonId);
					const [lat, lng] = center;

					return lat >= south && lat <= north && lng >= west && lng <= east;
				});

				return hexagonsInBbox;
			} catch (error) {
				throw new GraphQLError('Failed to fetch hexagons in bounding box');
			}
		},

		hexagonsByParents: async (
			_: unknown,
			{ parentHexagonIds }: ParentHexagonIdsArg,
			context: GraphQLContext
		) => {
			requireAuth(context);

			try {
				const hexagons = await Hexagon.find({
					parentHexagonId: { $in: parentHexagonIds },
				}).select('-captureHistory');

				return hexagons;
			} catch (error) {
				throw new GraphQLError('Failed to fetch hexagons by parent IDs');
			}
		},

		hexagonsCount: async (_: unknown, __: Record<string, never>, context: GraphQLContext) => {
			requireAdmin(context);

			try {
				const count = await Hexagon.countDocuments();
				return count;
			} catch (error) {
				throw new GraphQLError('Failed to count hexagons');
			}
		},

		userHexagons: async (
			_: unknown,
			{ userId, limit = 1000, offset = 0 }: UserIdWithPaginationArgs,
			context: GraphQLContext
		) => {
			requireAuth(context);

			// Hexagons are public data (visible on map), no ownership check needed
			try {
				const hexagons = await Hexagon.find({ currentOwnerId: userId })
					.sort({ lastCapturedAt: -1 })
					.limit(limit)
					.skip(offset);
				return hexagons;
			} catch (error) {
				throw new GraphQLError('Failed to fetch hexagons');
			}
		},

		hexagonsStolenFromUser: async (
			_: unknown,
			{ userId }: { userId: string },
			context: GraphQLContext
		) => {
			requireAuth(context);

			try {
				// Find hexagons where the user appears in captureHistory but is NOT the current owner
				const hexagons = await Hexagon.find({
					currentOwnerId: { $ne: userId },
					'captureHistory.userId': userId,
				}).sort({ lastCapturedAt: -1 });

				return hexagons;
			} catch (error) {
				throw new GraphQLError('Failed to fetch stolen hexagons');
			}
		},

		hexagon: async (_: unknown, { hexagonId }: HexagonIdArg, context: GraphQLContext) => {
			requireAuth(context);

			try {
				const hexagon = await Hexagon.findOne({ hexagonId });
				return hexagon;
			} catch (error) {
				throw new GraphQLError('Failed to fetch hexagon');
			}
		},

		contestedHexagons: async (_: unknown, { limit = 100 }: LimitArg, context: GraphQLContext) => {
			requireAuth(context);

			try {
				const hexagons = await Hexagon.find()
					.select('-captureHistory')
					.sort({ captureCount: -1 })
					.limit(limit);
				return hexagons;
			} catch (error) {
				throw new GraphQLError('Failed to fetch contested hexagons');
			}
		},

		hexagons: async (
			_: unknown,
			{ limit = 1000, offset = 0 }: PaginationArgs,
			context: GraphQLContext
		) => {
			requireAdmin(context);

			try {
				const hexagons = await Hexagon.find()
					.select('-captureHistory')
					.sort({ lastCapturedAt: -1 })
					.limit(limit)
					.skip(offset);
				return hexagons;
			} catch (error) {
				throw new GraphQLError('Failed to fetch hexagons');
			}
		},

		regionalActiveLeaders: async (
			_: unknown,
			{ parentHexagonIds, limit = 10 }: ParentHexagonIdsWithLimitArgs,
			context: GraphQLContext
		) => {
			requireAuth(context);

			try {
				const leaderboard = await Hexagon.aggregate([
					{
						$match: {
							parentHexagonId: { $in: parentHexagonIds },
						},
					},
					{
						$group: {
							_id: '$currentOwnerId',
							hexCount: { $sum: 1 },
						},
					},
					{
						$sort: { hexCount: -1 },
					},
					{
						$limit: limit,
					},
				]);

				const results = await Promise.all(
					leaderboard.map(async (entry) => {
						const user = await User.findById(entry._id);
						return {
							user,
							hexCount: entry.hexCount,
						};
					})
				);

				return results;
			} catch (error) {
				throw new GraphQLError('Failed to fetch regional active leaders');
			}
		},

		regionalOGDiscoverers: async (
			_: unknown,
			{ parentHexagonIds, limit = 10 }: ParentHexagonIdsWithLimitArgs,
			context: GraphQLContext
		) => {
			requireAuth(context);

			try {
				const leaderboard = await Hexagon.aggregate([
					{
						$match: {
							parentHexagonId: { $in: parentHexagonIds },
						},
					},
					{
						$group: {
							_id: '$firstCapturedBy',
							hexCount: { $sum: 1 },
						},
					},
					{
						$sort: { hexCount: -1 },
					},
					{
						$limit: limit,
					},
				]);

				const results = await Promise.all(
					leaderboard.map(async (entry) => {
						const user = await User.findById(entry._id);
						return {
							user,
							hexCount: entry.hexCount,
						};
					})
				);

				return results;
			} catch (error) {
				throw new GraphQLError('Failed to fetch regional OG discoverers');
			}
		},
	},

	Mutation: {
		captureHexagons: async (
			_: unknown,
			{ activityId, hexagonIds, routeType }: CaptureHexagonsArgs,
			context: GraphQLContext
		) => {
			const currentUser = requireAuth(context);

			try {
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

				const capturedHexagons: IHexagon[] = [];
				let _newCaptures = 0;
				let _recaptures = 0;
				let _ownHexagons = 0;

				for (const hexagonId of hexagonIds) {
					const existingHex = await Hexagon.findOne({ hexagonId });

					const parentHexagonId = h3.cellToParent(hexagonId, 6);

					if (!existingHex) {
						const newHex = new Hexagon({
							hexagonId,
							parentHexagonId,
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
						_newCaptures++;
					} else if (String(existingHex.currentOwnerId) !== String(currentUser._id)) {
						const historyEntry: ICaptureHistoryEntry = {
							userId: existingHex.currentOwnerId,
							stravaId: existingHex.currentOwnerStravaId,
							activityId: existingHex.currentActivityId,
							stravaActivityId: existingHex.currentStravaActivityId,
							capturedAt: existingHex.lastCapturedAt,
							activityType: existingHex.activityType,
						};
						existingHex.captureHistory.push(historyEntry);

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
						_recaptures++;
					} else {
						capturedHexagons.push(existingHex);
						_ownHexagons++;
					}
				}

				return capturedHexagons;
			} catch (error) {
				if (error instanceof GraphQLError) {
					throw error;
				}
				throw new GraphQLError('Failed to capture hexagons');
			}
		},

		deleteHexagon: async (_: unknown, { hexagonId }: HexagonIdArg, context: GraphQLContext) => {
			requireAdmin(context);

			try {
				const result = await Hexagon.findOneAndDelete({ hexagonId });
				return result !== null;
			} catch (error) {
				return false;
			}
		},
	},
};
