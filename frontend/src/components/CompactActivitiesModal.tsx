import { useState } from 'react';
import { X, Trash2, Loader2, Save } from 'lucide-react';
import type { StravaActivity } from '@/services/stravaApi.service';

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

		if (
			!confirm(
				'⚠️ Are you sure you want to delete this activity?\n\nThis will:\n- Remove the activity from the database\n- Restore previous owners of captured hexagons (or delete hexagons if no previous owner)\n\nThe activity will remain in your Strava account.'
			)
		) {
			return;
		}

		setDeletingIds((prev) => new Set(prev).add(activityId));
		try {
			await onDelete(activityId);
		} finally {
			setDeletingIds((prev) => {
				const next = new Set(prev);
				next.delete(activityId);
				return next;
			});
		}
	};

	const formatDistance = (meters: number) => {
		return (meters / 1000).toFixed(2) + ' km';
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b">
					<h2 className="text-lg font-semibold">Your Strava Activities</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
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
						<div className="text-center py-12 text-gray-500">
							No activities found.
							<br />
							Try syncing your Strava account!
						</div>
					) : (
						<div className="space-y-2">
							{activities.map((activity) => (
								<div
									key={activity.id}
									className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
								>
									<div className="flex-1 min-w-0">
										<div className="font-medium text-sm truncate">{activity.name}</div>
										<div className="text-xs text-gray-500 flex items-center gap-2">
											<span>{formatDistance(activity.distance)}</span>
											<span>•</span>
											<span>{formatDate(activity.start_date_local)}</span>
										</div>
									</div>

									<div className="flex items-center gap-2">
										{activity.isStored ? (
											<>
												<span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
													✓ Processed
												</span>
												<button
													onClick={(e) => handleDelete(activity.id, e)}
													disabled={deletingIds.has(activity.id)}
													className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
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
												className="px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded transition-colors"
												title="Process activity"
											>
												{processingIds.has(activity.id) ? (
													<>
														<Loader2 className="w-3 h-3 inline animate-spin mr-1" />
														Processing...
													</>
												) : (
													<>
														<Save className="w-3 h-3 inline mr-1" />
														Process
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
					<div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-600">
						Total: {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
						{' • '}
						{activities.filter((a) => a.isStored).length} processed
					</div>
				)}
			</div>
		</div>
	);
}
