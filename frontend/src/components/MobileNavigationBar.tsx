import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { NotificationDropdown } from './NotificationDropdown';
import { NotificationModal } from './NotificationModal';
import { ErrorBoundary } from './ErrorBoundary';

interface MobileNavigationBarProps {
	onOpenActivities: () => void;
	onOpenLeaderboard: () => void;
	activitiesLoading?: boolean;
}

export function MobileNavigationBar({
	onOpenActivities,
	onOpenLeaderboard,
	activitiesLoading = false
}: MobileNavigationBarProps) {
	const { user } = useAuth();
	const [showNotifications, setShowNotifications] = useState(false);
	const navigate = useNavigate();

	if (!user) return null;

	return (
		<>
			<div className="fixed bottom-0 left-0 right-0 z-10 safe-area-bottom">
				<div className="bg-[rgba(10,10,10,0.95)] backdrop-blur-md border-t border-white/10 p-3">
					<div className="grid grid-cols-4 gap-2">
						<button
							onClick={onOpenActivities}
							disabled={activitiesLoading}
							className="flex flex-col items-center justify-center gap-1 bg-white/5 border border-white/10 text-gray-300 px-3 py-3 rounded-lg transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white disabled:opacity-50"
						>
							<FontAwesomeIcon icon="running" className="w-5 h-5" />
							<span className="text-[10px] font-medium">Activities</span>
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
							className="flex flex-col items-center justify-center gap-1 bg-white/5 border border-white/10 text-yellow-400 px-3 py-3 rounded-lg transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-yellow-300 subtle-pulse"
						>
							<FontAwesomeIcon icon="trophy" className="w-5 h-5" />
							<span className="text-[10px] font-medium">Leaders</span>
						</button>
						<NotificationDropdown
							bellClassName="flex flex-col items-center justify-center gap-1 bg-white/5 border border-white/10 text-gray-300 px-3 py-3 rounded-lg transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white"
							iconClassName="w-5 h-5"
							onClick={() => setShowNotifications(true)}
							showLabel={true}
						/>
						<button
							onClick={() => navigate(`/profile/${user.id}`)}
							className="flex flex-col items-center justify-center gap-1 bg-white/5 border border-white/10 text-gray-300 px-3 py-3 rounded-lg transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white"
						>
							<FontAwesomeIcon icon="user" className="w-5 h-5" />
							<span className="text-[10px] font-medium">Profile</span>
						</button>
					</div>
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
