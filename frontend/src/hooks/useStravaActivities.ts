import { useState } from 'react';
import polyline from '@mapbox/polyline';
import {
	fetchActivities,
	fetchActivityDetails,
	fetchAthleteStats,
	processActivity,
	deleteActivity,
	type StravaActivity,
	type ActivityDetails,
} from '@/services/stravaApi.service';

/**
 * Hook for managing Strava activities - fetching, processing, deleting
 */
export function useStravaActivities() {
	const [activities, setActivities] = useState<StravaActivity[]>([]);
	const [selectedActivity, setSelectedActivity] = useState<ActivityDetails | null>(null);
	const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMoreActivities, setHasMoreActivities] = useState(true);
	const [totalRunCount, setTotalRunCount] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);

	const perPage = 30;

	/**
	 * Fetch athlete statistics
	 */
	const loadAthleteStats = async () => {
		try {
			console.log('📊 Fetching athlete stats...');
			const data = await fetchAthleteStats();

			if (data.success) {
				console.log(`✅ Total runs: ${data.runCount}`);
				setTotalRunCount(data.runCount);
			}
		} catch (error) {
			console.error('❌ Failed to fetch stats:', error);
		}
	};

	/**
	 * Fetch activities for a specific page
	 */
	const loadActivities = async (page: number = currentPage) => {
		setLoading(true);
		try {
			// Fetch stats on first page load
			if (page === 1 && totalRunCount === null) {
				await loadAthleteStats();
			}

			console.log(`🏃 Fetching Strava activities page ${page}...`);

			const data = await fetchActivities(page, perPage);

			if (data.success) {
				console.log(`✅ Fetched ${data.count} activities from page ${data.page}!`);
				console.log('Activities:', data.activities);
				setActivities(data.activities);
				setCurrentPage(data.page);
				setHasMoreActivities(data.hasMorePages ?? false);
			} else {
				console.error('❌ Error:', data.error);
			}
		} catch (error) {
			console.error('❌ Failed to fetch activities:', error);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Load activity details and decode polyline
	 */
	const loadActivityDetails = async (activityId: number) => {
		try {
			console.log(`🔍 Fetching details for activity ${activityId}...`);

			const data = await fetchActivityDetails(activityId);

			if (data.success) {
				console.log(`✅ Activity ${activityId} details:`);
				console.log(data.activity);

				// Decode polyline if available
				if (data.activity.map?.polyline) {
					const decoded = polyline.decode(data.activity.map.polyline);
					console.log(`📍 Decoded ${decoded.length} GPS points`);
					setRouteCoordinates(decoded);
					setSelectedActivity(data.activity);
				} else {
					console.warn('⚠️ No map data available for this activity');
					setRouteCoordinates([]);
					setSelectedActivity(null);
				}
			} else {
				console.error('❌ Error:', data.error);
			}
		} catch (error) {
			console.error('❌ Failed to fetch activity details:', error);
		}
	};

	/**
	 * Process (save) an activity to the database
	 */
	const saveActivity = async (activityId: number): Promise<void> => {
		try {
			console.log(`💾 Processing activity ${activityId}...`);

			const data = await processActivity(activityId);

			if (data.success) {
				console.log(`✅ Activity processed successfully!`);
				console.log(
					`📊 Hexagons: ${data.hexagons.created} created, ${data.hexagons.updated} captured, ${data.hexagons.couldNotUpdate} skipped`
				);
				console.log(`📊 Hexagons: ${data.hexagons.totalParsed} total, ✨ ${data.hexagons.created} created, 🎯 ${data.hexagons.updated} captured, ⏭️ ${data.hexagons.couldNotUpdate} skipped`);

				setActivities((prevActivities) =>
					prevActivities.map((activity) =>
						activity.id === activityId ? { ...activity, isStored: true } : activity
					)
				);
			} else {
				console.error('❌ Error:', data.error);
				console.error(`Failed to process activity: ${data.error || data.details || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('❌ Failed to process activity:', error);
			console.error(`Error: ${error instanceof Error ? error.message : 'Network error'}`);
		}
	};

	/**
	 * Delete an activity from the database
	 */
	const removeActivity = async (activityId: number): Promise<void> => {
		try {
			console.log(`🗑️ Deleting activity ${activityId}...`);

			const data = await deleteActivity(activityId);

			if (data.success) {
				console.log(`✅ Activity deleted successfully!`);
				console.log(`📊 Hexagons: ${data.hexagons.restored} restored, ${data.hexagons.deleted} deleted`);
				console.log(`📊 Hexagons: ↩️ ${data.hexagons.restored} restored to previous owners, 🗑️ ${data.hexagons.deleted} removed (no previous owner)`);

				setActivities((prevActivities) =>
					prevActivities.map((activity) =>
						activity.id === activityId ? { ...activity, isStored: false } : activity
					)
				);
			} else {
				console.error('❌ Error:', data.error);
				console.error(`Failed to delete activity: ${data.error || data.details || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('❌ Failed to delete activity:', error);
			console.error(`Error: ${error instanceof Error ? error.message : 'Network error'}`);
		}
	};

	return {
		// State
		activities,
		selectedActivity,
		routeCoordinates,
		currentPage,
		hasMoreActivities,
		totalRunCount,
		loading,
		perPage,

		// Actions
		loadActivities,
		loadActivityDetails,
		saveActivity,
		removeActivity,
	};
}
