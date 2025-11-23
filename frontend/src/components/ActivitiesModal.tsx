import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useActivitiesManager } from '@/hooks/useActivitiesManager';
import { useStoredActivities } from '@/hooks/useStoredActivities';
import { useAnalytics } from '@/hooks/useAnalytics';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { formatDate, formatDistance } from '@/utils/dateFormatter';

interface ActivitiesModalProps {
	isOpen: boolean;
	onClose: () => void;
	onActivityChanged?: () => void;
}

export function ActivitiesModal({
	isOpen,
	onClose,
	onActivityChanged,
}: ActivitiesModalProps) {
	const { track } = useAnalytics();

	// Move ALL activity logic INSIDE the modal (no more prop drilling!)
	const {
		activities: stravaActivities,
		loading: loadingStrava,
		loadStravaActivities,
		handleSaveActivity: saveActivity,
		handleRemoveActivity: removeStravaActivity,
	} = useActivitiesManager(onActivityChanged);
	const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
	const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [activityToDelete, setActivityToDelete] = useState<{ id: number; type: 'strava' | 'stored' } | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasSynced, setHasSynced] = useState(false);
	const activitiesPerPage = 5;
	const navigate = useNavigate();

	const handleClose = () => {
		track('activities_modal_closed', {});
		onClose();
	};

	
	const {
		activities: storedActivities,
		loading: loadingStored,
		removeActivity: deleteStoredActivity,
	} = useStoredActivities();

	
	useEffect(() => {
		if (isOpen) {
			setHasSynced(false);
		}
	}, [isOpen]);

	const handleFetchActivities = async () => {
		await loadStravaActivities();
		setHasSynced(true);
	};

	const handleProcess = async (activityId: number, e: React.MouseEvent) => {
		e.stopPropagation();
		setProcessingIds((prev) => new Set(prev).add(activityId));
		try {
			await saveActivity(activityId);
			toast.success('Activity processed', {
				description: 'Hexagons updated on map',
			});
		} catch (error) {
			toast.error('Failed to process', {
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

	const handleDelete = async (activityId: number, type: 'strava' | 'stored', e: React.MouseEvent) => {
		e.stopPropagation();
		setActivityToDelete({ id: activityId, type });
		setShowDeleteDialog(true);
	};

	const confirmDelete = async () => {
		if (activityToDelete === null) return;

		setDeletingIds((prev) => new Set(prev).add(activityToDelete.id));
		setShowDeleteDialog(false);
		try {
			if (activityToDelete.type === 'strava') {
				await removeStravaActivity(activityToDelete.id);
			} else {
				await deleteStoredActivity(activityToDelete.id);
			}
			toast.success('Activity deleted', {
				description: 'Hexagons restored',
			});
		} catch (error) {
			toast.error('Failed to delete', {
				description: error instanceof Error ? error.message : 'An error occurred',
			});
		} finally {
			setDeletingIds((prev) => {
				const next = new Set(prev);
				next.delete(activityToDelete.id);
				return next;
			});
			setActivityToDelete(null);
		}
	};

	const handleShowOnMap = (hexId: string) => {
		handleClose();
		navigate(`/?hex=${hexId}`);
	};

	// Merge Strava and stored activities, prioritizing stored
	const allActivities = [
		...stravaActivities,
		...storedActivities.map((a) => ({
			id: a.stravaActivityId,
			name: a.name,
			distance: a.distance,
			start_date_local: a.startDateLocal as string,
			isStored: true,
			lastHex: a.lastHex,
		})),
	];

	
	const uniqueActivities = Array.from(
		new Map(allActivities.map((a) => [a.id, a])).values()
	).sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());

	const processedCount = uniqueActivities.filter((a) => a.isStored).length;
	const pendingCount = uniqueActivities.filter((a) => !a.isStored).length;

	
	const totalPages = Math.ceil(uniqueActivities.length / activitiesPerPage);
	const startIndex = (currentPage - 1) * activitiesPerPage;
	const endIndex = startIndex + activitiesPerPage;
	const currentActivities = uniqueActivities.slice(startIndex, endIndex);

	
	if (isOpen && currentPage > totalPages && totalPages > 0) {
		setCurrentPage(1);
	}

	return (
		<>
			<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
				<DialogContent className="max-w-3xl bg-[rgba(10,10,10,0.95)] border border-white/10 text-gray-100">
					<DialogHeader>
						<DialogTitle className="text-gray-100 text-xl font-bold flex items-center gap-2">
							<FontAwesomeIcon icon="running" className="w-5 h-5 text-orange-500" />
							Activities
						</DialogTitle>
					</DialogHeader>

					<DialogBody className="p-5 space-y-4">
						{}
						{!hasSynced && (
							<div className="rounded-xl bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-transparent border-2 border-orange-500/40 p-4 shadow-xl">
								<button
									onClick={handleFetchActivities}
									disabled={loadingStrava}
									className="w-full flex items-center justify-center gap-2 bg-[#FC5200] hover:bg-[#E34402] disabled:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-all hover:scale-[1.02] shadow-lg cursor-pointer"
								>
									{loadingStrava ? (
										<>
											<FontAwesomeIcon icon="spinner" className="animate-spin" />
											Syncing...
										</>
									) : (
										<>
											<FontAwesomeIcon icon="sync" />
											Sync from Strava
										</>
									)}
								</button>
								<div className="flex items-center justify-center gap-2 mt-3 text-xs text-amber-400/80">
									<FontAwesomeIcon icon="exclamation-triangle" className="w-3 h-3" />
									Last 7 days only
								</div>
							</div>
						)}

						{}
						{loadingStrava || loadingStored ? (
							<div className="flex items-center justify-center py-12">
								<FontAwesomeIcon icon="spinner" className="w-8 h-8 animate-spin text-gray-400" />
							</div>
						) : uniqueActivities.length === 0 ? (
							<div className="text-center py-12 text-gray-400">
								<FontAwesomeIcon icon="running" className="w-12 h-12 text-gray-600 mx-auto mb-3" />
								<p className="text-sm">No activities</p>
								<p className="text-xs text-gray-500 mt-1">Sync from Strava to get started</p>
							</div>
						) : (
							<div className="space-y-3">
								{}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<FontAwesomeIcon icon="list" className="w-4 h-4 text-gray-400" />
										<h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
											All Activities
										</h3>
									</div>
									{totalPages > 1 && (
										<div className="text-xs text-gray-500">
											Page {currentPage} of {totalPages}
										</div>
									)}
								</div>

								{}
								<div className="space-y-2">
									{currentActivities.map((activity) => (
										<div
											key={activity.id}
											className={`rounded-lg p-3 transition-all ${
												activity.isStored
													? 'bg-gradient-to-r from-gray-500/20 to-transparent border border-gray-500/30'
													: 'bg-gradient-to-r from-amber-500/20 to-transparent border border-amber-500/30'
											}`}
										>
											{}
											<div className="flex items-start justify-between gap-4 mb-2">
												<div className="flex-1 min-w-0">
													<div className="font-medium text-sm text-gray-100 mb-1">{activity.name}</div>
													<div className="text-xs text-gray-400 flex items-center gap-2">
														<span>{formatDistance(activity.distance)}</span>
														<span>•</span>
														<span>{formatDate(activity.start_date_local)}</span>
													</div>
												</div>
												{activity.isStored && (
													<div className="flex items-center gap-1 text-green-400 text-xs shrink-0">
														<FontAwesomeIcon icon="check-circle" className="w-3 h-3" />
														<span>Processed</span>
													</div>
												)}
											</div>

											{}
											<div className="flex items-center gap-2 justify-end">
												{activity.isStored ? (
													<>
														{activity.lastHex && (
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	handleShowOnMap(activity.lastHex!);
																}}
																className="p-2 text-blue-400 hover:bg-blue-500/10 rounded transition-colors cursor-pointer"
																title="Show on map"
															>
																<FontAwesomeIcon icon="map-marker-alt" className="w-4 h-4" />
															</button>
														)}
														<button
															onClick={(e) => handleDelete(activity.id, 'stored', e)}
															disabled={deletingIds.has(activity.id)}
															className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 cursor-pointer"
															title="Delete"
														>
															{deletingIds.has(activity.id) ? (
																<FontAwesomeIcon icon="spinner" className="w-4 h-4 animate-spin" />
															) : (
																<FontAwesomeIcon icon="trash" className="w-4 h-4" />
															)}
														</button>
													</>
												) : (
													<>
														<button
															onClick={(e) => handleProcess(activity.id, e)}
															disabled={processingIds.has(activity.id)}
															className="px-3 py-1.5 text-xs font-medium bg-[#FC5200] hover:bg-[#E34402] disabled:bg-gray-600 text-white rounded transition-colors cursor-pointer"
														>
															{processingIds.has(activity.id) ? (
																<>
																	<FontAwesomeIcon icon="spinner" className="w-3 h-3 inline animate-spin mr-1" />
																	Processing...
																</>
															) : (
																<>
																	<FontAwesomeIcon icon="running" className="w-3 h-3 inline mr-1" />
																	Process
																</>
															)}
														</button>
														<button
															onClick={(e) => handleDelete(activity.id, 'strava', e)}
															disabled={deletingIds.has(activity.id)}
															className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 cursor-pointer"
															title="Delete"
														>
															{deletingIds.has(activity.id) ? (
																<FontAwesomeIcon icon="spinner" className="w-4 h-4 animate-spin" />
															) : (
																<FontAwesomeIcon icon="trash" className="w-4 h-4" />
															)}
														</button>
													</>
												)}
											</div>
										</div>
									))}
								</div>

								{}
								{totalPages > 1 && (
									<div className="flex items-center justify-center gap-2 pt-2">
										<button
											onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
											disabled={currentPage === 1}
											className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 rounded transition-colors cursor-pointer"
										>
											<FontAwesomeIcon icon="chevron-left" className="w-3 h-3" />
										</button>
										<div className="text-xs text-gray-400 min-w-[80px] text-center">
											{currentPage} / {totalPages}
										</div>
										<button
											onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
											disabled={currentPage === totalPages}
											className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 rounded transition-colors cursor-pointer"
										>
											<FontAwesomeIcon icon="chevron-right" className="w-3 h-3" />
										</button>
									</div>
								)}
							</div>
						)}
					</DialogBody>

					{}
					{!loadingStrava && !loadingStored && uniqueActivities.length > 0 && (
						<DialogFooter className="bg-white/5 border-t border-white/10">
							<div className="p-4 w-full flex items-center justify-center gap-4 text-sm text-gray-400">
								<div className="flex items-center gap-2">
									<FontAwesomeIcon icon="running" className="w-4 h-4" />
									<span className="font-bold text-gray-200">{uniqueActivities.length}</span>
									<span>total</span>
								</div>
								<span className="text-white/20">•</span>
								<div className="flex items-center gap-2">
									<FontAwesomeIcon icon="check-circle" className="w-4 h-4 text-green-400" />
									<span className="font-bold text-gray-200">{processedCount}</span>
									<span>processed</span>
								</div>
								{pendingCount > 0 && (
									<>
										<span className="text-white/20">•</span>
										<div className="flex items-center gap-2">
											<FontAwesomeIcon icon="clock" className="w-4 h-4 text-amber-400" />
											<span className="font-bold text-gray-200">{pendingCount}</span>
											<span>pending</span>
										</div>
									</>
								)}
							</div>
						</DialogFooter>
					)}
				</DialogContent>
			</Dialog>

			{}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent className="bg-[rgba(10,10,10,0.95)] border border-white/10 text-gray-100">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-gray-100">Delete Activity</AlertDialogTitle>
						<AlertDialogDescription className="text-gray-400">
							This will remove the activity and restore previous hexagon owners.
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
		</>
	);
}
