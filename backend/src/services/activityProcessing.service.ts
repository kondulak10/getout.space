import mongoose from 'mongoose';
import polyline from '@mapbox/polyline';
import { Activity, IActivity } from '../models/Activity';
import { Hexagon, IHexagon } from '../models/Hexagon';
import { IUser } from '../models/User';
import { analyzeRouteAndConvertToHexagons } from '../utils/routeToHexagons';
import { fetchStravaActivity, getValidAccessToken, isRunningActivity, StravaActivityData } from './strava.service';

/**
 * Result of processing an activity
 */
export interface ProcessActivityResult {
	activity: {
		id: mongoose.Types.ObjectId;
		stravaActivityId: number;
		name: string;
		distance: number;
		wasCreated: boolean;
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

/**
 * Result of deleting an activity
 */
export interface DeleteActivityResult {
	message: string;
	hexagons: {
		restored: number;
		deleted: number;
	};
}

/**
 * Process a Strava activity: fetch from API, decode polyline, create/update hexagons
 *
 * @param stravaActivityId - Strava activity ID
 * @param user - Current user
 * @param userId - User's MongoDB ID
 * @returns Processing result with activity and hexagon statistics
 * @throws Error if processing fails
 */
export async function processActivity(
	stravaActivityId: number,
	user: IUser,
	userId: string
): Promise<ProcessActivityResult> {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		console.log(`🎯 Processing Strava activity ${stravaActivityId} for user: ${user.stravaProfile.firstname}`);

		// Get valid access token (auto-refreshes if needed)
		const accessToken = await getValidAccessToken(userId);

		// Fetch activity details from Strava (pass userId for 401 retry with token refresh)
		const stravaActivity = await fetchStravaActivity(stravaActivityId, accessToken, userId);

		// Validate activity type - only allow running activities
		if (!isRunningActivity(stravaActivity)) {
			const activityType = stravaActivity.type;
			const sportType = stravaActivity.sport_type;
			throw new Error(
				`Only running activities are allowed. Activity type "${activityType}" (sport type: "${sportType}") is not supported. Only Run, TrailRun, and VirtualRun activities can be processed.`
			);
		}

		// Validate activity has polyline
		if (!stravaActivity.map?.summary_polyline) {
			throw new Error('Activity has no GPS data (summary_polyline missing)');
		}

		console.log(`📍 Activity: ${stravaActivity.name} - ${stravaActivity.type}`);

		// Decode polyline to coordinates
		const coordinates = polyline.decode(stravaActivity.map.summary_polyline) as [number, number][];
		console.log(`📍 Decoded ${coordinates.length} GPS points`);

		// Convert coordinates to hexagons
		const { hexagons, type: routeType } = analyzeRouteAndConvertToHexagons(coordinates);
		console.log(`🔷 Generated ${hexagons.length} hexagons (type: ${routeType})`);

		// Save/Update Activity
		let activity = await Activity.findOne({ stravaActivityId }).session(session);
		let wasActivityCreated = false;

		if (activity) {
			console.log(`📝 Updating existing activity ${activity._id}`);
			// Update all fields
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
			console.log(`✨ Creating new activity`);
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

		console.log(`✅ Activity saved: ${activity._id}`);

		// Process hexagons in batch
		const hexagonStats = await processHexagons(hexagons, activity, user, routeType, session);

		// Commit transaction
		await session.commitTransaction();

		console.log(`✅ Transaction committed`);
		console.log(`📊 Hexagons: ${hexagonStats.created} created, ${hexagonStats.updated} updated, ${hexagonStats.skipped} skipped`);

		return {
			activity: {
				id: activity._id,
				stravaActivityId: activity.stravaActivityId,
				name: activity.name,
				distance: activity.distance,
				wasCreated: wasActivityCreated,
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
		throw error instanceof Error ? error : new Error('Unknown error occurred');
	} finally {
		session.endSession();
	}
}

/**
 * Hexagon creation document type
 */
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

/**
 * Process hexagons for an activity
 */
async function processHexagons(
	hexagons: string[],
	activity: IActivity,
	user: IUser,
	routeType: 'line' | 'area',
	session: mongoose.ClientSession
) {
	// Import h3 for parent calculation
	const h3 = require('h3-js');

	// Step 1: Fetch all existing hexagons in one query
	const existingHexagons = await Hexagon.find({
		hexagonId: { $in: hexagons },
	}).session(session);

	// Create a map for quick lookup
	const existingHexMap = new Map<string, IHexagon>();
	existingHexagons.forEach((hex) => {
		existingHexMap.set(hex.hexagonId, hex);
	});

	// Step 2: Separate into creates, updates, and skips
	const hexagonsToCreate: HexagonCreateDoc[] = [];
	const bulkUpdateOps: mongoose.AnyBulkWriteOperation<IHexagon>[] = [];
	const createdIds: string[] = [];
	const updatedIds: string[] = [];
	const skippedIds: string[] = [];

	const activityDate = activity.startDate.getTime();

	for (const hexagonId of hexagons) {
		const existingHex = existingHexMap.get(hexagonId);

		if (!existingHex) {
			// New hexagon - prepare for batch insert
			// Calculate parent hexagon (resolution 6 for good balance)
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
			// Existing hexagon - check if we can update it
			const hexDate = existingHex.lastCapturedAt.getTime();

			if (activityDate > hexDate) {
				// Activity is newer - prepare update operation
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

				// Check if ownership changed
				if (ownershipChanged) {
					// Add previous owner to capture history
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
				}

				bulkUpdateOps.push({
					updateOne: {
						filter: { hexagonId },
						update: updateDoc,
					},
				});
				updatedIds.push(hexagonId);
			} else {
				// Activity is older - skip
				skippedIds.push(hexagonId);
			}
		}
	}

	// Step 3: Execute batch operations
	let created = 0;
	let updated = 0;

	if (hexagonsToCreate.length > 0) {
		await Hexagon.insertMany(hexagonsToCreate, { session });
		created = hexagonsToCreate.length;
		console.log(`✅ Batch created ${created} hexagons`);
	}

	if (bulkUpdateOps.length > 0) {
		const result = await Hexagon.bulkWrite(bulkUpdateOps, { session });
		updated = result.modifiedCount;
		console.log(`✅ Batch updated ${updated} hexagons`);
	}

	return {
		created,
		updated,
		skipped: skippedIds.length,
		createdIds,
		updatedIds,
		skippedIds,
	};
}

/**
 * Delete an activity and restore hexagon ownership
 *
 * @param stravaActivityId - Strava activity ID
 * @param user - Current user
 * @returns Deletion result with hexagon statistics
 * @throws Error if deletion fails
 */
export async function deleteActivityAndRestoreHexagons(
	stravaActivityId: number,
	user: IUser
): Promise<DeleteActivityResult> {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		console.log(`🗑️ Deleting activity ${stravaActivityId} for user: ${user.stravaProfile.firstname}`);

		// Find activity by Strava activity ID
		const activity = await Activity.findOne({
			stravaActivityId: parseInt(String(stravaActivityId)),
		}).session(session);

		if (!activity) {
			throw new Error('Activity not found in database');
		}

		// Check ownership
		if (String(activity.userId) !== String(user._id) && !user.isAdmin) {
			throw new Error('You can only delete your own activities');
		}

		// Find all hexagons captured by this activity
		const hexagons = await Hexagon.find({
			currentActivityId: activity._id,
		}).session(session);

		console.log(`📦 Found ${hexagons.length} hexagons to process`);

		// Process each hexagon
		const hexagonsToDelete: string[] = [];
		const bulkUpdateOps: mongoose.AnyBulkWriteOperation<IHexagon>[] = [];
		let restored = 0;
		let deleted = 0;

		for (const hexagon of hexagons) {
			if (hexagon.captureHistory && hexagon.captureHistory.length > 0) {
				// Restore previous owner from capture history
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
							$pop: { captureHistory: 1 }, // Remove last entry from history
							$inc: { captureCount: -1 }, // Decrement capture count
						},
					},
				});
				restored++;
			} else {
				// No capture history - delete the hexagon entirely
				hexagonsToDelete.push(hexagon.hexagonId);
				deleted++;
			}
		}

		// Execute bulk operations
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

		// Delete the activity
		await Activity.findByIdAndDelete(activity._id).session(session);
		console.log(`✅ Activity deleted successfully`);

		// Commit transaction
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
