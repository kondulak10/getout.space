import type { HexagonsByParentQuery } from "@/gql/graphql";

export interface LocalStats {
	count: number;
	rank: number;
}

/**
 * Calculate local hexagon statistics for the current user
 * @param hexagonsData - Hexagons visible in current viewport
 * @param userId - Current user's ID
 * @returns Local hex count and user's rank among visible players
 */
export function calculateLocalStats(
	hexagonsData: HexagonsByParentQuery["hexagonsByParent"] | null,
	userId: string | undefined
): LocalStats {
	if (!userId || !hexagonsData) {
		return { count: 0, rank: 0 };
	}

	// Count hexagons owned by current user
	const userHexes = hexagonsData.filter(
		(hex) => hex.currentOwnerId === userId
	);
	const count = userHexes.length;

	// Group hexagons by owner and count
	const ownerCounts = hexagonsData.reduce((acc, hex) => {
		const ownerId = hex.currentOwnerId;
		if (ownerId) {
			acc[ownerId] = (acc[ownerId] || 0) + 1;
		}
		return acc;
	}, {} as Record<string, number>);

	// Sort owners by hex count (descending) and find user's rank
	const sortedOwners = Object.entries(ownerCounts).sort(
		([, countA], [, countB]) => countB - countA
	);

	const userRank = sortedOwners.findIndex(([ownerId]) => ownerId === userId);
	const rank = userRank >= 0 ? userRank + 1 : 0;

	return { count, rank };
}

/**
 * Get trophy icon name based on rank
 */
export function getTrophyIcon(): string {
	return "trophy"; // Always use trophy icon
}

/**
 * Get trophy color based on rank
 * Gold for TOP 10, Grey for above TOP 10
 */
export function getTrophyColor(rank: number): string {
	if (rank <= 10) return "#FFD700"; // Gold
	return "#9CA3AF"; // Grey (gray-400)
}

/**
 * Get text color based on rank
 * Gold for TOP 10, Grey for above TOP 10
 */
export function getRankTextColor(rank: number): string {
	if (rank <= 10) return "#FFD700"; // Gold
	return "#9CA3AF"; // Grey (gray-400)
}

/**
 * Round rank to nearest tier
 * For TOP 1-10: Show exact rank (TOP 1, TOP 2, ..., TOP 10)
 * Above TOP 10: Show tier (TOP 25, TOP 50, TOP 100, etc.)
 */
export function getRankTier(rank: number): number {
	// Show exact rank for TOP 1-10
	if (rank <= 10) return rank;

	// Tier rounding for ranks above 10
	if (rank <= 25) return 25;
	if (rank <= 50) return 50;
	if (rank <= 100) return 100;
	if (rank <= 250) return 250;
	if (rank <= 500) return 500;
	if (rank <= 1000) return 1000;
	if (rank <= 1500) return 1500;
	if (rank <= 2000) return 2000;
	if (rank <= 2500) return 2500;
	if (rank <= 3000) return 3000;
	if (rank <= 4000) return 4000;
	if (rank <= 5000) return 5000;

	// For ranks above 5000, round to nearest 1000
	return Math.ceil(rank / 1000) * 1000;
}
