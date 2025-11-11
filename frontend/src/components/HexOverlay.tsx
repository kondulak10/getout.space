import { useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import { useActivitiesManager } from "@/hooks/useActivitiesManager";
import { useUserActivities } from "@/hooks/useUserActivities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { ActivitiesModal } from "./ActivitiesModal";
import { LeaderboardModal } from "./LeaderboardModal";
import { NotificationDropdown } from "./NotificationDropdown";
import { NotificationModal } from "./NotificationModal";
import { useMap } from "@/contexts/useMap";
import { ErrorBoundary } from "./ErrorBoundary";
import "./HexOverlay.css";

interface HexOverlayProps {
	onActivityChanged?: () => void;
}

export function HexOverlay({ onActivityChanged }: HexOverlayProps) {
	const { user } = useAuth();
	const { latestActivity } = useUserActivities();
	const [showLeaderboard, setShowLeaderboard] = useState(false);
	const [showNotifications, setShowNotifications] = useState(false);
	const { currentParentHexagonIds } = useMap();
	const {
		showModal,
		activities,
		loading,
		openModal,
		closeModal,
		loadStravaActivities,
		handleSaveActivity,
		handleRemoveActivity,
	} = useActivitiesManager(onActivityChanged);
	const navigate = useNavigate();

	if (!user) {
		return (
			<div className="absolute top-4 right-4 z-10">
				<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-white/10 rounded-xl p-4 min-w-80 shadow-2xl animate-pulse">
					<div className="flex items-center gap-3">
						<div className="w-14 h-14 bg-gray-700 hex-clip"></div>
						<div className="flex-1">
							<div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
							<div className="h-3 bg-gray-700 rounded w-24"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const formatDistance = (meters: number) => {
		return (meters / 1000).toFixed(1) + " km";
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	};

	return (
		<>
			<div className="hidden md:block absolute top-4 right-4 z-10">
				<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
					<div className="flex items-center gap-3 mb-3">
						<img
							src={user.profile.imghex || user.profile.profile}
							alt={user.profile.firstname}
							className="w-12 h-12 object-cover hex-clip"
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
							onClick={() => openModal()}
							disabled={loading}
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
									setShowLeaderboard(true);
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
							onClick={() => navigate("/profile")}
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
								Latest: {formatDate(latestActivity.startDate)}
							</div>
							<div className="flex items-center justify-between gap-2">
								<div className="text-sm font-medium text-gray-200 truncate flex-1">
									{latestActivity.name}
								</div>
								<div className="text-xs text-gray-300 whitespace-nowrap">
									{formatDistance(latestActivity.distance)}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			<div className="md:hidden fixed bottom-0 left-0 right-0 z-10 safe-area-bottom">
				<div className="bg-[rgba(10,10,10,0.95)] backdrop-blur-md border-t border-white/10 p-3">
					<div className="grid grid-cols-4 gap-2">
						<button
							onClick={() => openModal()}
							disabled={loading}
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
									setShowLeaderboard(true);
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
							onClick={() => navigate("/profile")}
							className="flex flex-col items-center justify-center gap-1 bg-white/5 border border-white/10 text-gray-300 px-3 py-3 rounded-lg transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white"
						>
							<FontAwesomeIcon icon="user" className="w-5 h-5" />
							<span className="text-[10px] font-medium">Profile</span>
						</button>
					</div>
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

			{showLeaderboard && (
				<ErrorBoundary>
					<LeaderboardModal
						parentHexagonIds={Array.isArray(currentParentHexagonIds.current) ? currentParentHexagonIds.current : []}
						onClose={() => setShowLeaderboard(false)}
					/>
				</ErrorBoundary>
			)}

			{showNotifications && (
				<ErrorBoundary>
					<NotificationModal onClose={() => setShowNotifications(false)} />
				</ErrorBoundary>
			)}
		</>
	);
}
