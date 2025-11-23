import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown } from '@fortawesome/pro-solid-svg-icons';

interface ProfileHeaderProps {
	userProfile: {
		firstname?: string | null;
		lastname?: string | null;
		profile?: string | null;
		imghex?: string | null;
	} | null;
	stravaId: number;
	isOwnProfile: boolean;
	isAdmin?: boolean;
	onOpenActivities?: () => void;
	onLogout?: () => void;
	activitiesLoading?: boolean;
}

export function ProfileHeader({
	userProfile,
	stravaId,
	isOwnProfile,
	isAdmin,
	onOpenActivities,
	onLogout,
	activitiesLoading
}: ProfileHeaderProps) {
	const navigate = useNavigate();

	return (
		<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-white/10 rounded-xl p-6">
			<div className="flex items-center justify-between gap-4 flex-wrap">
				<div className="flex items-center gap-4">
					{(userProfile?.imghex || userProfile?.profile) && (
						<img
							src={userProfile.imghex || userProfile.profile || undefined}
							alt={userProfile?.firstname || ''}
							className={`w-20 h-20 object-cover ${userProfile.imghex ? '' : 'hex-clip'}`}
						/>
					)}
					<div>
						<h1 className="text-2xl font-bold text-gray-100">
							{userProfile?.firstname} {userProfile?.lastname}
						</h1>
						<p className="text-sm text-gray-400">Strava ID: {stravaId}</p>
						{isOwnProfile && isAdmin && (
							<span className="inline-flex items-center gap-1 text-xs text-purple-400 font-semibold mt-1">
								<FontAwesomeIcon icon={faCrown} className="w-3 h-3" />
								Admin
							</span>
						)}
					</div>
				</div>
			</div>
			{isOwnProfile && (
				<div className="flex gap-2 mt-4">
					<button
						onClick={onOpenActivities}
						disabled={activitiesLoading}
						className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 text-orange-400 px-3 py-1.5 rounded-lg hover:bg-orange-500/30 hover:border-orange-500/50 transition-all cursor-pointer text-sm font-medium disabled:opacity-50"
					>
						<FontAwesomeIcon icon="running" className="w-3.5 h-3.5" />
						Manage Activities
					</button>
					<button
						onClick={() => {
							onLogout?.();
							navigate('/');
						}}
						className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30 hover:border-red-500/50 hover:text-red-300 transition-all cursor-pointer text-sm font-medium"
					>
						<FontAwesomeIcon icon="sign-out-alt" className="w-3.5 h-3.5" />
						Logout
					</button>
				</div>
			)}

			<style>{`
				.hex-clip {
					clip-path: polygon(50% 5%, 95% 27.5%, 95% 72.5%, 50% 95%, 5% 72.5%, 5% 27.5%);
				}
			`}</style>
		</div>
	);
}
