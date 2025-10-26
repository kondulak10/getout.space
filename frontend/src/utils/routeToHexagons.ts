import { latLngToCell } from 'h3-js';
import { H3_RESOLUTION } from '@/constants/map';

/**
 * Convert route coordinates to unique H3 hexagons
 * @param coordinates Array of [lat, lng] pairs
 * @returns Array of unique H3 hexagon indexes
 */
export const routeToHexagons = (coordinates: [number, number][]): string[] => {
	const hexSet = new Set<string>();

	coordinates.forEach(([lat, lng]) => {
		const hex = latLngToCell(lat, lng, H3_RESOLUTION);
		hexSet.add(hex);
	});

	return Array.from(hexSet);
};

/**
 * Sample route coordinates to reduce density (performance optimization)
 * @param coordinates Array of [lat, lng] pairs
 * @param sampleRate Take every Nth point (default: 5)
 * @returns Sampled coordinates
 */
export const sampleRouteCoordinates = (
	coordinates: [number, number][],
	sampleRate: number = 5
): [number, number][] => {
	if (coordinates.length <= sampleRate * 2) {
		return coordinates; // Return all if route is short
	}

	const sampled: [number, number][] = [];

	// Always include first point
	sampled.push(coordinates[0]);

	// Sample every Nth point
	for (let i = sampleRate; i < coordinates.length; i += sampleRate) {
		sampled.push(coordinates[i]);
	}

	// Always include last point
	if (coordinates[coordinates.length - 1] !== sampled[sampled.length - 1]) {
		sampled.push(coordinates[coordinates.length - 1]);
	}

	return sampled;
};
