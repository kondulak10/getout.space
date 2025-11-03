import { CompactActivitiesModal } from './CompactActivitiesModal';
import type { StravaActivity } from '@/services/stravaApi.service';

interface ActivitiesManagerModalProps {
	isOpen: boolean;
	activities: StravaActivity[];
	loading: boolean;
	onClose: () => void;
	onProcess: (activityId: number) => Promise<void>;
	onDelete: (activityId: number) => Promise<void>;
}

/**
 * Reusable Activities Manager Modal
 * Can be used from HomePage or ProfilePage
 */
export function ActivitiesManagerModal({
	isOpen,
	activities,
	loading,
	onClose,
	onProcess,
	onDelete,
}: ActivitiesManagerModalProps) {
	if (!isOpen) return null;

	return (
		<CompactActivitiesModal
			activities={activities}
			loading={loading}
			onClose={onClose}
			onProcess={onProcess}
			onDelete={onDelete}
		/>
	);
}
