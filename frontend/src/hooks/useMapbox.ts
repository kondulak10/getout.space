import { useMap } from "@/contexts/useMap";
import { configureMapStyle } from "@/utils/mapStyleConfig";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";

interface UseMapboxOptions {
	style?: string;
	enableCustomStyling?: boolean;
	initialCenter?: [number, number];
	initialZoom?: number;
}

const DEFAULT_CENTER: [number, number] = [14.4378, 50.0755];
const DEFAULT_ZOOM = 8;

export const useMapbox = (options: UseMapboxOptions = {}) => {
	const {
		style = "mapbox://styles/mapbox/dark-v11",
		enableCustomStyling = true,
		initialCenter = DEFAULT_CENTER,
		initialZoom = DEFAULT_ZOOM,
	} = options;

	const { mapRef } = useMap();
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return;

		mapboxgl.accessToken = mapboxToken;

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
			projection: "equalEarth",
			preserveDrawingBuffer: true,
		});

		if (enableCustomStyling) {
			configureMapStyle(map);
		}

		map.on("load", () => {
			setIsLoaded(true);
		});

		mapRef.current = map;

		return () => {
			setIsLoaded(false);
			map.remove();
			mapRef.current = null;
		};
		// initialCenter and initialZoom are intentionally excluded - they're only used
		// for initial map creation and shouldn't cause map recreation when changed
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mapboxToken, style, enableCustomStyling, mapRef]);

	return {
		mapContainerRef,
		map: mapRef.current,
		isLoaded,
	};
};
