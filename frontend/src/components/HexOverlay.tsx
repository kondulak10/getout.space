import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "@/contexts/useAuth";
import { useMap } from "@/contexts/useMap";
import { ShareButtons } from "./ShareButtons";
import { MapStats } from "./MapStats";
import { UserProfileCard } from "./UserProfileCard";
import { MobileNavigationBar } from "./MobileNavigationBar";
import { ActivitiesModal } from "./ActivitiesModal";
import { LeaderboardModal } from "./LeaderboardModal";
import { ErrorBoundary } from "./ErrorBoundary";
import { calculateLocalStats } from "@/utils/calculateLocalStats";
import { UserPublicStatsDocument, MyGlobalRankDocument } from "@/gql/graphql";
import type { HexagonsByParentQuery } from "@/gql/graphql";
import "./HexOverlay.css";

interface HexOverlayProps {
	hexagonsData: HexagonsByParentQuery["hexagonsByParent"] | null;
	onActivityChanged?: () => void;
}

export function HexOverlay({ hexagonsData, onActivityChanged }: HexOverlayProps) {
	const { user } = useAuth();
	const { currentParentHexagonIds } = useMap();
	const [showActivitiesModal, setShowActivitiesModal] = useState(false);
	const [showLeaderboard, setShowLeaderboard] = useState(false);

	// Query for total hexagons (efficient - just the count)
	const { data: statsData, loading: statsLoading } = useQuery(UserPublicStatsDocument, {
		variables: { userId: user?.id || "" },
		skip: !user?.id,
	});

	// Query for user's global rank (just one number!)
	const { data: rankData, loading: rankLoading } = useQuery(MyGlobalRankDocument, {
		skip: !user?.id,
	});

	// Calculate local stats from current viewport hexagons (memoized)
	const localStats = useMemo(
		() => calculateLocalStats(hexagonsData, user?.id),
		[hexagonsData, user?.id]
	);

	const totalHexagons = statsData?.userPublicStats?.totalHexagons || 0;
	const globalRank = rankData?.myGlobalRank || undefined;

	// Loading state: true if either query is loading
	const isLoading = statsLoading || rankLoading;

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
			<ShareButtons localStats={localStats} totalHexagons={totalHexagons} globalRank={globalRank} />

			{/* Map Stats (top-left, below share buttons) */}
			<div className="absolute top-28 md:top-36 left-4 z-10">
				<MapStats
					localStats={localStats}
					totalHexagons={totalHexagons}
					globalRank={globalRank}
					isLoading={isLoading}
				/>
			</div>

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
