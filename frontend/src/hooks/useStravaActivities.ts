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

export function useStravaActivities() {
	const [activities, setActivities] = useState<StravaActivity[]>([]);
	const [selectedActivity, setSelectedActivity] = useState<ActivityDetails | null>(null);
	const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMoreActivities, setHasMoreActivities] = useState(true);
	const [totalRunCount, setTotalRunCount] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);

	const perPage = 30;

	const loadAthleteStats = async () => {
		try {
			const data = await fetchAthleteStats();

			if (data.success) {
				setTotalRunCount(data.runCount);
			}
		} catch (error) {
		}
	};

	const loadActivities = async (page: number = currentPage) => {
		setLoading(true);
		try {
			if (page === 1 && totalRunCount === null) {
				await loadAthleteStats();
			}


			const data = await fetchActivities(page, perPage);

			if (data.success) {
				setActivities(data.activities);
				setCurrentPage(data.page);
				setHasMoreActivities(data.hasMorePages ?? false);
			}
		} catch (error) {
		} finally {
			setLoading(false);
		}
	};

	const loadActivityDetails = async (activityId: number) => {
		try {

			const data = await fetchActivityDetails(activityId);

			if (data.success) {

				if (data.activity.map?.polyline) {
					const decoded = polyline.decode(data.activity.map.polyline);
					setRouteCoordinates(decoded);
					setSelectedActivity(data.activity);
				} else {
					setRouteCoordinates([]);
					setSelectedActivity(null);
				}
			}
		} catch (error) {
		}
	};

	const saveActivity = async (activityId: number): Promise<void> => {
		try {

			const data = await processActivity(activityId);

			if (data.success) {
				setActivities((prevActivities) =>
					prevActivities.map((activity) =>
						activity.id === activityId ? { ...activity, isStored: true } : activity
					)
				);
			}
		} catch (error) {
		}
	};

	const removeActivity = async (activityId: number): Promise<void> => {
		try {

			const data = await deleteActivity(activityId);

			if (data.success) {
				setActivities((prevActivities) =>
					prevActivities.map((activity) =>
						activity.id === activityId ? { ...activity, isStored: false } : activity
					)
				);
			}
		} catch (error) {
		}
	};

	return {
		activities,
		selectedActivity,
		routeCoordinates,
		currentPage,
		hasMoreActivities,
		totalRunCount,
		loading,
		perPage,

		loadActivities,
		loadActivityDetails,
		saveActivity,
		removeActivity,
	};
}
