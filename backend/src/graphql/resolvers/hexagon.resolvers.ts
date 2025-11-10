import { GraphQLError } from 'graphql';
import * as h3 from 'h3-js';
import { User } from '@/models/User';
import { Activity } from '@/models/Activity';
import { Hexagon, IHexagon, ICaptureHistoryEntry } from '@/models/Hexagon';
import { GraphQLContext, requireAuth, requireAdmin } from '@/graphql/resolvers/auth.helpers';

export const hexagonResolvers = {
	Hexagon: {
		currentOwner: async (parent: IHexagon) => {
			try {
				const user = await User.findById(parent.currentOwnerId);
				return user;
			} catch (error) {
				console.error('Error fetching current owner for hexagon:', error);
				return null;
			}
		},
		currentActivity: async (parent: IHexagon) => {
			try {
				const activity = await Activity.findById(parent.currentActivityId);
				return activity;
			} catch (error) {
				console.error('Error fetching current activity for hexagon:', error);
				return null;
			}
		},
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

	CaptureHistoryEntry: {
		user: async (parent: ICaptureHistoryEntry) => {
			try {
				const user = await User.findById(parent.userId);
				return user;
			} catch (error) {
				console.error('Error fetching user for capture history entry:', error);
				return null;
			}
		},
		activity: async (parent: ICaptureHistoryEntry) => {
			try {
				const activity = await Activity.findById(parent.activityId);
				return activity;
			} catch (error) {
				console.error('Error fetching activity for capture history entry:', error);
				return null;
			}
		},
	},

	Query: {
		myHexagons: async (
			_: any,
			{ limit = 1000, offset = 0 }: { limit?: number; offset?: number },
			context: GraphQLContext
		) => {
			const user = requireAuth(context);

			try {
				const hexagons = await Hexagon.find({ currentOwnerId: user._id })
					.select('-captureHistory')
					.sort({ lastCapturedAt: -1 })
					.limit(limit)
					.skip(offset);
				return hexagons;
			} catch (error) {
				console.error('Error fetching user hexagons:', error);
				throw new GraphQLError('Failed to fetch hexagons');
			}
		},

		myHexagonsInBbox: async (
			_: any,
			{ south, west, north, east }: { south: number; west: number; north: number; east: number },
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

				if (hexagons.length === MAX_HEXAGONS) {
					console.warn(
						`⚠️  User ${user._id} has more than ${MAX_HEXAGONS} hexagons. Consider implementing geospatial indexing.`
					);
				}

				return hexagonsInBbox;
			} catch (error) {
				console.error('Error fetching user hexagons in bbox:', error);
				throw new GraphQLError('Failed to fetch hexagons in bounding box');
			}
		},

		hexagonsInBbox: async (
			_: any,
			{ south, west, north, east }: { south: number; west: number; north: number; east: number },
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

				if (hexagons.length === MAX_HEXAGONS) {
					console.warn(
						`⚠️  Database has more than ${MAX_HEXAGONS} hexagons in this area. Consider implementing geospatial indexing.`
					);
				}

				return hexagonsInBbox;
			} catch (error) {
				console.error('Error fetching all hexagons in bbox:', error);
				throw new GraphQLError('Failed to fetch hexagons in bounding box');
			}
		},

		hexagonsByParents: async (
			_: any,
			{ parentHexagonIds }: { parentHexagonIds: string[] },
			context: GraphQLContext
		) => {
			requireAuth(context);

			try {
				console.log(`📡 Fetching all hexagons under ${parentHexagonIds.length} parent hexagons`);

				const hexagons = await Hexagon.find({
					parentHexagonId: { $in: parentHexagonIds },
				}).select('-captureHistory');

				console.log(
					`✅ Fetched ${hexagons.length} hexagons from ${parentHexagonIds.length} parents`
				);
				return hexagons;
			} catch (error) {
				console.error('Error fetching hexagons by parents:', error);
				throw new GraphQLError('Failed to fetch hexagons by parent IDs');
			}
		},

		hexagonsCount: async (_: any, __: any, context: GraphQLContext) => {
			requireAdmin(context);

			try {
				const count = await Hexagon.countDocuments();
				return count;
			} catch (error) {
				console.error('Error counting all hexagons:', error);
				throw new GraphQLError('Failed to count hexagons');
			}
		},

		userHexagons: async (
			_: any,
			{ userId, limit = 1000, offset = 0 }: { userId: string; limit?: number; offset?: number },
			context: GraphQLContext
		) => {
			requireAuth(context);

			try {
				const hexagons = await Hexagon.find({ currentOwnerId: userId })
					.select('-captureHistory')
					.sort({ lastCapturedAt: -1 })
					.limit(limit)
					.skip(offset);
				return hexagons;
			} catch (error) {
				console.error('Error fetching user hexagons:', error);
				throw new GraphQLError('Failed to fetch hexagons');
			}
		},

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

		contestedHexagons: async (
			_: any,
			{ limit = 100 }: { limit?: number },
			context: GraphQLContext
		) => {
			requireAuth(context);

			try {
				const hexagons = await Hexagon.find()
					.select('-captureHistory')
					.sort({ captureCount: -1 })
					.limit(limit);
				return hexagons;
			} catch (error) {
				console.error('Error fetching contested hexagons:', error);
				throw new GraphQLError('Failed to fetch contested hexagons');
			}
		},

		hexagons: async (
			_: any,
			{ limit = 1000, offset = 0 }: { limit?: number; offset?: number },
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
				console.error('Error fetching all hexagons:', error);
				throw new GraphQLError('Failed to fetch hexagons');
			}
		},
	},

	Mutation: {
		captureHexagons: async (
			_: any,
			{
				activityId,
				hexagonIds,
				routeType,
			}: { activityId: string; hexagonIds: string[]; routeType?: string },
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

				console.log(`🎯 Capturing ${hexagonIds.length} hexagons for activity ${activity.name}`);

				const capturedHexagons: IHexagon[] = [];
				let newCaptures = 0;
				let recaptures = 0;
				let ownHexagons = 0;

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
						newCaptures++;
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
						recaptures++;
					} else {
						capturedHexagons.push(existingHex);
						ownHexagons++;
					}
				}

				console.log(
					`✅ Capture complete: ${newCaptures} new, ${recaptures} recaptured, ${ownHexagons} already owned`
				);

				return capturedHexagons;
			} catch (error) {
				console.error('Error capturing hexagons:', error);
				if (error instanceof GraphQLError) {
					throw error;
				}
				throw new GraphQLError('Failed to capture hexagons');
			}
		},

		deleteHexagon: async (
			_: any,
			{ hexagonId }: { hexagonId: string },
			context: GraphQLContext
		) => {
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
