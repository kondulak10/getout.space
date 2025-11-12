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
	const openModal = () => {
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
		infoMessage,
		openModal,
		closeModal,
		loadStravaActivities,
		handleSaveActivity,
		handleRemoveActivity,
	};
}
