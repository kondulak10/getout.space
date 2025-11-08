import { DEFAULT_VIEWPORT, MAP_VIEWPORTS, type ViewportKey } from "@/config/mapViewports";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import { configureMapStyle } from "@/utils/mapStyleConfig";

interface UseMapboxOptions {
	viewport?: ViewportKey;
	style?: string;
	enableCustomStyling?: boolean;
	center?: [number, number]; // Override center [lng, lat]
	zoom?: number; // Override zoom
}

export const useMapbox = (options: UseMapboxOptions = {}) => {
	const { viewport = DEFAULT_VIEWPORT, style = 'mapbox://styles/mapbox/dark-v11', enableCustomStyling = true, center, zoom } = options;

	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

	// Initialize map ONCE - user is already loaded before this component mounts
	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return;

		mapboxgl.accessToken = mapboxToken;

		const viewportConfig = MAP_VIEWPORTS[viewport];
		const initialCenter = center || viewportConfig.center;
		const initialZoom = zoom || viewportConfig.zoom;

		console.log('🗺️ Initializing map at:', initialCenter, 'zoom:', initialZoom);

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style,
			center: initialCenter,
			zoom: initialZoom,
			pitch: 0, // Force flat map
			bearing: 0,
			dragRotate: false, // Disable rotation
			pitchWithRotate: false, // Disable pitch
			touchPitch: false, // Disable touch pitch
			projection: 'equalEarth', // Equal-area projection for uniform hexagons
		});

		// Apply custom dark monochrome flat styling
		if (enableCustomStyling) {
			configureMapStyle(map);
		}

		mapRef.current = map;

		return () => {
			map.remove();
			mapRef.current = null;
		};
	}, [mapboxToken, viewport, style, enableCustomStyling]); // NOTE: center/zoom NOT in deps - map creates once!

	return {
		mapContainerRef,
		mapRef,
		map: mapRef.current,
	};
};
