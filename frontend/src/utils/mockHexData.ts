import { latLngToCell, cellToChildren, gridDisk } from 'h3-js';

export interface MockUser {
	id: string;
	name: string;
	isPremium: boolean;
	imghex: string; // Profile photo URL
}

export interface MockHexagon {
	hexagonId: string;
	currentOwnerId: string;
	currentOwnerStravaId: number;
	currentOwnerIsPremium: boolean;
	currentOwnerImghex: string;
	currentStravaActivityId: number;
	activityType: string;
	captureCount: number;
	lastCapturedAt: string;
}

export interface MockData {
	users: MockUser[];
	parentHexagons: string[];
	hexagons: MockHexagon[];
}

// Oslo coordinates
const OSLO_LAT = 59.9139;
const OSLO_LNG = 10.7522;

// Activity types for variety
const ACTIVITY_TYPES = ['Run', 'Ride', 'Walk', 'Hike', 'TrailRun'];

// Profile photo for premium user
const PREMIUM_PHOTO = 'https://cdn.getout.space/profile-images/690bc04570486177aae3957a/hexagon.png';

/**
 * Generate 12 mock users (3 premium)
 */
function generateMockUsers(): MockUser[] {
	return Array.from({ length: 12 }, (_, i) => ({
		id: `user-${i + 1}`,
		name: `User ${i + 1}`,
		isPremium: i < 3, // First 3 users are premium
		imghex: i < 3 ? PREMIUM_PHOTO : '', // Premium users have photos
	}));
}

/**
 * Get 7 parent hexagons (resolution 6) centered around Oslo
 * Center + 1 ring = exactly 7 hexagons
 */
function getParentHexagons(): string[] {
	// Get center parent hex
	const centerParent = latLngToCell(OSLO_LAT, OSLO_LNG, 6);

	// Get center + 1 ring = exactly 7 hexagons (for realistic testing)
	const ring = gridDisk(centerParent, 1);
	return ring;
}

/**
 * Get all child hexagons (resolution 10) for parent hexagons
 */
function getChildHexagons(parentHexagons: string[]): string[] {
	const allChildren: string[] = [];

	parentHexagons.forEach(parentHex => {
		// Get all resolution 10 children of this resolution 6 parent
		const children = cellToChildren(parentHex, 10);
		allChildren.push(...children);
	});

	return allChildren;
}

/**
 * Generate mock hexagon data with ~60% fill rate
 * Hexagons are grouped into "routes" (contiguous sets) to simulate actual runs/rides
 */
function generateMockHexagons(childHexagons: string[], users: MockUser[]): MockHexagon[] {
	const mockHexagons: MockHexagon[] = [];
	const targetFillRate = 0.6; // 60%
	const usedHexagons = new Set<string>();
	const targetCount = Math.floor(childHexagons.length * targetFillRate);

	// Create a map of hexagon neighbors for building routes
	// PERFORMANCE: Only build neighbor map as needed, not for all hexagons upfront
	const hexNeighbors = new Map<string, string[]>();
	const childHexSet = new Set(childHexagons); // Faster lookups

	const getNeighbors = (hex: string): string[] => {
		if (!hexNeighbors.has(hex)) {
			const neighbors = gridDisk(hex, 1).filter(n => n !== hex && childHexSet.has(n));
			hexNeighbors.set(hex, neighbors);
		}
		return hexNeighbors.get(hex)!;
	};

	let activityIdCounter = 1000000;

	// Generate routes for each user until we reach target fill rate
	while (usedHexagons.size < targetCount && usedHexagons.size < childHexagons.length - 1) {
		// Pick a random user
		const user = users[Math.floor(Math.random() * users.length)];

		// Pick random activity type
		const activityType = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)];

		// Pick route length (100-400 hexagons for extremely realistic long routes)
		// Very long contiguous sections that look like real running/cycling data
		const routeLength = Math.floor(Math.random() * 301) + 100;

		// Find a starting hexagon that's not used
		const availableHexagons = childHexagons.filter(h => !usedHexagons.has(h));
		if (availableHexagons.length === 0) break;

		const startHex = availableHexagons[Math.floor(Math.random() * availableHexagons.length)];
		const route: string[] = [startHex];
		usedHexagons.add(startHex);

		// Build route by adding neighboring hexagons
		let currentHex = startHex;
		for (let i = 1; i < routeLength; i++) {
			const neighbors = getNeighbors(currentHex);
			const availableNeighbors = neighbors.filter(n => !usedHexagons.has(n));

			if (availableNeighbors.length === 0) break;

			// Pick a random available neighbor
			const nextHex = availableNeighbors[Math.floor(Math.random() * availableNeighbors.length)];
			route.push(nextHex);
			usedHexagons.add(nextHex);
			currentHex = nextHex;

			// Stop if we've reached our target
			if (usedHexagons.size >= targetCount) break;
		}

		// Create hexagon data for this route
		const activityId = activityIdCounter++;
		const captureCount = Math.floor(Math.random() * 10) + 1;
		const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();

		route.forEach(hexagonId => {
			mockHexagons.push({
				hexagonId,
				currentOwnerId: user.id,
				currentOwnerStravaId: parseInt(user.id.split('-')[1]) * 1000,
				currentOwnerIsPremium: user.isPremium,
				currentOwnerImghex: user.imghex,
				currentStravaActivityId: activityId,
				activityType,
				captureCount,
				lastCapturedAt: timestamp,
			});
		});
	}

	return mockHexagons;
}

/**
 * Generate complete mock data for Oslo test page
 */
export function generateOsloMockData(): MockData {
	const users = generateMockUsers();
	const parentHexagons = getParentHexagons();
	const childHexagons = getChildHexagons(parentHexagons);
	const hexagons = generateMockHexagons(childHexagons, users);

	console.log('🚀 Mock data generated:', {
		userCount: users.length,
		premiumUsers: users.filter(u => u.isPremium).length,
		parentHexCount: parentHexagons.length,
		totalChildHexCount: childHexagons.length,
		filledHexCount: hexagons.length,
		fillRate: `${((hexagons.length / childHexagons.length) * 100).toFixed(1)}%`,
	});

	console.warn('⚠️ PERFORMANCE WARNING: Rendering', hexagons.length, 'hexagons!');

	return {
		users,
		parentHexagons,
		hexagons,
	};
}
