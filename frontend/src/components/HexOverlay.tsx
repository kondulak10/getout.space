import { useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import { useMap } from "@/contexts/useMap";
import { ShareButtons } from "./ShareButtons";
import { UserProfileCard } from "./UserProfileCard";
import { MobileNavigationBar } from "./MobileNavigationBar";
import { ActivitiesModal } from "./ActivitiesModal";
import { LeaderboardModal } from "./LeaderboardModal";
import { ErrorBoundary } from "./ErrorBoundary";
import "./HexOverlay.css";

interface HexOverlayProps {
	onActivityChanged?: () => void;
}

export function HexOverlay({ onActivityChanged }: HexOverlayProps) {
	const { user } = useAuth();
	const { currentParentHexagonIds } = useMap();
	const [showActivitiesModal, setShowActivitiesModal] = useState(false);
	const [showLeaderboard, setShowLeaderboard] = useState(false);

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

	return (
		<>
			{/* Share Buttons (top-left) */}
			<ShareButtons />

			{/* Desktop: User Profile Card (top-right) */}
			<div className="hidden md:block">
				<UserProfileCard
					onOpenActivities={() => setShowActivitiesModal(true)}
					onOpenLeaderboard={() => setShowLeaderboard(true)}
				/>
			</div>

			{/* Mobile: Bottom Navigation Bar */}
			<div className="md:hidden">
				<MobileNavigationBar
					onOpenActivities={() => setShowActivitiesModal(true)}
					onOpenLeaderboard={() => setShowLeaderboard(true)}
				/>
			</div>

			{/* Activities Modal (self-contained) */}
			{showActivitiesModal && (
				<ActivitiesModal
					isOpen={showActivitiesModal}
					onClose={() => setShowActivitiesModal(false)}
					onActivityChanged={onActivityChanged}
				/>
			)}

			{/* Leaderboard Modal */}
			{showLeaderboard && (
				<ErrorBoundary>
					<LeaderboardModal
						parentHexagonIds={Array.isArray(currentParentHexagonIds.current) ? currentParentHexagonIds.current : []}
						onClose={() => setShowLeaderboard(false)}
					/>
				</ErrorBoundary>
			)}
		</>
	);
}
