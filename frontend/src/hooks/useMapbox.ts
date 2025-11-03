import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAP_VIEWPORTS, DEFAULT_VIEWPORT, type ViewportKey } from '@/config/mapViewports';

interface UseMapboxOptions {
	viewport?: ViewportKey;
	style?: string;
}

export const useMapbox = (options: UseMapboxOptions = {}) => {
	const { viewport = DEFAULT_VIEWPORT, style = 'mapbox://styles/mapbox/outdoors-v12' } = options;

	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return;

		mapboxgl.accessToken = mapboxToken;

		const viewportConfig = MAP_VIEWPORTS[viewport];

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style,
			center: viewportConfig.center,
			zoom: viewportConfig.zoom,
		});

		mapRef.current = map;

		return () => {
			map.remove();
			mapRef.current = null;
		};
	}, [mapboxToken, viewport, style]);

	return {
		mapContainerRef,
		mapRef,
		map: mapRef.current,
	};
};
