import { useState, useEffect } from 'react';
import {
	fetchLatestActivity,
	fetchActivities,
	deleteActivity,
	processActivity,
	type UserActivity,
	type StravaActivity,
} from '@/services/stravaApi.service';

/**
 * Hook for managing user activities
 */
export function useUserActivities() {
	const [latestActivity, setLatestActivity] = useState<UserActivity | null>(null);
	const [stravaActivities, setStravaActivities] = useState<StravaActivity[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Load latest activity from database
	 */
	const loadLatestActivity = async () => {
		try {
			const data = await fetchLatestActivity();
			if (data.success) {
				setLatestActivity(data.activity);
			} else {
				console.error('Failed to fetch latest activity:', data.error);
			}
		} catch (err) {
			console.error('Error fetching latest activity:', err);
		}
	};

	/**
	 * Load all activities from Strava (not database)
	 */
	const loadStravaActivities = async () => {
		setLoading(true);
		setError(null);
		try {
			// Fetch first page of Strava activities (with isStored flags)
			const data = await fetchActivities(1, 30);
			if (data.success) {
				setStravaActivities(data.activities);
			} else {
				setError(data.error || 'Failed to fetch activities');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Network error');
			console.error('Error fetching Strava activities:', err);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Process (save) an activity
	 */
	const saveActivity = async (activityId: number): Promise<void> => {
		try {
			console.log(`💾 Processing activity ${activityId}...`);

			const data = await processActivity(activityId);

			if (data.success) {
				console.log(`✅ Activity processed successfully!`);
				console.log(`📊 Hexagons: ${data.hexagons.totalParsed} total, ✨ ${data.hexagons.created} created, 🎯 ${data.hexagons.updated} captured, ⏭️ ${data.hexagons.couldNotUpdate} skipped`);

				setStravaActivities((prev) =>
					prev.map((activity) =>
						activity.id === activityId ? { ...activity, isStored: true } : activity
					)
				);

				await loadLatestActivity();
			} else {
				console.error('❌ Error:', data.error);
				console.error(`Failed to process activity: ${data.error || data.details || 'Unknown error'}`);
			}
		} catch (err) {
			console.error('❌ Failed to process activity:', err);
			console.error(`Error: ${err instanceof Error ? err.message : 'Network error'}`);
		}
	};

	/**
	 * Delete an activity
	 */
	const removeActivity = async (activityId: number): Promise<void> => {
		try {
			console.log(`🗑️ Deleting activity ${activityId}...`);

			const data = await deleteActivity(activityId);

			if (data.success) {
				console.log(`✅ Activity deleted successfully!`);
				console.log(`📊 Hexagons: ↩️ ${data.hexagons.restored} restored to previous owners, 🗑️ ${data.hexagons.deleted} removed (no previous owner)`);

				setStravaActivities((prev) =>
					prev.map((activity) =>
						activity.id === activityId ? { ...activity, isStored: false } : activity
					)
				);

				await loadLatestActivity();
			} else {
				console.error('❌ Error:', data.error);
				console.error(`Failed to delete activity: ${data.error || data.details || 'Unknown error'}`);
			}
		} catch (err) {
			console.error('❌ Failed to delete activity:', err);
			console.error(`Error: ${err instanceof Error ? err.message : 'Network error'}`);
		}
	};

	// Load latest activity on mount
	useEffect(() => {
		loadLatestActivity();
	}, []);

	return {
		latestActivity,
		stravaActivities,
		loading,
		error,
		loadLatestActivity,
		loadStravaActivities,
		saveActivity,
		removeActivity,
	};
}
