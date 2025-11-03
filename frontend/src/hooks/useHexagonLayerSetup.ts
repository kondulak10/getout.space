import { useEffect } from 'react';
import type { Map } from 'mapbox-gl';

interface UseHexagonLayerSetupOptions {
	mapRef: React.RefObject<Map | null>;
	enabled: boolean;
	setupHexagonLayer: () => void;
	updateHexagons: () => void;
	cleanupHexagonLayer: () => void;
}

export function useHexagonLayerSetup({
	mapRef,
	enabled,
	setupHexagonLayer,
	updateHexagons,
	cleanupHexagonLayer,
}: UseHexagonLayerSetupOptions) {
	useEffect(() => {
		if (!enabled || !mapRef.current) return;

		const map = mapRef.current;

		const initializeHexagons = () => {
			setupHexagonLayer();
			updateHexagons();

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
			cleanupHexagonLayer();
		};
	}, [enabled, mapRef, setupHexagonLayer, updateHexagons, cleanupHexagonLayer]);
}
