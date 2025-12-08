import mongoose from 'mongoose';
import polyline from '@mapbox/polyline';
import * as h3 from 'h3-js';
import * as Sentry from '@sentry/node';
import { Activity, IActivity } from '../models/Activity';
import { Hexagon, IHexagon } from '../models/Hexagon';
import { IUser } from '../models/User';
import { analyzeRouteAndConvertToHexagons } from '../utils/routeToHexagons';
import { fetchStravaActivity, getValidAccessToken, isRunningActivity } from './strava.service';
import { notificationService } from './notification.service';

export interface ProcessActivityResult {
	activity: {
		id: mongoose.Types.ObjectId;
		stravaActivityId: number;
		name: string;
		distance: number;
		wasCreated: boolean;
		lastHex?: string;
	};
	hexagons: {
		totalParsed: number;
		created: number;
		updated: number;
		couldNotUpdate: number;
		hexagonIds: string[];
		details: {
			created: string[];
			updated: string[];
			skipped: string[];
		};
	};
}

export interface DeleteActivityResult {
	message: string;
	hexagons: {
		restored: number;
		deleted: number;
	};
}

export async function processActivity(
	stravaActivityId: number,
	user: IUser,
	userId: string
): Promise<ProcessActivityResult> {
	// Set user context for error tracking
	Sentry.setUser({
		id: userId,
		username: `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`,
		stravaId: user.stravaId.toString(),
	});

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		console.log(
			`🎯 Processing Strava activity ${stravaActivityId} for user: ${user.stravaProfile.firstname}`
		);

		const accessToken = await getValidAccessToken(userId);

		const stravaActivity = await fetchStravaActivity(stravaActivityId, accessToken);

		if (!isRunningActivity(stravaActivity)) {
			const activityType = stravaActivity.type;
			const sportType = stravaActivity.sport_type;
			throw new Error(
				`Only running activities are allowed. Activity type "${activityType}" (sport type: "${sportType}") is not supported. Only Run, TrailRun, and VirtualRun activities can be processed.`
			);
		}

		if (!stravaActivity.map?.summary_polyline) {
			throw new Error('Activity has no GPS data (summary_polyline missing)');
		}

		const coordinates = polyline.decode(stravaActivity.map.summary_polyline) as [number, number][];

		const { hexagons, type: routeType } = analyzeRouteAndConvertToHexagons(coordinates);

		let activity = await Activity.findOne({ stravaActivityId }).session(session);
		let wasActivityCreated = false;

		if (activity) {
			activity.userId = user._id;
			activity.source = 'api';
			activity.name = stravaActivity.name;
			activity.type = stravaActivity.type;
			activity.sportType = stravaActivity.sport_type;
			activity.description = stravaActivity.description;
			activity.startDate = new Date(stravaActivity.start_date);
			activity.startDateLocal = new Date(stravaActivity.start_date_local);
			activity.timezone = stravaActivity.timezone;
			activity.movingTime = stravaActivity.moving_time;
			activity.elapsedTime = stravaActivity.elapsed_time;
			activity.distance = stravaActivity.distance;
			activity.elevationGain = stravaActivity.total_elevation_gain;
			activity.averageSpeed = stravaActivity.average_speed;
			activity.startLocation = stravaActivity.start_latlng
				? {
						lat: stravaActivity.start_latlng[0],
						lng: stravaActivity.start_latlng[1],
					}
				: undefined;
			activity.endLocation = stravaActivity.end_latlng
				? {
						lat: stravaActivity.end_latlng[0],
						lng: stravaActivity.end_latlng[1],
					}
				: undefined;
			activity.summaryPolyline = stravaActivity.map.summary_polyline;
			activity.isManual = stravaActivity.manual;
			activity.isPrivate = stravaActivity.private;
			await activity.save({ session });
		} else {
			activity = new Activity({
				stravaActivityId,
				userId: user._id,
				source: 'api',
				name: stravaActivity.name,
				type: stravaActivity.type,
				sportType: stravaActivity.sport_type,
				description: stravaActivity.description,
				startDate: new Date(stravaActivity.start_date),
				startDateLocal: new Date(stravaActivity.start_date_local),
				timezone: stravaActivity.timezone,
				movingTime: stravaActivity.moving_time,
				elapsedTime: stravaActivity.elapsed_time,
				distance: stravaActivity.distance,
				elevationGain: stravaActivity.total_elevation_gain,
				averageSpeed: stravaActivity.average_speed,
				startLocation: stravaActivity.start_latlng
					? {
							lat: stravaActivity.start_latlng[0],
							lng: stravaActivity.start_latlng[1],
						}
					: undefined,
				endLocation: stravaActivity.end_latlng
					? {
							lat: stravaActivity.end_latlng[0],
							lng: stravaActivity.end_latlng[1],
						}
					: undefined,
				summaryPolyline: stravaActivity.map.summary_polyline,
				isManual: stravaActivity.manual,
				isPrivate: stravaActivity.private,
			});
			await activity.save({ session });
			wasActivityCreated = true;
		}

		const hexagonStats = await processHexagons(hexagons, activity, user, routeType, session);

		if (hexagons.length > 0) {
			const firstHexParent = h3.cellToParent(hexagons[0], 6);

			await user.updateOne({ lastHex: firstHexParent }, { session });
			activity.lastHex = firstHexParent;
			await activity.save({ session });
		}

		await session.commitTransaction();
		const newHexCount = hexagonStats.created;
		const stolenCount =
			hexagonStats.affectedUsers.size > 0
				? Array.from(hexagonStats.affectedUsers.values()).reduce((sum, count) => sum + count, 0)
				: 0;

		if (newHexCount > 0 || stolenCount > 0) {
			try {
				await notificationService.createActivityNotification(userId, activity._id, {
					newHexCount,
					stolenCount,
				});
			} catch (error) {
				console.error('❌ Error creating activity notification:', error);
			}
		}

		if (hexagonStats.affectedUsers.size > 0) {
			const thiefName = user.stravaProfile?.firstname || user.stravaProfile?.username || 'Someone';

			for (const [affectedUserId, count] of hexagonStats.affectedUsers) {
				try {
					await notificationService.createStolenNotification(
						affectedUserId,
						userId,
						thiefName,
						count,
						activity._id
					);
				} catch (error) {
					console.error(`❌ Error creating stolen notification for user ${affectedUserId}:`, error);
				}
			}
		}

		console.log(`✅ Activity ${stravaActivityId} processed successfully!`);

		return {
			activity: {
				id: activity._id,
				stravaActivityId: activity.stravaActivityId,
				name: activity.name,
				distance: activity.distance,
				wasCreated: wasActivityCreated,
				lastHex: activity.lastHex,
			},
			hexagons: {
				totalParsed: hexagons.length,
				created: hexagonStats.created,
				updated: hexagonStats.updated,
				couldNotUpdate: hexagonStats.skipped,
				hexagonIds: hexagons,
				details: {
					created: hexagonStats.createdIds,
					updated: hexagonStats.updatedIds,
					skipped: hexagonStats.skippedIds,
				},
			},
		};
	} catch (error: unknown) {
		await session.abortTransaction();
		console.error('❌ Error processing activity:', error);

		// Add extra context to Sentry
		Sentry.setContext('activity', {
			stravaActivityId,
			userId,
			userName: `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`,
		});

		// Capture the error in Sentry
		Sentry.captureException(error);

		throw error instanceof Error ? error : new Error('Unknown error occurred');
	} finally {
		session.endSession();
	}
}

