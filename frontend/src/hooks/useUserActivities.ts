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
			}
		} catch (err) {
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
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Process (save) an activity
	 */
	const saveActivity = async (activityId: number): Promise<void> => {
		try {

			const data = await processActivity(activityId);

			if (data.success) {

				setStravaActivities((prev) =>
					prev.map((activity) =>
						activity.id === activityId ? { ...activity, isStored: true } : activity
					)
				);

				await loadLatestActivity();
			} else {
			}
		} catch (err) {
		}
	};

	/**
	 * Delete an activity
	 */
	const removeActivity = async (activityId: number): Promise<void> => {
		try {

			const data = await deleteActivity(activityId);

			if (data.success) {

				setStravaActivities((prev) =>
					prev.map((activity) =>
						activity.id === activityId ? { ...activity, isStored: false } : activity
					)
				);

				await loadLatestActivity();
			} else {
			}
		} catch (err) {
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
