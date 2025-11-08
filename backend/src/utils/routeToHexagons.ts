import { latLngToCell, polygonToCells, gridPathCells } from 'h3-js';
import { H3_RESOLUTION, CLOSE_THRESHOLD } from '../constants/map';

export type RouteType = 'line' | 'area';

export interface RouteHexagonResult {
  hexagons: string[];
  type: RouteType;
}

const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
  const [lat1, lng1] = coord1;
  const [lat2, lng2] = coord2;

  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const routeToHexagonsLine = (
  coordinates: [number, number][],
  fillGaps: boolean = true
): string[] => {
  const hexSet = new Set<string>();

  if (!fillGaps) {
    coordinates.forEach(([lat, lng]) => {
      const hex = latLngToCell(lat, lng, H3_RESOLUTION);
      hexSet.add(hex);
    });
    return Array.from(hexSet);
  }

  for (let i = 0; i < coordinates.length; i++) {
    const [lat, lng] = coordinates[i];
    const currentHex = latLngToCell(lat, lng, H3_RESOLUTION);
    hexSet.add(currentHex);

    if (i < coordinates.length - 1) {
      const [nextLat, nextLng] = coordinates[i + 1];
      const nextHex = latLngToCell(nextLat, nextLng, H3_RESOLUTION);

      if (currentHex !== nextHex) {
        try {
          const pathHexes = gridPathCells(currentHex, nextHex);
          pathHexes.forEach((hex) => hexSet.add(hex));
        } catch (error) {
          hexSet.add(nextHex);
        }
      }
    }
  }

  return Array.from(hexSet);
};

export const routeToHexagonsArea = (coordinates: [number, number][]): string[] => {
  const h3Polygon = coordinates.map(([lat, lng]) => [lng, lat]);

  try {
    const hexagons = polygonToCells([h3Polygon], H3_RESOLUTION, true);
    return hexagons;
  } catch (error) {
    console.error('Error converting polygon to cells:', error);
    return routeToHexagonsLine(coordinates);
  }
};

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

  const distance = calculateDistance(firstPoint, lastPoint);

  console.log(`📏 Distance between start and end: ${distance.toFixed(2)}m`);

  if (distance <= CLOSE_THRESHOLD) {
    console.log(`✅ Closed loop detected (within ${CLOSE_THRESHOLD}m threshold)`);

    const areaHexagons = routeToHexagonsArea(coordinates);

    const lineHexagons = routeToHexagonsLine(coordinates, true);

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
    const hexagons = routeToHexagonsLine(coordinates, true);
    console.log(`✅ Gap filling complete`);
    return {
      hexagons,
      type: 'line',
    };
  }
};
