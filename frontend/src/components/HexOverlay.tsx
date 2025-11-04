import { useAuth } from "@/contexts/useAuth";
import { useActivitiesManager } from "@/hooks/useActivitiesManager";
import { useUserActivities } from "@/hooks/useUserActivities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { ActivitiesManagerModal } from "./ActivitiesManagerModal";
import "./HexOverlay.css";

interface HexOverlayProps {
	view: "only-you" | "battle";
	onViewChange: (view: "only-you" | "battle") => void;
	onActivityChanged?: () => void;
}

export function HexOverlay({ view, onViewChange, onActivityChanged }: HexOverlayProps) {
	const { user } = useAuth();
	const { latestActivity } = useUserActivities();
	const {
		showModal,
		activities,
		loading,
		openModal,
		closeModal,
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
			<div className="absolute top-4 right-4 z-10">
				<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-white/10 rounded-xl p-4 min-w-80 shadow-2xl">
					{/* User Profile Section */}
					<div className="flex items-center gap-3 mb-4">
						<img
							src={user.profile.imghex || user.profile.profile}
							alt={`${user.profile.firstname} ${user.profile.lastname}`}
							className="w-14 h-14 object-cover hex-clip"
						/>
						<div className="flex-1">
							<div className="font-semibold text-sm text-gray-100">
								{user.profile.firstname} {user.profile.lastname}
							</div>
							<div className="text-xs text-gray-400">ID: {user.stravaId}</div>
						</div>
						<button
							onClick={() => navigate("/profile")}
							className="bg-white/5 border border-white/10 text-gray-300 p-2 rounded-md transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white"
							title="Settings"
						>
							<FontAwesomeIcon icon="cog" className="w-4 h-4" />
						</button>
					</div>

					{/* View Toggle Section */}
					<div className="mb-4">
						<div className="relative flex bg-white/5 border border-white/10 rounded-lg p-1 overflow-hidden">
							<div
								className={`hex-switch-slider absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md transition-all z-0 animate-holographic ${
									view === "only-you" ? "left-1/2" : "left-1"
								}`}
							></div>
							<button
								onClick={() => onViewChange(view === "battle" ? "only-you" : "battle")}
								className={`flex-1 relative z-10 flex items-center justify-center px-3 py-2 text-[13px] font-medium bg-transparent border-0 transition-all cursor-pointer ${
									view === "battle" ? "text-white" : "text-white/30"
								}`}
							>
								<FontAwesomeIcon icon="swords" className="w-3 h-3 mr-2" />
								Battle
							</button>
							<button
								onClick={() => onViewChange(view === "only-you" ? "battle" : "only-you")}
								className={`flex-1 relative z-10 flex items-center justify-center px-3 py-2 text-[13px] font-medium bg-transparent border-0 transition-all cursor-pointer ${
									view === "only-you" ? "text-white" : "text-white/30"
								}`}
							>
								<FontAwesomeIcon icon="user" className="w-3 h-3 mr-2" />
								Solo
							</button>
						</div>
					</div>

					{/* Latest Activity Section */}
					{latestActivity && (
						<div className="pt-3 border-t border-white/10 mb-4">
							<div className="text-xs text-gray-400 mb-1 flex items-center gap-2">
								<FontAwesomeIcon icon="location-dot" className="w-3 h-3" />
								Latest: {formatDate(latestActivity.startDate)}
							</div>
							<div className="flex items-center justify-between gap-2">
								<div className="text-sm font-medium text-gray-200 truncate flex-1">
									{latestActivity.name}
								</div>
								<div className="text-sm text-gray-300 whitespace-nowrap">
									{formatDistance(latestActivity.distance)}
								</div>
							</div>
						</div>
					)}

					{/* Fetch from Strava Link */}
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

			{/* Activities Modal */}
			<ActivitiesManagerModal
				isOpen={showModal}
				activities={activities}
				loading={loading}
				onClose={closeModal}
				onProcess={handleSaveActivity}
				onDelete={handleRemoveActivity}
			/>

		</>
	);
}