interface HexagonCreateDoc {
	hexagonId: string;
	parentHexagonId: string;
	currentOwnerId: mongoose.Types.ObjectId;
	currentOwnerStravaId: number;
	currentOwnerIsPremium: boolean;
	currentOwnerImghex?: string;
	currentActivityId: mongoose.Types.ObjectId;
	currentStravaActivityId: number;
	captureCount: number;
	firstCapturedAt: Date;
	firstCapturedBy: mongoose.Types.ObjectId;
	lastCapturedAt: Date;
	activityType: string;
	routeType: 'line' | 'area';
	captureHistory: never[];
}

async function processHexagons(
	hexagons: string[],
	activity: IActivity,
	user: IUser,
	routeType: 'line' | 'area',
	session: mongoose.ClientSession
) {
	const existingHexagons = await Hexagon.find({
		hexagonId: { $in: hexagons },
	}).session(session);

	const existingHexMap = new Map<string, IHexagon>();
	existingHexagons.forEach((hex) => {
		existingHexMap.set(hex.hexagonId, hex);
	});

	const hexagonsToCreate: HexagonCreateDoc[] = [];
	const bulkUpdateOps: mongoose.AnyBulkWriteOperation<IHexagon>[] = [];
	const createdIds: string[] = [];
	const updatedIds: string[] = [];
	const skippedIds: string[] = [];

	const affectedUsers = new Map<string, number>();

	const activityDate = activity.startDate.getTime();

	for (const hexagonId of hexagons) {
		const existingHex = existingHexMap.get(hexagonId);

		if (!existingHex) {
			const parentHexagonId = h3.cellToParent(hexagonId, 6);

			hexagonsToCreate.push({
				hexagonId,
				parentHexagonId,
				currentOwnerId: user._id,
				currentOwnerStravaId: user.stravaId,
				currentOwnerIsPremium: user.isPremium || false,
				currentOwnerImghex: user.stravaProfile?.imghex || undefined,
				currentActivityId: activity._id,
				currentStravaActivityId: activity.stravaActivityId,
				captureCount: 1,
				firstCapturedAt: activity.startDate,
				firstCapturedBy: user._id,
				lastCapturedAt: activity.startDate,
				activityType: activity.sportType || activity.type,
				routeType,
				captureHistory: [],
			});
			createdIds.push(hexagonId);
		} else {
			const hexDate = existingHex.lastCapturedAt.getTime();

			if (activityDate > hexDate) {
				const ownershipChanged = String(existingHex.currentOwnerId) !== String(user._id);

				const updateDoc: mongoose.UpdateQuery<IHexagon> = {
					$set: {
						currentOwnerId: user._id,
						currentOwnerStravaId: user.stravaId,
						currentOwnerIsPremium: user.isPremium || false,
						currentOwnerImghex: user.stravaProfile?.imghex || undefined,
						currentActivityId: activity._id,
						currentStravaActivityId: activity.stravaActivityId,
						lastCapturedAt: activity.startDate,
						activityType: activity.sportType || activity.type,
						routeType,
					},
				};

				if (ownershipChanged) {
					updateDoc.$push = {
						captureHistory: {
							userId: existingHex.currentOwnerId,
							stravaId: existingHex.currentOwnerStravaId,
							activityId: existingHex.currentActivityId,
							stravaActivityId: existingHex.currentStravaActivityId,
							capturedAt: existingHex.lastCapturedAt,
							activityType: existingHex.activityType,
						},
					};
					updateDoc.$inc = { captureCount: 1 };
					// Set lastPreviousOwnerId for efficient "stolen from" queries
					updateDoc.$set.lastPreviousOwnerId = existingHex.currentOwnerId;

					const previousOwnerId = existingHex.currentOwnerId.toString();
					affectedUsers.set(previousOwnerId, (affectedUsers.get(previousOwnerId) || 0) + 1);
				}

				bulkUpdateOps.push({
					updateOne: {
						filter: { hexagonId },
						update: updateDoc,
					},
				});
				updatedIds.push(hexagonId);
			} else {
				skippedIds.push(hexagonId);
			}
		}
	}

	let created = 0;
	let updated = 0;

	if (hexagonsToCreate.length > 0) {
		await Hexagon.insertMany(hexagonsToCreate, { session });
		created = hexagonsToCreate.length;
	}

	if (bulkUpdateOps.length > 0) {
		const result = await Hexagon.bulkWrite(bulkUpdateOps, { session });
		updated = result.modifiedCount;
	}

	return {
		created,
		updated,
		skipped: skippedIds.length,
		createdIds,
		updatedIds,
		skippedIds,
		affectedUsers,
	};
}

