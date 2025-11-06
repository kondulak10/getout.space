/**
 * Pre-generate test hexagon data for Oslo
 * Run: node scripts/generate-test-data.js
 *
 * This generates mock data offline and saves to JSON files,
 * eliminating expensive h3-js calculations at runtime.
 */

import { latLngToCell, cellToChildren, gridDisk } from 'h3-js';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Oslo coordinates
const OSLO_LAT = 59.9139;
const OSLO_LNG = 10.7522;

// Activity types
const ACTIVITY_TYPES = ['Run', 'Ride', 'Walk', 'Hike', 'TrailRun'];

// Profile photo for premium user (using permanent test image that won't be deleted)
const PREMIUM_PHOTO = 'https://cdn.getout.space/permanent-test-images/premium-user/hexagon.png';

// Generate 12 mock users (3 premium)
function generateMockUsers() {
	return Array.from({ length: 12 }, (_, i) => ({
		id: `user-${i + 1}`,
		name: `User ${i + 1}`,
		isPremium: i < 3, // First 3 users are premium
		imghex: i < 3 ? PREMIUM_PHOTO : null, // Premium users have photos
	}));
}

// Get 7 parent hexagons
function getParentHexagons() {
	const centerParent = latLngToCell(OSLO_LAT, OSLO_LNG, 6);
	return gridDisk(centerParent, 1);
}

// Generate hexagons for a single parent
function generateHexagonsForParent(parentHex, users, activityIdStart) {
	const childHexagons = cellToChildren(parentHex, 10);
	const mockHexagons = [];
	const targetFillRate = 0.6;
	const usedHexagons = new Set();
	const targetCount = Math.floor(childHexagons.length * targetFillRate);

	const childHexSet = new Set(childHexagons);
	const hexNeighbors = new Map();

	const getNeighbors = (hex) => {
		if (!hexNeighbors.has(hex)) {
			const neighbors = gridDisk(hex, 1).filter(n => n !== hex && childHexSet.has(n));
			hexNeighbors.set(hex, neighbors);
		}
		return hexNeighbors.get(hex);
	};

	let activityIdCounter = activityIdStart;

	while (usedHexagons.size < targetCount && usedHexagons.size < childHexagons.length - 1) {
		const user = users[Math.floor(Math.random() * users.length)];
		const activityType = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)];
		// Pick route length (100-400 hexagons for extremely realistic long routes)
		const routeLength = Math.floor(Math.random() * 301) + 100;

		const availableHexagons = childHexagons.filter(h => !usedHexagons.has(h));
		if (availableHexagons.length === 0) break;

		const startHex = availableHexagons[Math.floor(Math.random() * availableHexagons.length)];
		const route = [startHex];
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

	return { hexagons: mockHexagons, nextActivityId: activityIdCounter };
}

// Main generation
console.log('🚀 Generating Oslo test data...');
console.time('Total generation time');

const users = generateMockUsers();
const parentHexagons = getParentHexagons();

console.log(`📊 Users: ${users.length}, Parent hexagons: ${parentHexagons.length}`);

// Create output directory
const outputDir = join(__dirname, '..', 'public', 'test-data');
mkdirSync(outputDir, { recursive: true });

// Generate data for each parent hex
let activityIdStart = 1000000;
const parentData = [];

parentHexagons.forEach((parentHex, index) => {
	console.log(`  Generating data for parent ${index + 1}/${parentHexagons.length}...`);
	const result = generateHexagonsForParent(parentHex, users, activityIdStart);

	const data = {
		parentHexagonId: parentHex,
		hexagons: result.hexagons,
	};

	// Save to individual file
	const filename = `parent-${index}.json`;
	writeFileSync(
		join(outputDir, filename),
		JSON.stringify(data, null, 2)
	);

	parentData.push({
		parentHexagonId: parentHex,
		hexagonCount: result.hexagons.length,
		filename,
	});

	activityIdStart = result.nextActivityId;
	console.log(`    ✓ ${result.hexagons.length} hexagons saved to ${filename}`);
});

// Save metadata
const metadata = {
	users,
	parentHexagons,
	parentData,
	totalHexagons: parentData.reduce((sum, p) => sum + p.hexagonCount, 0),
	generatedAt: new Date().toISOString(),
};

writeFileSync(
	join(outputDir, 'metadata.json'),
	JSON.stringify(metadata, null, 2)
);

console.timeEnd('Total generation time');
console.log('✅ Test data generated successfully!');
console.log(`📦 Total hexagons: ${metadata.totalHexagons}`);
console.log(`📁 Files saved to: ${outputDir}`);
