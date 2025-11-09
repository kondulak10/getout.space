import { useState, useEffect } from 'react';
import {
	fetchLatestActivity,
	fetchActivities,
	deleteActivity,
	processActivity,
	type UserActivity,
	type StravaActivity,
} from '@/services/stravaApi.service';

export function useUserActivities() {
	const [latestActivity, setLatestActivity] = useState<UserActivity | null>(null);
	const [stravaActivities, setStravaActivities] = useState<StravaActivity[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [infoMessage, setInfoMessage] = useState<string | null>(null);

	const loadLatestActivity = async () => {
		try {
			const data = await fetchLatestActivity();
			if (data.success) {
				setLatestActivity(data.activity);
			} else {
				// Ignore error
			}
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_err) {
			// Ignore error
		}
	};

	const loadStravaActivities = async () => {
		setLoading(true);
		setError(null);
		setInfoMessage(null);
		try {
			const data = await fetchActivities(1, 30);
			if (data.success) {
				setStravaActivities(data.activities);
				setInfoMessage(data.infoMessage || null);
			} else {
				setError(data.error || 'Failed to fetch activities');
			}
		} catch (_err) {
			setError(_err instanceof Error ? _err.message : 'Network error');
		} finally {
			setLoading(false);
		}
	};

	const saveActivity = async (activityId: number): Promise<void> => {
		try {

			const data = await processActivity(activityId);

			if (data.success) {

				setStravaActivities((prev) =>
					prev.map((activity) =>
						activity.id === activityId
							? { ...activity, isStored: true, lastHex: data.activity.lastHex }
							: activity
					)
				);

				await loadLatestActivity();
			} else {
				// Ignore error
			}
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_err) {
			// Ignore error
		}
	};

	const removeActivity = async (activityId: number): Promise<void> => {
		try {

			const data = await deleteActivity(activityId);

			if (data.success) {

				setStravaActivities((prev) =>
					prev.map((activity) =>
						activity.id === activityId ? { ...activity, isStored: false, lastHex: undefined } : activity
					)
				);

				await loadLatestActivity();
			} else {
				// Ignore error
			}
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_err) {
			// Ignore error
		}
	};

	useEffect(() => {
		loadLatestActivity();
	}, []);

	return {
		latestActivity,
		stravaActivities,
		loading,
		error,
		infoMessage,
		loadLatestActivity,
		loadStravaActivities,
		saveActivity,
		removeActivity,
	};
}
