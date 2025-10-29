import {
	H3_RESOLUTION,
	HEX_COLORS,
	IMAGE_PROBABILITY,
	SAMPLE_IMAGE_URL,
	getRingSizeForZoom,
} from "@/constants/map";
import { cellToBoundary, gridDisk, latLngToCell } from "h3-js";
import type { Map as MapboxMap } from "mapbox-gl";

export interface HexagonData {
	color: string;
	image?: string;
}

// Generate random color from palette
export const getRandomColor = (): string => {
	return HEX_COLORS[Math.floor(Math.random() * HEX_COLORS.length)];
};

// Convert H3 cell to GeoJSON polygon
export const h3ToGeoJSON = (h3Index: string) => {
	const boundary = cellToBoundary(h3Index, true);
	const closedBoundary = [...boundary, boundary[0]];

	return {
		type: "Feature" as const,
		properties: { h3Index },
		geometry: {
			type: "Polygon" as const,
			coordinates: [closedBoundary],
		},
	};
};

// Calculate hexagon center (memoizable)
export const getHexagonCenter = (hex: string): [number, number] => {
	const boundary = cellToBoundary(hex);
	let sumLat = 0;
	let sumLng = 0;
	boundary.forEach(([lat, lng]) => {
		sumLat += lat;
		sumLng += lng;
	});
	return [sumLat / boundary.length, sumLng / boundary.length];
};

// Get hexagons for current viewport
export const getViewportHexagons = (map: MapboxMap): string[] => {
	const bounds = map.getBounds();
	const center = map.getCenter();
	const zoom = map.getZoom();

	const centerCell = latLngToCell(center.lat, center.lng, H3_RESOLUTION);

	const ringSize = getRingSizeForZoom(zoom);

	const hexagons = gridDisk(centerCell, ringSize);

	return hexagons.filter((hex) => {
		const [centerLat, centerLng] = getHexagonCenter(hex);
		return (
			bounds &&
			centerLat >= bounds.getSouth() &&
			centerLat <= bounds.getNorth() &&
			centerLng >= bounds.getWest() &&
			centerLng <= bounds.getEast()
		);
	});
};

// Assign color/image data to hexagon if not already assigned
export const getOrCreateHexagonData = (
	hex: string,
	dataMap: Map<string, HexagonData>
): HexagonData => {
	if (!dataMap.has(hex)) {
		const hasImage = Math.random() < IMAGE_PROBABILITY;
		const data: HexagonData = {
			color: getRandomColor(),
			image: hasImage ? SAMPLE_IMAGE_URL : undefined,
		};
		dataMap.set(hex, data);
	}
	return dataMap.get(hex)!;
};

// Create GeoJSON features from hexagons
export const createHexagonFeatures = (hexagons: string[], dataMap: Map<string, HexagonData>) => {
	return hexagons.map((hex) => {
		const feature = h3ToGeoJSON(hex);
		const data = getOrCreateHexagonData(hex, dataMap);
		const hasImage = !!data.image;

		return {
			...feature,
			properties: {
				...feature.properties,
				color: data.color,
				hasImage: hasImage,
			},
		};
	});
};
