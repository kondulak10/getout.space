import { useEffect } from 'react';
import type { Map } from 'mapbox-gl';

interface UseHexagonLayerSetupOptions {
	mapRef: React.RefObject<Map | null>;
	enabled: boolean;
	setupHexagonLayer: () => void;
	updateHexagons: () => void;
	cleanupHexagonLayer: () => void;
	clearBoundsCache: () => void;
}

export function useHexagonLayerSetup({
	mapRef,
	enabled,
	setupHexagonLayer,
	updateHexagons,
	cleanupHexagonLayer,
	clearBoundsCache,
}: UseHexagonLayerSetupOptions) {
	useEffect(() => {
		if (!enabled || !mapRef.current) return;

		const map = mapRef.current;

		const initializeHexagons = () => {
			setupHexagonLayer();

			// Wait for map to be fully idle with valid bounds before first fetch
			const doInitialFetch = () => {
				console.log('🗺️ Map is ready, fetching initial hexagons...');
				// Clear any bounds that may have been cached by moveend/zoomend during initialization
				clearBoundsCache();
				// Now call the normal updateHexagons logic
				updateHexagons();
			};

			// Use idle event to ensure map has valid bounds
			map.once('idle', doInitialFetch);

			// Set up continuous listeners for pan/zoom
			map.on('moveend', updateHexagons);
			map.on('zoomend', updateHexagons);
		};

		if (map.loaded()) {
			initializeHexagons();
		} else {
			map.once('load', initializeHexagons);
		}

		return () => {
			map.off('moveend', updateHexagons);
			map.off('zoomend', updateHexagons);
			// Note: 'once' listeners are automatically removed after firing
			cleanupHexagonLayer();
		};
	}, [enabled, mapRef, setupHexagonLayer, updateHexagons, cleanupHexagonLayer, clearBoundsCache]);
}
