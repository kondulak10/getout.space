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

export async function loadTestData(): Promise<MockData> {
	const metadata = await fetch('/test-data/metadata.json').then(r => r.json()) as TestDataMetadata;

	const parentPromises = metadata.parentData.map(parentInfo =>
		fetch(`/test-data/${parentInfo.filename}`).then(r => r.json()) as Promise<ParentHexData>
	);

	const parentDataArray = await Promise.all(parentPromises);

	const allHexagons = parentDataArray.flatMap(parent => parent.hexagons);

	return {
		users: metadata.users,
		parentHexagons: metadata.parentHexagons,
		hexagons: allHexagons,
	};
}
