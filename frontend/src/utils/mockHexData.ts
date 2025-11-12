import { latLngToCell, cellToChildren, gridDisk } from 'h3-js';

export interface MockUser {
	id: string;
	name: string;
	isPremium: boolean;
	imghex: string;
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

const OSLO_LAT = 59.9139;
const OSLO_LNG = 10.7522;

const ACTIVITY_TYPES = ['Run', 'Ride', 'Walk', 'Hike', 'TrailRun'];

const PREMIUM_PHOTO = 'https://getout-profile-images.s3.eu-north-1.amazonaws.com/premium.jpg';

function generateMockUsers(): MockUser[] {
	return Array.from({ length: 12 }, (_, i) => ({
		id: `user-${i + 1}`,
		name: `User ${i + 1}`,
		isPremium: i < 3,
		imghex: i < 3 ? PREMIUM_PHOTO : '',
	}));
}

function getParentHexagons(): string[] {
	const centerParent = latLngToCell(OSLO_LAT, OSLO_LNG, 6);

	const ring = gridDisk(centerParent, 1);
	return ring;
}

function getChildHexagons(parentHexagons: string[]): string[] {
	const allChildren: string[] = [];

	parentHexagons.forEach(parentHex => {
		const children = cellToChildren(parentHex, 10);
		allChildren.push(...children);
	});

	return allChildren;
}

function generateMockHexagons(childHexagons: string[], users: MockUser[]): MockHexagon[] {
	const mockHexagons: MockHexagon[] = [];
	const targetFillRate = 0.6;
	const usedHexagons = new Set<string>();
	const targetCount = Math.floor(childHexagons.length * targetFillRate);

	const hexNeighbors = new Map<string, string[]>();
	const childHexSet = new Set(childHexagons);

	const getNeighbors = (hex: string): string[] => {
		if (!hexNeighbors.has(hex)) {
			const neighbors = gridDisk(hex, 1).filter(n => n !== hex && childHexSet.has(n));
			hexNeighbors.set(hex, neighbors);
		}
		return hexNeighbors.get(hex)!;
	};

	let activityIdCounter = 1000000;

	while (usedHexagons.size < targetCount && usedHexagons.size < childHexagons.length - 1) {
		const user = users[Math.floor(Math.random() * users.length)];

		const activityType = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)];

		const routeLength = Math.floor(Math.random() * 301) + 100;

		const availableHexagons = childHexagons.filter(h => !usedHexagons.has(h));
		if (availableHexagons.length === 0) break;

		const startHex = availableHexagons[Math.floor(Math.random() * availableHexagons.length)];
		const route: string[] = [startHex];
		usedHexagons.add(startHex);

		let currentHex = startHex;
		for (let i = 1; i < routeLength; i++) {
			const neighbors = getNeighbors(currentHex);
			const availableNeighbors = neighbors.filter(n => !usedHexagons.has(n));

			if (availableNeighbors.length === 0) break;

			const nextHex = availableNeighbors[Math.floor(Math.random() * availableNeighbors.length)];
			route.push(nextHex);
			usedHexagons.add(nextHex);
			currentHex = nextHex;

			if (usedHexagons.size >= targetCount) break;
		}

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

export function generateOsloMockData(): MockData {
	const users = generateMockUsers();
	const parentHexagons = getParentHexagons();
	const childHexagons = getChildHexagons(parentHexagons);
	const hexagons = generateMockHexagons(childHexagons, users);

	return {
		users,
		parentHexagons,
		hexagons,
	};
}
