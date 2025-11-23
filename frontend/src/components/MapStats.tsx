import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { getTrophyIcon, getTrophyColor, getRankTextColor, getRankTier } from "@/utils/calculateLocalStats";
import type { LocalStats } from "@/utils/calculateLocalStats";
import { useMap } from "@/contexts/useMap";
import styles from "./MapStats.module.css";

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
	const { isReducedOpacity, toggleOpacity } = useMap();

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
		<div className={`${styles.container} ${className || ""}`}>
			{/* Local hexes (current viewport) */}
			<div className={styles.stat}>
				<span className={styles.label}>LOCAL</span>
				<span className={styles.value}>{localStats.count}</span>
				{localRank && (
					<span className={styles.rank} style={{ color: localRank.color }}>
						<FontAwesomeIcon
							icon={getTrophyIcon(localStats.rank) as IconProp}
							className={styles.trophy}
							style={{ color: getTrophyColor(localStats.rank) }}
						/>
						{localRank.text}
					</span>
				)}
			</div>

			{/* Total hexes (all time) */}
			<div className={styles.stat}>
				<span className={styles.label}>TOTAL</span>
				<span className={styles.value}>{totalHexagons}</span>
				{globalRankFormatted && (
					<span className={styles.rank} style={{ color: globalRankFormatted.color }}>
						<FontAwesomeIcon
							icon={getTrophyIcon(globalRank!) as IconProp}
							className={styles.trophy}
							style={{ color: getTrophyColor(globalRank!) }}
						/>
						{globalRankFormatted.text}
					</span>
				)}
			</div>

			{/* Opacity Toggle */}
			<div className={styles.toggleContainer} onClick={toggleOpacity}>
				<span className={styles.toggleLabel}>OPACITY</span>
				<div className={styles.switch}>
					<div className={`${styles.track} ${!isReducedOpacity ? styles.trackOn : styles.trackOff}`}>
						<div className={`${styles.circle} ${!isReducedOpacity ? styles.circleOn : styles.circleOff}`}></div>
					</div>
				</div>
			</div>
		</div>
	);
}
