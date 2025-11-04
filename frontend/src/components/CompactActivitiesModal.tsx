import { useState } from 'react';
import { X, Trash2, Loader2, Activity } from 'lucide-react';
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
}

export function CompactActivitiesModal({
	activities,
	loading,
	onClose,
	onProcess,
	onDelete,
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
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-white/10">
					<h2 className="text-lg font-semibold text-gray-100">Your Strava Activities</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto p-4">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
												<button
													onClick={(e) => handleDelete(activity.id, e)}
													disabled={deletingIds.has(activity.id)}
													className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 cursor-pointer"
													title="Delete activity"
												>
													{deletingIds.has(activity.id) ? (
														<Loader2 className="w-4 h-4 animate-spin" />
													) : (
														<Trash2 className="w-4 h-4" />
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
														<Loader2 className="w-3 h-3 inline animate-spin mr-1" />
														Processing...
													</>
												) : (
													<>
														<Activity className="w-3 h-3 inline mr-1" />
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

				{/* Footer */}
				{!loading && activities.length > 0 && (
					<div className="p-4 border-t border-white/10 bg-white/5 text-center text-sm text-gray-400">
						Total: {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
						{' • '}
						{activities.filter((a) => a.isStored).length} processed
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
