import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { getTrophyIcon, getTrophyColor, getRankTextColor, getRankTier } from "@/utils/calculateLocalStats";
import type { LocalStats } from "@/utils/calculateLocalStats";
import { useMap } from "@/contexts/useMap";

interface MapStatsProps {
	localStats: LocalStats;
	totalHexagons: number;
	globalRank?: number; // User's rank in global leaderboard
	isLoading?: boolean; // Hide everything while loading
	className?: string;
}

/**
 * Displays local and total hexagon statistics
 * Local: Hexes in current viewport with player rank
 * Total: All hexes owned by the player with global rank
 */
export function MapStats({ localStats, totalHexagons, globalRank, isLoading, className }: MapStatsProps) {
	const { isReducedOpacity, toggleOpacity, isZoomedOut } = useMap();

	// Hide when zoomed out
	if (isZoomedOut) return null;

	// Format rank text with tier rounding
	const getFormattedRank = (rank: number, count: number) => {
		if (count === 0 || rank === 0) return null;
		const tier = getRankTier(rank);
		return {
			text: `TOP ${tier}`,
			color: getRankTextColor(rank),
		};
	};

	const localRank = getFormattedRank(localStats.rank, localStats.count);
	const globalRankFormatted = globalRank && totalHexagons > 0 ? getFormattedRank(globalRank, totalHexagons) : null;

	// Hide everything while loading
	if (isLoading) {
		return null;
	}

	return (
		<div className={`flex flex-col gap-1 md:gap-2 p-0 ${className || ""}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
			{/* Local hexes (current viewport) */}
			<div className="flex items-center gap-1.5 text-xl uppercase font-bold tracking-wide text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.8),0_4px_8px_rgba(0,0,0,0.6),0_0_20px_rgba(0,0,0,0.4)] md:text-base md:gap-[0.3rem]">
				<span className="text-white/85 text-base font-bold tracking-wider min-w-[60px] [text-shadow:0_2px_4px_rgba(0,0,0,0.8),0_4px_8px_rgba(0,0,0,0.6)]">
					LOCAL
				</span>
				<span className="text-2xl font-black text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.9),0_4px_8px_rgba(0,0,0,0.7),0_0_20px_rgba(255,255,255,0.3)] md:text-xl">
					{localStats.count}
				</span>
				{localRank && (
					<span
						className="flex items-center gap-1.5 text-base font-extrabold tracking-wide [text-shadow:0_2px_4px_rgba(0,0,0,0.9),0_4px_8px_rgba(0,0,0,0.7),0_0_15px_rgba(255,215,0,0.4)] md:text-sm md:gap-[0.3rem]"
						style={{ color: localRank.color }}
					>
						<FontAwesomeIcon
							icon={getTrophyIcon() as IconProp}
							className="text-lg [filter:drop-shadow(0_2px_4px_rgba(0,0,0,0.8))_drop-shadow(0_0_12px_rgba(255,215,0,0.6))] md:text-base"
							style={{ color: getTrophyColor(localStats.rank) }}
						/>
						{localRank.text}
					</span>
				)}
			</div>

			{/* Total hexes (all time) */}
			<div className="flex items-center gap-1.5 text-xl uppercase font-bold tracking-wide text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.8),0_4px_8px_rgba(0,0,0,0.6),0_0_20px_rgba(0,0,0,0.4)] md:text-base md:gap-[0.3rem]">
				<span className="text-white/85 text-base font-bold tracking-wider min-w-[60px] [text-shadow:0_2px_4px_rgba(0,0,0,0.8),0_4px_8px_rgba(0,0,0,0.6)]">
					TOTAL
				</span>
				<span className="text-2xl font-black text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.9),0_4px_8px_rgba(0,0,0,0.7),0_0_20px_rgba(255,255,255,0.3)] md:text-xl">
					{totalHexagons}
				</span>
				{globalRankFormatted && (
					<span
						className="flex items-center gap-1.5 text-base font-extrabold tracking-wide [text-shadow:0_2px_4px_rgba(0,0,0,0.9),0_4px_8px_rgba(0,0,0,0.7),0_0_15px_rgba(255,215,0,0.4)] md:text-sm md:gap-[0.3rem]"
						style={{ color: globalRankFormatted.color }}
					>
						<FontAwesomeIcon
							icon={getTrophyIcon() as IconProp}
							className="text-lg [filter:drop-shadow(0_2px_4px_rgba(0,0,0,0.8))_drop-shadow(0_0_12px_rgba(255,215,0,0.6))] md:text-base"
							style={{ color: getTrophyColor(globalRank!) }}
						/>
						{globalRankFormatted.text}
					</span>
				)}
			</div>

			{/* Others Toggle */}
			<div className="flex items-center gap-2 mt-1 md:mt-2 cursor-pointer select-none group" onClick={toggleOpacity}>
				<span className="text-white/85 text-base font-bold tracking-wider min-w-[60px] [text-shadow:0_2px_4px_rgba(0,0,0,0.8),0_4px_8px_rgba(0,0,0,0.6)]">
					OTHERS
				</span>
				<div className="inline-block">
					<div
						className={`w-9 h-5 rounded-full relative transition-colors duration-300 ease-in-out ${
							!isReducedOpacity
								? "bg-[#fc4c02] border border-[#fc4c02]"
								: "bg-white/30 border border-white/20 group-hover:bg-white/40"
						}`}
					>
						<div
							className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all duration-300 ease-in-out shadow-md ${
								!isReducedOpacity ? "left-[18px]" : "left-0.5"
							}`}
						></div>
					</div>
				</div>
			</div>
		</div>
	);
}
