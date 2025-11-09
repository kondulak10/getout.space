import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { configureMapStyle } from "@/utils/mapStyleConfig";
import { useMap } from "@/contexts/useMap";

interface UseMapboxOptions {
	style?: string;
	enableCustomStyling?: boolean;
	initialCenter?: [number, number];
	initialZoom?: number;
}

// Default map center: Prague, Czech Republic
const DEFAULT_CENTER: [number, number] = [14.4378, 50.0755];
const DEFAULT_ZOOM = 8;

export const useMapbox = (options: UseMapboxOptions = {}) => {
	const {
		style = 'mapbox://styles/mapbox/dark-v11',
		enableCustomStyling = true,
		initialCenter = DEFAULT_CENTER,
		initialZoom = DEFAULT_ZOOM
	} = options;

	const { mapRef } = useMap();
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return;

		mapboxgl.accessToken = mapboxToken;

		console.log("🚀 Creating Mapbox map at:", initialCenter, "zoom:", initialZoom);

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style,
			center: initialCenter,
			zoom: initialZoom,
			pitch: 0,
			bearing: 0,
			dragRotate: false,
			pitchWithRotate: false,
			touchPitch: false,
			projection: 'equalEarth',
		});

		if (enableCustomStyling) {
			configureMapStyle(map);
		}

		// Wait for map to fully load
		map.on('load', () => {
			console.log("✅ Map fully loaded and ready");
			setIsLoaded(true);
		});

		mapRef.current = map;

		return () => {
			setIsLoaded(false);
			map.remove();
			mapRef.current = null;
		};
		// Only recreate map if token or style changes (NOT center/zoom!)
		// initialCenter/initialZoom are only used once during creation
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mapboxToken, style, enableCustomStyling, mapRef]);

	return {
		mapContainerRef,
		map: mapRef.current,
		isLoaded,
	};
};
