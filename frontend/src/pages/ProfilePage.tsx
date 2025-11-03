import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { DeleteMyAccountDocument } from '@/gql/graphql';
import { useAuth } from '@/contexts/useAuth';
import { useActivitiesManager } from '@/hooks/useActivitiesManager';
import { useStoredActivities } from '@/hooks/useStoredActivities';
import { ActivitiesManagerModal } from '@/components/ActivitiesManagerModal';
import { AlertTriangle, Activity, LogOut, Trash2, Loader2 } from 'lucide-react';
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

	const { showModal, activities, loading, openModal, closeModal, handleSaveActivity, handleRemoveActivity } =
		useActivitiesManager();

	const {
		activities: storedActivities,
		loading: loadingStored,
		removeActivity: deleteStoredActivity,
	} = useStoredActivities();

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
			console.log('✅ Account deleted successfully');
			logout();
			navigate('/');
		} catch (error) {
			console.error('Failed to delete account:', error);
		}
	};

	if (!user) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-8">
			<div className="max-w-2xl mx-auto space-y-6">
				{/* Header */}
				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="flex items-center gap-4">
						<img
							src={user.profile.profile}
							alt={`${user.profile.firstname} ${user.profile.lastname}`}
							className="w-20 h-20 rounded-full object-cover"
						/>
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								{user.profile.firstname} {user.profile.lastname}
							</h1>
							<p className="text-gray-600">Strava ID: {user.stravaId}</p>
							{user.isAdmin && <span className="text-sm text-blue-600 font-semibold">👑 Admin</span>}
						</div>
					</div>
				</div>

				{/* Stored Activities */}
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">My Stored Activities</h2>

					{loadingStored ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
						</div>
					) : storedActivities.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							No activities stored yet.
							<br />
							<span className="text-sm">Use the "Manage Strava Activities" button below to add activities.</span>
						</div>
					) : (
						<>
							<div className="space-y-2 max-h-96 overflow-y-auto">
								{storedActivities.map((activity) => {
									// Debug logging
									if (activity.startDateLocal === undefined || activity.startDateLocal === null) {
										console.error('Missing startDateLocal for activity:', activity);
									}
									return (
									<div
										key={activity.id}
										className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
									>
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm truncate">{activity.name}</div>
											<div className="text-xs text-gray-500 flex items-center gap-2">
												<span className="capitalize">{activity.type.toLowerCase()}</span>
												<span>•</span>
												<span>{formatDistance(activity.distance)}</span>
												<span>•</span>
												<span>{formatDate(activity.startDateLocal as string)}</span>
											</div>
										</div>

										<button
											onClick={() => handleDeleteActivity(activity.id, activity.stravaActivityId)}
											disabled={deletingActivityId === activity.id}
											className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 flex-shrink-0"
											title="Delete activity"
										>
											{deletingActivityId === activity.id ? (
												<Loader2 className="w-4 h-4 animate-spin" />
											) : (
												<Trash2 className="w-4 h-4" />
											)}
										</button>
									</div>
									);
								})}
							</div>
							<div className="mt-4 pt-4 border-t text-center text-sm text-gray-600">
								Total: {storedActivities.length}{' '}
								{storedActivities.length === 1 ? 'activity' : 'activities'}
							</div>
						</>
					)}
				</div>

				{/* Actions */}
				<div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h2>

					{/* Refetch Activities */}
					<button
						onClick={openModal}
						disabled={loading}
						className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
					>
						<Activity className="w-5 h-5" />
						{loading ? 'Loading Activities...' : 'Manage Strava Activities'}
					</button>

					{/* Logout */}
					<button
						onClick={() => {
							logout();
							navigate('/');
						}}
						className="w-full flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
					>
						<LogOut className="w-5 h-5" />
						Logout
					</button>

					{/* Delete Account */}
					<div className="pt-4 border-t border-gray-200">
						<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
							<div className="flex items-start gap-3">
								<AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
								<div className="text-sm text-red-800">
									<p className="font-semibold mb-1">Danger Zone</p>
									<p>
										Deleting your account will permanently remove all your activities and unassign all your
										hexagons. This action cannot be undone.
									</p>
								</div>
							</div>
						</div>

						<button
							onClick={handleDeleteAccount}
							disabled={deletingAccount}
							className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
								showDeleteConfirm
									? 'bg-red-600 hover:bg-red-700 text-white'
									: 'bg-red-100 hover:bg-red-200 text-red-700'
							}`}
						>
							<Trash2 className="w-5 h-5" />
							{deletingAccount
								? 'Deleting...'
								: showDeleteConfirm
									? 'Click Again to Confirm Deletion'
									: 'Delete My Account'}
						</button>

						{showDeleteConfirm && (
							<button
								onClick={() => setShowDeleteConfirm(false)}
								className="w-full mt-2 text-sm text-gray-600 hover:text-gray-800"
							>
								Cancel
							</button>
						)}
					</div>
				</div>

				{/* About This Website */}
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">About This Website</h2>
					<div className="prose prose-sm text-gray-700 space-y-3">
						<p>
							GetOut.space is a gamified exploration platform that connects with your Strava account to
							visualize and track your outdoor activities through hexagonal territories.
						</p>
						<p className="font-semibold text-gray-900">How it works:</p>
						<ul className="list-disc list-inside space-y-1 text-sm">
							<li>Connect your Strava account to import activities</li>
							<li>
								Your activities are analyzed and converted into hexagonal territories on the map (H3
								resolution 9)
							</li>
							<li>Capture hexagons by being the first to traverse them, or recapture from others</li>
							<li>Track your exploration progress and compete with other users</li>
							<li>Delete activities to clean up hexagons and restore previous owners</li>
						</ul>
						<p className="text-xs text-gray-500 mt-4">
							This project uses the{' '}
							<a
								href="https://h3geo.org/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:underline"
							>
								H3 geospatial indexing system
							</a>{' '}
							by Uber and integrates with the{' '}
							<a
								href="https://developers.strava.com/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:underline"
							>
								Strava API
							</a>
							.
						</p>
					</div>
				</div>

				{/* Back to Map */}
				<button
					onClick={() => navigate('/')}
					className="w-full text-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
				>
					← Back to Map
				</button>
			</div>

			{/* Activities Modal */}
			<ActivitiesManagerModal
				isOpen={showModal}
				activities={activities}
				loading={loading}
				onClose={closeModal}
				onProcess={handleSaveActivity}
				onDelete={handleRemoveActivity}
			/>

			{/* Activity Delete Confirmation Dialog */}
			<AlertDialog open={showActivityDeleteDialog} onOpenChange={setShowActivityDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Activity</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this activity?
							<br /><br />
							This will:
							<br />• Remove the activity from the database
							<br />• Restore previous owners of captured hexagons (or delete hexagons if no previous owner)
							<br /><br />
							The activity will remain in your Strava account.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDeleteActivity} className="bg-red-600 hover:bg-red-700">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
