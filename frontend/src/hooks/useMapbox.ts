import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import { configureMapStyle } from "@/utils/mapStyleConfig";

interface UseMapboxOptions {
	style?: string;
	enableCustomStyling?: boolean;
	center: [number, number];
	zoom: number;
}

export const useMapbox = (options: UseMapboxOptions) => {
	const { style = 'mapbox://styles/mapbox/dark-v11', enableCustomStyling = true, center, zoom } = options;

	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

	console.log("🗺️ useMapbox called with:", { center, zoom });

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return;

		mapboxgl.accessToken = mapboxToken;

		console.log("🚀 Creating Mapbox map with center:", center, "zoom:", zoom);

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style,
			center,
			zoom,
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

		mapRef.current = map;

		return () => {
			map.remove();
			mapRef.current = null;
		};
	}, [mapboxToken, center, zoom, style, enableCustomStyling]);

	return {
		mapContainerRef,
		mapRef,
		map: mapRef.current,
	};
};
