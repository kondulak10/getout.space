import { DEFAULT_VIEWPORT, MAP_VIEWPORTS, type ViewportKey } from "@/config/mapViewports";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import { configureMapStyle } from "@/utils/mapStyleConfig";

interface UseMapboxOptions {
	viewport?: ViewportKey;
	style?: string;
	enableCustomStyling?: boolean;
}

export const useMapbox = (options: UseMapboxOptions = {}) => {
	const { viewport = DEFAULT_VIEWPORT, style = 'mapbox://styles/mapbox/dark-v11', enableCustomStyling = true } = options;

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
			pitch: 0, // Force flat map
			bearing: 0,
			dragRotate: false, // Disable rotation
			pitchWithRotate: false, // Disable pitch
			touchPitch: false, // Disable touch pitch
			projection: 'mercator', // Use flat Mercator projection instead of globe
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
	}, [mapboxToken, viewport, style, enableCustomStyling]);

	return {
		mapContainerRef,
		mapRef,
		map: mapRef.current,
	};
};
