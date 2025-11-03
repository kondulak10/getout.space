import { useState } from 'react';
import { useUserActivities } from './useUserActivities';

/**
 * Hook for managing activities modal state
 * Reusable across different pages
 */
export function useActivitiesManager(onActivityProcessed?: () => void) {
	const [showModal, setShowModal] = useState(false);
	const {
		stravaActivities,
		loading,
		loadStravaActivities,
		saveActivity,
		removeActivity,
	} = useUserActivities();

	const openModal = async () => {
		await loadStravaActivities();
		setShowModal(true);
	};

	const closeModal = () => {
		setShowModal(false);
	};

	const handleSaveActivity = async (activityId: number) => {
		await saveActivity(activityId);
		if (onActivityProcessed) {
			onActivityProcessed();
		}
	};

	const handleRemoveActivity = async (activityId: number) => {
		await removeActivity(activityId);
		if (onActivityProcessed) {
			onActivityProcessed();
		}
	};

	return {
		showModal,
		activities: stravaActivities,
		loading,
		openModal,
		closeModal,
		handleSaveActivity,
		handleRemoveActivity,
	};
}
