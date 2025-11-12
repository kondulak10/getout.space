import { useCallback, useEffect, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { h3ToGeoJSON } from '@/utils/hexagonUtils';
import { getUserColor } from '@/constants/hexagonColors';
import type { MockData } from '@/utils/mockHexData';

interface UseStaticHexagonsOptions {
	mapRef: React.RefObject<MapboxMap | null>;
	mockData: MockData;
}

export function useStaticHexagons({ mapRef, mockData }: UseStaticHexagonsOptions) {
	const layersSetupRef = useRef(false);

	const setupHexagonLayer = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		if (map.getSource('hexagons')) {
			return;
		}

		map.addSource('hexagons', {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: [],
			},
		});

		map.addLayer({
			id: 'hexagon-fills',
			type: 'fill',
			source: 'hexagons',
			paint: {
				'fill-color': ['get', 'color'],
				'fill-opacity': 0.5,
			},
		});

		map.addLayer({
			id: 'hexagon-outlines',
			type: 'line',
			source: 'hexagons',
			paint: {
				'line-color': '#000000',
				'line-width': 1.5,
				'line-opacity': 0.7,
			},
		});
	}, [mapRef]);

	const setupParentLayer = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		if (map.getSource('parent-hexagons')) {
			return;
		}

		map.addSource('parent-hexagons', {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: [],
			},
		});

		map.addLayer({
			id: 'parent-hexagon-borders',
			type: 'line',
			source: 'parent-hexagons',
			paint: {
				'line-color': '#BBBBBB',
				'line-width': 2,
				'line-opacity': 0.5,
			},
		});
	}, [mapRef]);

	const updateHexagons = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		if (!map.getSource('hexagons')) {
			setupHexagonLayer();
			setTimeout(() => updateHexagons(), 100);
			return;
		}

		const features = mockData.hexagons.map((hex) => {
			const feature = h3ToGeoJSON(hex.hexagonId);
			const color = getUserColor(hex.currentOwnerId);

			return {
				...feature,
				properties: {
					...feature.properties,
					hexagonId: hex.hexagonId,
					userId: hex.currentOwnerId,
					color: color,
					captureCount: hex.captureCount,
					activityType: hex.activityType,
				},
			};
		});

		const geojson: GeoJSON.FeatureCollection = {
			type: 'FeatureCollection',
			features,
		};

		const source = map.getSource('hexagons') as import('mapbox-gl').GeoJSONSource;
		if (source) {
			source.setData(geojson);
			map.once('idle', () => {
			});
		}
	}, [mapRef, mockData.hexagons, setupHexagonLayer]);

	const updateParentHexagons = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		const source = map.getSource('parent-hexagons') as import('mapbox-gl').GeoJSONSource;
		if (!source) {
			setupParentLayer();
			setTimeout(() => updateParentHexagons(), 100);
			return;
		}

		const features = mockData.parentHexagons.map((parentId) => {
			return h3ToGeoJSON(parentId);
		});

		const geojson: GeoJSON.FeatureCollection = {
			type: 'FeatureCollection',
			features,
		};

		source.setData(geojson);
	}, [mapRef, mockData.parentHexagons, setupParentLayer]);

	const cleanupHexagonLayer = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		if (!map.getStyle()) {
			return;
		}

		try {
			if (map.getLayer('hexagon-fills')) {
				map.removeLayer('hexagon-fills');
			}
			if (map.getLayer('hexagon-outlines')) {
				map.removeLayer('hexagon-outlines');
			}
			if (map.getSource('hexagons')) {
				map.removeSource('hexagons');
			}

			if (map.getLayer('parent-hexagon-borders')) {
				map.removeLayer('parent-hexagon-borders');
			}
			if (map.getSource('parent-hexagons')) {
				map.removeSource('parent-hexagons');
			}

		} catch {
			// Cleanup may fail if layers already removed
		}

		layersSetupRef.current = false;
	}, [mapRef]);

	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		const initializeHexagons = () => {
			setupHexagonLayer();
			setupParentLayer();
			layersSetupRef.current = true;

			setTimeout(() => {
				updateHexagons();
				updateParentHexagons();
			}, 100);
		};

		if (map.loaded()) {
			initializeHexagons();
		} else {
			map.once('load', initializeHexagons);
		}

		return () => {
			cleanupHexagonLayer();
		};
	}, [mapRef, setupHexagonLayer, setupParentLayer, updateHexagons, updateParentHexagons, cleanupHexagonLayer]);

	return {
		hexagonCount: mockData.hexagons.length,
		userCount: mockData.users.length,
	};
}
