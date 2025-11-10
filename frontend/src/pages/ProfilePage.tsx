import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { DeleteMyAccountDocument } from '@/gql/graphql';
import { useAuth } from '@/contexts/useAuth';
import { useActivitiesManager } from '@/hooks/useActivitiesManager';
import { useStoredActivities } from '@/hooks/useStoredActivities';
import { ActivitiesManagerModal } from '@/components/ActivitiesManagerModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatDate, formatDistance } from '@/utils/dateFormatter';
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

export function ProfilePage() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [deleteMyAccount, { loading: deletingAccount }] = useMutation(DeleteMyAccountDocument);

	const {
		activities: storedActivities,
		loading: loadingStored,
		removeActivity: deleteStoredActivity,
		refetch: refetchStoredActivities,
	} = useStoredActivities();

	const { showModal, activities, loading, infoMessage, openModal, closeModal, handleSaveActivity, handleRemoveActivity } =
		useActivitiesManager(refetchStoredActivities);

	const handleShowOnMap = (hexId: string) => {
		closeModal();
		navigate(`/?hex=${hexId}`);
	};

	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
	const [showActivityDeleteDialog, setShowActivityDeleteDialog] = useState(false);
	const [activityToDelete, setActivityToDelete] = useState<{ id: string; stravaId: number } | null>(null);

	const handleDeleteActivity = async (activityId: string, stravaActivityId: number) => {
		setActivityToDelete({ id: activityId, stravaId: stravaActivityId });
		setShowActivityDeleteDialog(true);
	};

	const confirmDeleteActivity = async () => {
		if (!activityToDelete) return;

		setDeletingActivityId(activityToDelete.id);
		setShowActivityDeleteDialog(false);
		try {
			await deleteStoredActivity(activityToDelete.stravaId);
		} finally {
			setDeletingActivityId(null);
			setActivityToDelete(null);
		}
	};

	const handleDeleteAccount = async () => {
		if (!showDeleteConfirm) {
			setShowDeleteConfirm(true);
			return;
		}

		try {
			await deleteMyAccount();
			logout();
			navigate('/');
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_error) {
			// Ignore error
		}
	};

	if (!user) {
		return null;
	}

	return (
		<div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
			<div className="max-w-3xl mx-auto space-y-4">
				<button
					onClick={() => navigate('/')}
					className="flex items-center gap-2 bg-white/10 border border-white/20 text-gray-100 px-4 py-2.5 rounded-lg hover:bg-white/20 hover:border-white/30 transition-all cursor-pointer font-medium"
				>
					<FontAwesomeIcon icon="chevron-left" className="w-4 h-4" />
					Back to Map
				</button>

				<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-4">
							<img
								src={user.profile.imghex || user.profile.profile}
								alt={user.profile.firstname}
								className="w-16 h-16 md:w-20 md:h-20 object-cover hex-clip"
							/>
							<div>
								<h1 className="text-xl md:text-2xl font-bold text-gray-100">
									{user.profile.firstname}
								</h1>
								<p className="text-sm text-gray-400">ID: {user.stravaId}</p>
								{user.isAdmin && <span className="text-xs text-purple-400 font-semibold">👑 Admin</span>}
							</div>
						</div>
						<button
							onClick={() => {
								logout();
								navigate('/');
							}}
							className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 hover:border-red-500/50 hover:text-red-300 transition-all cursor-pointer font-medium"
						>
							<FontAwesomeIcon icon="sign-out-alt" className="w-4 h-4" />
							<span className="hidden md:inline">Logout</span>
						</button>
					</div>
				</div>

				<button
					onClick={openModal}
					disabled={loading}
					className="inline-flex items-center gap-2 bg-[#FC5200] hover:bg-[#E34402] disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
				>
					<FontAwesomeIcon icon="running" className="w-4 h-4" />
					{loading ? 'Loading...' : 'Manage Activities'}
				</button>

				<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6">
					<h2 className="text-lg font-semibold text-gray-100 mb-4">Stored Activities</h2>

					{loadingStored ? (
						<div className="flex items-center justify-center py-8">
							<FontAwesomeIcon icon="spinner" className="w-6 h-6 animate-spin text-gray-400" />
						</div>
					) : storedActivities.length === 0 ? (
						<div className="text-center py-8 text-gray-400 text-sm">
							No activities yet. Use "Manage Strava Activities" to add some.
						</div>
					) : (
						<>
							<div className="space-y-2 max-h-96 overflow-y-auto">
								{storedActivities.map((activity) => (
									<div
										key={activity.id}
										className="flex items-center justify-between gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
									>
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm truncate text-gray-100 max-w-full">{activity.name}</div>
											<div className="text-xs text-gray-400 flex items-center gap-2">
												<span className="capitalize">{activity.type.toLowerCase()}</span>
												<span>•</span>
												<span>{formatDistance(activity.distance)}</span>
												<span>•</span>
												<span>{formatDate(activity.startDateLocal as string)}</span>
											</div>
										</div>

										<div className="flex items-center gap-2 shrink-0">
											{activity.lastHex && (
												<button
													onClick={() => navigate(`/?hex=${activity.lastHex}`)}
													className="p-2 text-blue-400 hover:bg-blue-500/10 rounded transition-colors cursor-pointer"
													title="Show on map"
												>
													<FontAwesomeIcon icon="map-marker-alt" className="w-4 h-4" />
												</button>
											)}
											<button
												onClick={() => handleDeleteActivity(activity.id, activity.stravaActivityId)}
												disabled={deletingActivityId === activity.id}
												className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 cursor-pointer"
												title="Delete activity"
											>
												{deletingActivityId === activity.id ? (
													<FontAwesomeIcon icon="spinner" className="w-4 h-4 animate-spin" />
												) : (
													<FontAwesomeIcon icon="trash" className="w-4 h-4" />
												)}
											</button>
										</div>
									</div>
								))}
							</div>
							<div className="mt-4 pt-4 border-t border-white/10 text-center text-sm text-gray-400">
								{storedActivities.length} {storedActivities.length === 1 ? 'activity' : 'activities'}
							</div>
						</>
					)}
				</div>

				<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6">
					<h2 className="text-lg font-semibold text-gray-100 mb-3">How It Works</h2>
					<div className="text-sm text-gray-400 space-y-2">
						<p>GetOut.space gamifies exploration by converting your activities into hexagonal territories.</p>
						<ul className="list-disc list-inside space-y-1 ml-2">
							<li>Import activities from Strava</li>
							<li>Capture hexagons by traversing them</li>
							<li>Compete with others or explore solo</li>
							<li>Track your progress on the map</li>
						</ul>
						<p className="text-xs text-gray-500 mt-3">
							<span className="font-semibold text-[#FC5200]">Powered by Strava</span>
						</p>
					</div>
				</div>

				<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-red-500/20 rounded-xl p-4 md:p-6">
					<div className="flex items-start gap-3 mb-4">
						<FontAwesomeIcon icon="exclamation-triangle" className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
						<div className="text-sm text-red-400">
							<p className="font-semibold mb-1">Danger Zone</p>
							<p className="text-xs">Deleting your account permanently removes all activities and hexagons. This cannot be undone.</p>
						</div>
					</div>

					<button
						onClick={handleDeleteAccount}
						disabled={deletingAccount}
						className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
							showDeleteConfirm
								? 'bg-red-600 hover:bg-red-700 text-white'
								: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
						}`}
					>
						<FontAwesomeIcon icon="trash" className="w-4 h-4" />
						{deletingAccount
							? 'Deleting...'
							: showDeleteConfirm
								? 'Click Again to Confirm'
								: 'Delete Account'}
					</button>

					{showDeleteConfirm && (
						<button
							onClick={() => setShowDeleteConfirm(false)}
							className="w-full mt-2 text-sm text-gray-400 hover:text-gray-300 cursor-pointer"
						>
							Cancel
						</button>
					)}
				</div>
			</div>

			<ActivitiesManagerModal
				isOpen={showModal}
				activities={activities}
				loading={loading}
				infoMessage={infoMessage}
				onClose={closeModal}
				onProcess={handleSaveActivity}
				onDelete={handleRemoveActivity}
				onShowOnMap={handleShowOnMap}
			/>

			<AlertDialog open={showActivityDeleteDialog} onOpenChange={setShowActivityDeleteDialog}>
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
						<AlertDialogAction onClick={confirmDeleteActivity} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<style>{`
				.hex-clip {
					clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
				}
			`}</style>
		</div>
	);
}
