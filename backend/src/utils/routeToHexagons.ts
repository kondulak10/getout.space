import { latLngToCell, polygonToCells, gridPathCells } from 'h3-js';
import { H3_RESOLUTION, CLOSE_THRESHOLD } from '../constants/map';

export type RouteType = 'line' | 'area';

export interface RouteHexagonResult {
  hexagons: string[];
  type: RouteType;
}

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 */
const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
  const [lat1, lng1] = coord1;
  const [lat2, lng2] = coord2;

  // Convert to radians
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Convert route coordinates to H3 hexagons - line version with gap filling
 * @param coordinates Array of [lat, lng] pairs
 * @param fillGaps Whether to interpolate hexagons between GPS points (default: true)
 * @returns Array of unique H3 hexagon indexes
 */
export const routeToHexagonsLine = (
  coordinates: [number, number][],
  fillGaps: boolean = true
): string[] => {
  const hexSet = new Set<string>();

  if (!fillGaps) {
    // Simple mode: just convert each point to hexagon
    coordinates.forEach(([lat, lng]) => {
      const hex = latLngToCell(lat, lng, H3_RESOLUTION);
      hexSet.add(hex);
    });
    return Array.from(hexSet);
  }

  // Gap-filling mode: interpolate between consecutive points
  for (let i = 0; i < coordinates.length; i++) {
    const [lat, lng] = coordinates[i];
    const currentHex = latLngToCell(lat, lng, H3_RESOLUTION);
    hexSet.add(currentHex);

    // If there's a next point, fill gaps between current and next
    if (i < coordinates.length - 1) {
      const [nextLat, nextLng] = coordinates[i + 1];
      const nextHex = latLngToCell(nextLat, nextLng, H3_RESOLUTION);

      // Only interpolate if hexagons are different
      if (currentHex !== nextHex) {
        try {
          // Get all hexagons between current and next point
          const pathHexes = gridPathCells(currentHex, nextHex);
          pathHexes.forEach((hex) => hexSet.add(hex));
        } catch (error) {
          // gridPathCells not available or failed, just add both endpoints
          hexSet.add(nextHex);
        }
      }
    }
  }

  return Array.from(hexSet);
};

/**
 * Convert route coordinates to H3 hexagons - area version (fills interior)
 * @param coordinates Array of [lat, lng] pairs forming a closed polygon
 * @returns Array of unique H3 hexagon indexes
 */
export const routeToHexagonsArea = (coordinates: [number, number][]): string[] => {
  // Convert coordinates to H3 polygon format: [[lng, lat], ...]
  const h3Polygon = coordinates.map(([lat, lng]) => [lng, lat]);

  try {
    // Use H3's polygonToCells to fill the polygon with hexagons
    const hexagons = polygonToCells([h3Polygon], H3_RESOLUTION, true);
    return hexagons;
  } catch (error) {
    console.error('Error converting polygon to cells:', error);
    // Fallback to line mode
    return routeToHexagonsLine(coordinates);
  }
};

/**
 * Determine route type and convert to hexagons accordingly
 * @param coordinates Array of [lat, lng] pairs
 * @returns RouteHexagonResult with hexagons and type
 */
export const analyzeRouteAndConvertToHexagons = (
  coordinates: [number, number][]
): RouteHexagonResult => {
  if (coordinates.length < 3) {
    return {
      hexagons: routeToHexagonsLine(coordinates),
      type: 'line',
    };
  }

  const firstPoint = coordinates[0];
  const lastPoint = coordinates[coordinates.length - 1];

  // Calculate distance between first and last point
  const distance = calculateDistance(firstPoint, lastPoint);

  console.log(`📏 Distance between start and end: ${distance.toFixed(2)}m`);

  if (distance <= CLOSE_THRESHOLD) {
    console.log(`✅ Closed loop detected (within ${CLOSE_THRESHOLD}m threshold)`);

    // Get area hexagons (filled polygon)
    const areaHexagons = routeToHexagonsArea(coordinates);

    // Also get line hexagons (perimeter path)
    const lineHexagons = routeToHexagonsLine(coordinates, true);

    // Combine both sets to ensure no hexagons are omitted
    const combinedHexSet = new Set([...areaHexagons, ...lineHexagons]);
    const hexagons = Array.from(combinedHexSet);

    console.log(
      `📊 Area hexagons: ${areaHexagons.length}, Line hexagons: ${lineHexagons.length}, Combined: ${hexagons.length}`
    );

    return {
      hexagons,
      type: 'area',
    };
  } else {
    console.log(
      `➡️ Linear route detected (${distance.toFixed(2)}m > ${CLOSE_THRESHOLD}m)`
    );
    console.log(`🔗 Filling gaps between GPS points using gridPathCells...`);
    const hexagons = routeToHexagonsLine(coordinates, true); // true = fill gaps
    console.log(`✅ Gap filling complete`);
    return {
      hexagons,
      type: 'line',
    };
  }
};
