import { CompactActivitiesModal } from './CompactActivitiesModal';
import type { StravaActivity } from '@/services/stravaApi.service';

interface ActivitiesManagerModalProps {
	isOpen: boolean;
	activities: StravaActivity[];
	loading: boolean;
	infoMessage?: string | null;
	onClose: () => void;
	onProcess: (activityId: number) => Promise<void>;
	onDelete: (activityId: number) => Promise<void>;
	onShowOnMap?: (hexId: string) => void;
}

export function ActivitiesManagerModal({
	isOpen,
	activities,
	loading,
	infoMessage,
	onClose,
	onProcess,
	onDelete,
	onShowOnMap,
}: ActivitiesManagerModalProps) {
	if (!isOpen) return null;

	return (
		<CompactActivitiesModal
			activities={activities}
			loading={loading}
			infoMessage={infoMessage}
			onClose={onClose}
			onProcess={onProcess}
			onDelete={onDelete}
			onShowOnMap={onShowOnMap}
		/>
	);
}