export async function deleteActivityAndRestoreHexagons(
	stravaActivityId: number,
	user: IUser
): Promise<DeleteActivityResult> {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const activity = await Activity.findOne({
			stravaActivityId: parseInt(String(stravaActivityId)),
		}).session(session);

		if (!activity) {
			throw new Error('Activity not found in database');
		}

		if (String(activity.userId) !== String(user._id) && !user.isAdmin) {
			throw new Error('You can only delete your own activities');
		}

		const hexagons = await Hexagon.find({
			currentActivityId: activity._id,
		}).session(session);

		const hexagonsToDelete: string[] = [];
		const bulkUpdateOps: mongoose.AnyBulkWriteOperation<IHexagon>[] = [];
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
		}

		if (hexagonsToDelete.length > 0) {
			await Hexagon.deleteMany({
				hexagonId: { $in: hexagonsToDelete },
			}).session(session);
		}

		await Activity.findByIdAndDelete(activity._id).session(session);

		await session.commitTransaction();

		return {
			message: 'Activity deleted successfully',
			hexagons: {
				restored,
				deleted,
			},
		};
	} catch (error: unknown) {
		await session.abortTransaction();
		console.error('❌ Error deleting activity:', error);
		throw error instanceof Error ? error : new Error('Unknown error occurred');
	} finally {
		session.endSession();
	}
}
