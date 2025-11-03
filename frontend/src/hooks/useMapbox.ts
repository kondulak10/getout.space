import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface UseMapboxOptions {
	style?: string;
	center?: [number, number];
	zoom?: number;
}

export const useMapbox = (options: UseMapboxOptions = {}) => {
	const {
		style = 'mapbox://styles/mapbox/outdoors-v12',
		center = [-98.5795, 39.8283],
		zoom = 3,
	} = options;

	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return;

		mapboxgl.accessToken = mapboxToken;

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style,
			center,
			zoom,
		});

		mapRef.current = map;

		return () => {
			map.remove();
		};
	}, [mapboxToken, style, center, zoom]);

	return {
		mapContainerRef,
		mapRef,
	};
};
