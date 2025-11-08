import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'sonner';
import type { StravaActivity } from '@/services/stravaApi.service';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDate, formatDistance } from '@/utils/dateFormatter';

interface CompactActivitiesModalProps {
	activities: StravaActivity[];
	loading: boolean;
	onClose: () => void;
	onProcess: (activityId: number) => Promise<void>;
	onDelete: (activityId: number) => Promise<void>;
	onShowOnMap?: (hexId: string) => void;
}

export function CompactActivitiesModal({
	activities,
	loading,
	onClose,
	onProcess,
	onDelete,
	onShowOnMap,
}: CompactActivitiesModalProps) {
	const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
	const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [activityToDelete, setActivityToDelete] = useState<number | null>(null);

	const handleProcess = async (activityId: number, e: React.MouseEvent) => {
		e.stopPropagation();
		setProcessingIds((prev) => new Set(prev).add(activityId));
		try {
			await onProcess(activityId);
			toast.success('Activity processed successfully!', {
				description: 'Your hexagons have been updated on the map.',
			});
		} catch (error) {
			toast.error('Failed to process activity', {
				description: error instanceof Error ? error.message : 'An error occurred',
			});
		} finally {
			setProcessingIds((prev) => {
				const next = new Set(prev);
				next.delete(activityId);
				return next;
			});
		}
	};

	const handleDelete = async (activityId: number, e: React.MouseEvent) => {
		e.stopPropagation();
		setActivityToDelete(activityId);
		setShowDeleteDialog(true);
	};

	const confirmDelete = async () => {
		if (activityToDelete === null) return;

		setDeletingIds((prev) => new Set(prev).add(activityToDelete));
		setShowDeleteDialog(false);
		try {
			await onDelete(activityToDelete);
			toast.success('Activity deleted', {
				description: 'Hexagons have been restored to previous owners.',
			});
		} catch (error) {
			toast.error('Failed to delete activity', {
				description: error instanceof Error ? error.message : 'An error occurred',
			});
		} finally {
			setDeletingIds((prev) => {
				const next = new Set(prev);
				next.delete(activityToDelete);
				return next;
			});
			setActivityToDelete(null);
		}
	};


	return (
		<div
			className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
			onClick={onClose}
		>
			<div
				className="bg-[rgba(10,10,10,0.95)] border border-white/10 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90dvh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between p-4 border-b border-white/10">
					<h2 className="text-lg font-semibold text-gray-100">Your Strava Activities</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
					>
						<FontAwesomeIcon icon="times" className="w-5 h-5" />
					</button>
				</div>

				<div className="flex-1 overflow-auto p-4">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<FontAwesomeIcon icon="spinner" className="w-8 h-8 animate-spin text-gray-400" />
						</div>
					) : activities.length === 0 ? (
						<div className="text-center py-12 text-gray-400">
							No activities found.
							<br />
							Try syncing your Strava account!
						</div>
					) : (
						<div className="space-y-2">
							{activities.map((activity) => (
								<div
									key={activity.id}
									className="flex items-center justify-between gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
								>
									<div className="flex-1 min-w-0">
										<div className="font-medium text-sm truncate text-gray-100">{activity.name}</div>
										<div className="text-xs text-gray-400 flex items-center gap-2">
											<span>{formatDistance(activity.distance)}</span>
											<span>•</span>
											<span>{formatDate(activity.start_date_local)}</span>
										</div>
									</div>

									<div className="flex items-center gap-2">
										{activity.isStored ? (
											<>
												<span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
													✓ Processed
												</span>
												{activity.lastHex && onShowOnMap && (
													<button
														onClick={(e) => {
															e.stopPropagation();
															onShowOnMap(activity.lastHex!);
														}}
														className="p-2 text-blue-400 hover:bg-blue-500/10 rounded transition-colors cursor-pointer"
														title="Show on map"
													>
														<FontAwesomeIcon icon="map-marker-alt" className="w-4 h-4" />
													</button>
												)}
												<button
													onClick={(e) => handleDelete(activity.id, e)}
													disabled={deletingIds.has(activity.id)}
													className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 cursor-pointer"
													title="Delete activity"
												>
													{deletingIds.has(activity.id) ? (
														<FontAwesomeIcon icon="spinner" className="w-4 h-4 animate-spin" />
													) : (
														<FontAwesomeIcon icon="trash-alt" className="w-4 h-4" />
													)}
												</button>
											</>
										) : (
											<button
												onClick={(e) => handleProcess(activity.id, e)}
												disabled={processingIds.has(activity.id)}
												className="px-3 py-1.5 text-xs font-medium bg-[#FC5200] hover:bg-[#E34402] disabled:bg-gray-600 text-white rounded transition-colors cursor-pointer"
												title="Process from Strava"
											>
												{processingIds.has(activity.id) ? (
													<>
														<FontAwesomeIcon icon="spinner" className="w-3 h-3 inline animate-spin mr-1" />
														Processing...
													</>
												) : (
													<>
														<FontAwesomeIcon icon="running" className="w-3 h-3 inline mr-1" />
														Process from Strava
													</>
												)}
											</button>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{!loading && activities.length > 0 && (
					<div className="border-t border-white/10 bg-white/5">
						<div className="p-4 text-center text-sm text-gray-400">
							Total: {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
							{' • '}
							{activities.filter((a) => a.isStored).length} processed
						</div>
						<div className="px-4 pb-4 text-center text-xs text-amber-400/90 border-t border-white/5 pt-3">
							You cannot fetch activities older than 7 days.
						</div>
					</div>
				)}
			</div>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent className="bg-[rgba(10,10,10,0.95)] border border-white/10 text-gray-100">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-gray-100">Delete Activity</AlertDialogTitle>
						<AlertDialogDescription className="text-gray-400">
							Are you sure? This will remove the activity and restore previous hexagon owners.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
