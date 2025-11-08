import { useState } from 'react';
import { useUserActivities } from './useUserActivities';

export function useActivitiesManager(onActivityProcessed?: () => void) {
	const [showModal, setShowModal] = useState(false);
	const {
		stravaActivities,
		loading,
		infoMessage,
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
		try {
			await saveActivity(activityId);
			console.log('✅ Activity saved successfully, triggering hexagon refetch...');
			if (onActivityProcessed) {
				onActivityProcessed();
			}
		} catch (error) {
			console.error('❌ Failed to save activity:', error);
			throw error;
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
		infoMessage,
		openModal,
		closeModal,
		handleSaveActivity,
		handleRemoveActivity,
	};
}
