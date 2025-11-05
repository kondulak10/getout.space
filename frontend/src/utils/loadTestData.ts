import type { MockData, MockHexagon } from './mockHexData';

interface ParentHexData {
	parentHexagonId: string;
	hexagons: MockHexagon[];
}

interface TestDataMetadata {
	users: MockData['users'];
	parentHexagons: string[];
	parentData: {
		parentHexagonId: string;
		hexagonCount: number;
		filename: string;
	}[];
	totalHexagons: number;
	generatedAt: string;
}

/**
 * Load pre-generated test data from JSON files
 * Loads all 7 parent hexagons in parallel for maximum performance
 */
export async function loadTestData(): Promise<MockData> {
	console.time('📦 Load test data from files');

	// Load metadata first
	const metadata = await fetch('/test-data/metadata.json').then(r => r.json()) as TestDataMetadata;

	console.log(`📊 Loading ${metadata.parentData.length} parent hexagons with ${metadata.totalHexagons} total hexagons`);

	// Load all parent files in parallel
	console.time('⚡ Parallel parent file loading');
	const parentPromises = metadata.parentData.map(parentInfo =>
		fetch(`/test-data/${parentInfo.filename}`).then(r => r.json()) as Promise<ParentHexData>
	);

	const parentDataArray = await Promise.all(parentPromises);
	console.timeEnd('⚡ Parallel parent file loading');

	// Flatten all hexagons from all parents
	const allHexagons = parentDataArray.flatMap(parent => parent.hexagons);

	console.timeEnd('📦 Load test data from files');
	console.log(`✅ Loaded ${allHexagons.length} hexagons from ${parentDataArray.length} parent files`);
	console.log(`   Generated at: ${metadata.generatedAt}`);

	return {
		users: metadata.users,
		parentHexagons: metadata.parentHexagons,
		hexagons: allHexagons,
	};
}
