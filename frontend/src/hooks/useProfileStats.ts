import { useMemo } from 'react';

interface HexagonData {
	id: string;
	hexagonId: string;
	captureCount: number;
	firstCapturedAt: unknown;
	lastCapturedAt: unknown;
	firstCapturedBy?: { id: string } | null;
	currentOwnerId: string;
	captureHistory?: Array<{ userId: string; stravaId: number; capturedAt: unknown }> | null;
}

interface StolenHexagonData {
	id: string;
	hexagonId: string;
	currentOwnerId: string;
	currentOwnerStravaId: number | null;
	captureHistory?: Array<{ userId: string; stravaId: number; capturedAt: unknown }> | null;
}

interface PublicStatsData {
	totalActivities: number;
	totalDistance: number;
	totalMovingTime: number;
	latestActivityDate?: unknown;
}

interface UserData {
	id: string;
}

interface UseProfileStatsInput {
	user: UserData | null | undefined;
	hexagons: HexagonData[];
	stolenHexagons: StolenHexagonData[];
	publicStats: PublicStatsData | null | undefined;
}

export function useProfileStats({ user, hexagons, stolenHexagons, publicStats }: UseProfileStatsInput) {
	return useMemo(() => {
		if (!user) {
			return null;
		}

		const totalHexagons = hexagons.length;

		// Activity stats: use public stats
		const totalActivities = publicStats?.totalActivities || 0;
		const totalDistance = publicStats?.totalDistance || 0;
		const totalMovingTime = publicStats?.totalMovingTime || 0;

		// OG Hexagons - first to discover
		const ogHexagons = hexagons.filter((hex) => hex.firstCapturedBy?.id === user.id).length;

		// Conquered Hexagons - taken from others
		const conqueredHexagons = hexagons.filter((hex) => hex.firstCapturedBy?.id !== user.id).length;

		// Clean Territory - never challenged
		const cleanTerritory = hexagons.filter(
			(hex) => !hex.captureHistory || hex.captureHistory.length === 0
		).length;

		// Revenge Captures - reclaimed hexagons
		const revengeCaptures = hexagons.filter((hex) => {
			if (!hex.captureHistory || hex.captureHistory.length === 0) return false;
			return hex.captureHistory.some((entry) => entry.userId === user.id);
		}).length;

		// Battle tested hexagons
		const battleTestedHexagons = hexagons.filter((hex) => hex.captureCount > 1).length;

		// Total battles
		const totalBattles = hexagons.reduce((sum, hex) => sum + (hex.captureCount - 1), 0);

		// Calculate top rivals from stolen hexagons
		const rivalMap: Record<string, { count: number; userId: string; stravaId: number }> = {};

		stolenHexagons.forEach((hex) => {
			const rivalId = hex.currentOwnerId;
			if (rivalId && rivalId !== user.id) {
				if (!rivalMap[rivalId]) {
					rivalMap[rivalId] = {
						count: 0,
						userId: rivalId,
						stravaId: hex.currentOwnerStravaId || 0
					};
				}
				rivalMap[rivalId].count++;
			}
		});

		const topRivals = Object.values(rivalMap)
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		const totalRivalBattles = Object.values(rivalMap).reduce((sum, rival) => sum + rival.count, 0);

		// Most contested hexagon
		const mostContested = hexagons.length > 0
			? hexagons.reduce((max, hex) => (hex.captureCount > (max?.captureCount || 0) ? hex : max), hexagons[0])
			: null;

		// Longest held hexagon
		const longestHeld = hexagons.length > 0
			? hexagons.reduce((oldest, hex) => {
					if (!oldest) return hex;
					const oldestDate = new Date(oldest.lastCapturedAt as string).getTime();
					const hexDate = new Date(hex.lastCapturedAt as string).getTime();
					return hexDate < oldestDate ? hex : oldest;
			  }, hexagons[0])
			: null;

		const daysHeld = longestHeld
			? Math.floor(
					(Date.now() - new Date(longestHeld.lastCapturedAt as string).getTime()) /
						(1000 * 60 * 60 * 24)
			  )
			: 0;

		// Days since last activity
		const daysSinceLastActivity = publicStats?.latestActivityDate
			? Math.floor(
					(Date.now() - new Date(publicStats.latestActivityDate as string).getTime()) /
						(1000 * 60 * 60 * 24)
			  )
			: null;

		// Approximate area in km²
		const approximateArea = (totalHexagons * 0.015).toFixed(2);

		return {
			totalHexagons,
			totalActivities,
			ogHexagons,
			conqueredHexagons,
			cleanTerritory,
			revengeCaptures,
			battleTestedHexagons,
			totalBattles,
			topRivals,
			totalRivalBattles,
			mostContested,
			longestHeld,
			daysHeld,
			totalDistance,
			totalMovingTime,
			daysSinceLastActivity,
			approximateArea,
		};
	}, [user, hexagons, stolenHexagons, publicStats]);
}
