import { useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import { useActivitiesManager } from "@/hooks/useActivitiesManager";
import { useUserActivities } from "@/hooks/useUserActivities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { ActivitiesManagerModal } from "./ActivitiesManagerModal";
import { LeaderboardModal } from "./LeaderboardModal";
import { useMap } from "@/contexts/useMap";
import "./HexOverlay.css";

interface HexOverlayProps {
	onActivityChanged?: () => void;
}

export function HexOverlay({ onActivityChanged }: HexOverlayProps) {
	const { user } = useAuth();
	const { latestActivity } = useUserActivities();
	const [mobileExpanded, setMobileExpanded] = useState(false);
	const [showLeaderboard, setShowLeaderboard] = useState(false);
	const { currentParentHexagonIds } = useMap();
	const {
		showModal,
		activities,
		loading,
		infoMessage,
		openModal,
		closeModal,
		handleSaveActivity,
		handleRemoveActivity,
	} = useActivitiesManager(onActivityChanged);
	const navigate = useNavigate();

	const handleShowOnMap = (hexId: string) => {
		closeModal();
		navigate(`/?hex=${hexId}`);
	};

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
				<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-white/10 rounded-xl p-3 min-w-72 shadow-2xl">
					<div className="flex items-center gap-2 mb-3">
						<img
							src={user.profile.imghex || user.profile.profile}
							alt={`${user.profile.firstname} ${user.profile.lastname}`}
							className="w-12 h-12 object-cover hex-clip"
						/>
						<div className="flex-1 min-w-0">
							<div className="font-semibold text-sm text-gray-100 truncate">
								{user.profile.firstname} {user.profile.lastname}
							</div>
							<div className="text-xs text-gray-400">ID: {user.stravaId}</div>
						</div>
						<button
							onClick={() => setShowLeaderboard(true)}
							className="bg-white/5 border border-white/10 text-gray-300 p-1.5 rounded-md transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white"
							title="Regional Leaderboard"
						>
							<FontAwesomeIcon icon="trophy" className="w-3.5 h-3.5" />
						</button>
						<button
							onClick={() => navigate("/profile")}
							className="bg-white/5 border border-white/10 text-gray-300 p-1.5 rounded-md transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white"
							title="Settings"
						>
							<FontAwesomeIcon icon="cog" className="w-3.5 h-3.5" />
						</button>
					</div>

					{latestActivity && (
						<div className="pt-2 border-t border-white/10 mb-3">
							<div className="text-[11px] text-gray-400 mb-1">
								Latest: {formatDate(latestActivity.startDate)}
							</div>
							<div className="flex items-center justify-between gap-2">
								<div className="text-sm font-medium text-gray-200 truncate flex-1 max-w-[180px]">
									{latestActivity.name}
								</div>
								<div className="text-xs text-gray-300 whitespace-nowrap">
									{formatDistance(latestActivity.distance)}
								</div>
							</div>
						</div>
					)}

					<div>
						<button
							onClick={openModal}
							disabled={loading}
							className="strava-link bg-transparent border-0 text-[#FC5200] text-sm font-medium underline cursor-pointer p-0 transition-all flex items-center hover:text-[#E34402] disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? (
								<>
									<FontAwesomeIcon icon="spinner" className="animate-spin mr-2" />
									Loading...
								</>
							) : (
								"Fetch your latest from Strava"
							)}
						</button>
					</div>
				</div>
			</div>

			<div className="md:hidden fixed bottom-0 left-0 right-0 z-10 safe-area-bottom">
				<div
					className={`bg-[rgba(10,10,10,0.95)] backdrop-blur-md border-t border-white/10 transition-all duration-300 ${
						mobileExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
					}`}
				>
					<div className="p-3 space-y-3">
						<div className="flex items-center gap-2">
							<img
								src={user.profile.imghex || user.profile.profile}
								alt={user.profile.firstname}
								className="w-10 h-10 object-cover hex-clip"
							/>
							<div className="flex-1 min-w-0">
								<div className="font-semibold text-xs text-gray-100 truncate">
									{user.profile.firstname} {user.profile.lastname}
								</div>
							</div>
							<button
								onClick={() => setShowLeaderboard(true)}
								className="bg-white/5 border border-white/10 text-gray-300 p-1.5 rounded-md cursor-pointer"
								title="Regional Leaderboard"
							>
								<FontAwesomeIcon icon="trophy" className="w-3.5 h-3.5" />
							</button>
							<button
								onClick={() => navigate("/profile")}
								className="bg-white/5 border border-white/10 text-gray-300 p-1.5 rounded-md cursor-pointer"
								title="Settings"
							>
								<FontAwesomeIcon icon="cog" className="w-3.5 h-3.5" />
							</button>
						</div>

						{latestActivity && (
							<div className="pt-2 border-t border-white/10">
								<div className="text-[10px] text-gray-400 mb-1">
									Latest: {formatDate(latestActivity.startDate)}
								</div>
								<div className="flex items-center justify-between gap-2">
									<div className="text-xs font-medium text-gray-200 truncate flex-1 max-w-[150px]">
										{latestActivity.name}
									</div>
									<div className="text-xs text-gray-300">
										{formatDistance(latestActivity.distance)}
									</div>
								</div>
							</div>
						)}

						<button
							onClick={openModal}
							disabled={loading}
							className="w-full text-[#FC5200] text-sm font-medium underline cursor-pointer py-2"
						>
							{loading ? "Loading..." : "Fetch from Strava"}
						</button>
					</div>
				</div>

				<div className="bg-[rgba(10,10,10,0.95)] backdrop-blur-md border-t border-white/10 p-2">
					<div className="flex items-center justify-center gap-2">
						<button
							onClick={() => setMobileExpanded(!mobileExpanded)}
							className="flex-shrink-0 bg-white/5 border border-white/10 text-gray-300 p-2.5 rounded-md cursor-pointer"
							style={{ height: '44px' }}
						>
							<FontAwesomeIcon
								icon={mobileExpanded ? "chevron-down" : "chevron-up"}
								className="w-3.5 h-3.5"
							/>
						</button>
					</div>

					{latestActivity && (
						<div className="mt-2 text-center">
							<div className="text-xs text-gray-400">
								Your latest activity: {formatDate(latestActivity.startDate)}
							</div>
						</div>
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

			{showLeaderboard && (
				<LeaderboardModal
					parentHexagonIds={currentParentHexagonIds.current}
					onClose={() => setShowLeaderboard(false)}
				/>
			)}
		</>
	);
}
