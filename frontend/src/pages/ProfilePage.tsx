import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client/react';
import { DeleteMyAccountDocument } from '@/gql/graphql';
import { useAuth } from '@/contexts/useAuth';
import { useActivitiesManager } from '@/hooks/useActivitiesManager';
import { ActivitiesModal } from '@/components/ActivitiesModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function ProfilePage() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [deleteMyAccount, { loading: deletingAccount }] = useMutation(DeleteMyAccountDocument);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const {
		showModal,
		activities,
		loading,
		openModal,
		closeModal,
		loadStravaActivities,
		handleSaveActivity,
		handleRemoveActivity,
	} = useActivitiesManager();

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
							<span>Logout</span>
						</button>
					</div>
				</div>

				<button
					onClick={() => openModal()}
					disabled={loading}
					className="flex items-center gap-2 bg-white/10 border border-white/20 text-gray-100 px-4 py-2.5 rounded-lg hover:bg-white/20 hover:border-white/30 transition-all cursor-pointer font-medium disabled:opacity-50"
				>
					<FontAwesomeIcon icon="running" className="w-4 h-4" />
					Manage Activities
				</button>

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

			<ActivitiesModal
				isOpen={showModal}
				onClose={closeModal}
				onFetchActivities={loadStravaActivities}
				stravaActivities={activities}
				loadingStrava={loading}
				onProcess={handleSaveActivity}
				onDeleteStrava={handleRemoveActivity}
			/>

			<style>{`
				.hex-clip {
					clip-path: polygon(50% 5%, 95% 27.5%, 95% 72.5%, 50% 95%, 5% 72.5%, 5% 27.5%);
				}
			`}</style>
		</div>
	);
}
