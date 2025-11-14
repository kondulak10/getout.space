import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { useUserActivities } from '@/hooks/useUserActivities';
import { NotificationDropdown } from './NotificationDropdown';
import { NotificationModal } from './NotificationModal';
import { ErrorBoundary } from './ErrorBoundary';
import { formatDate, formatDistance } from '@/utils/dateFormatter';

interface UserProfileCardProps {
	onOpenActivities: () => void;
	onOpenLeaderboard: () => void;
	activitiesLoading?: boolean;
}

export function UserProfileCard({
	onOpenActivities,
	onOpenLeaderboard,
	activitiesLoading = false
}: UserProfileCardProps) {
	const { user } = useAuth();
	const { latestActivity } = useUserActivities();
	const [showNotifications, setShowNotifications] = useState(false);
	const navigate = useNavigate();

	if (!user) return null;

	return (
		<>
			<div className="absolute top-4 right-4 z-10">
				<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
					<div
						className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 -m-2 transition-all"
						onClick={() => navigate(`/profile/${user.id}`)}
					>
						<img
							src={user.profile.imghex || user.profile.profile}
							alt={user.profile.firstname}
							className={`w-12 h-12 object-cover ${user.profile.imghex ? '' : 'hex-clip'}`}
						/>
						<div className="flex-1 min-w-0">
							<div className="font-semibold text-sm text-gray-100 truncate">
								{user.profile.firstname}
							</div>
							<div className="text-xs text-gray-400">ID: {user.stravaId}</div>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-2 mb-3">
						<button
							onClick={onOpenActivities}
							disabled={activitiesLoading}
							className="flex items-center justify-start gap-2 bg-white/5 border border-white/10 text-gray-300 px-3 py-2 rounded-md transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white disabled:opacity-50"
							title="Activities"
						>
							<FontAwesomeIcon icon="running" className="w-3.5 h-3.5" />
							<span className="text-xs font-medium">Activities</span>
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								try {
									onOpenLeaderboard();
								} catch (error) {
									console.error('Error opening leaderboard:', error);
								}
							}}
							className="flex items-center justify-start gap-2 bg-white/5 border border-white/10 text-yellow-400 px-3 py-2 rounded-md transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-yellow-300 subtle-pulse"
							title="Regional Leaderboard"
						>
							<FontAwesomeIcon icon="trophy" className="w-3.5 h-3.5" />
							<span className="text-xs font-medium">Leaders</span>
						</button>
						<NotificationDropdown
							bellClassName="flex items-center justify-start gap-2 bg-white/5 border border-white/10 text-gray-300 px-3 py-2 rounded-md transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white relative"
							iconClassName="w-3.5 h-3.5"
							onClick={() => setShowNotifications(true)}
							showLabel={true}
						/>
						<button
							onClick={() => navigate(`/profile/${user.id}`)}
							className="flex items-center justify-start gap-2 bg-white/5 border border-white/10 text-gray-300 px-3 py-2 rounded-md transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white"
							title="Profile"
						>
							<FontAwesomeIcon icon="user" className="w-3.5 h-3.5" />
							<span className="text-xs font-medium">Profile</span>
						</button>
					</div>
					{latestActivity && (
						<div className="pt-2 pb-1 border-t border-white/10">
							<div className="text-[11px] text-gray-400 mb-1">
								Latest: {formatDate(latestActivity.startDate, { month: "short", day: "numeric" })}
							</div>
							<div className="flex items-center justify-between gap-2">
								<div className="text-sm font-medium text-gray-200 truncate flex-1">
									{latestActivity.name}
								</div>
								<div className="text-xs text-gray-300 whitespace-nowrap">
									{formatDistance(latestActivity.distance, 1)}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{showNotifications && (
				<ErrorBoundary>
					<NotificationModal onClose={() => setShowNotifications(false)} />
				</ErrorBoundary>
			)}
		</>
	);
}
