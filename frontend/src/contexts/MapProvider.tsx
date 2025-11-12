import * as h3 from "h3-js";
import type { Map as MapboxMap } from "mapbox-gl";
import { ReactNode, useCallback, useRef } from "react";
import { MapContext, MapContextType } from "./map.types";

export function MapProvider({ children }: { children: ReactNode }) {
	const mapRef = useRef<MapboxMap | null>(null);
	const refetchHexagonsRef = useRef<(() => void) | undefined>(undefined);
	const currentParentHexagonIds = useRef<string[]>([]);

	const flyToHex = useCallback((hexId: string, zoom: number = 13) => {
		if (!mapRef.current) {
			return;
		}

		try {
			const [lat, lng] = h3.cellToLatLng(hexId);
			mapRef.current.flyTo({
				center: [lng, lat],
				zoom,
				duration: 1500,
			});
		} catch {
			// Invalid hex ID, silently fail
		}
	}, []);

	const flyToLocation = useCallback(
		(lng: number, lat: number, zoom: number = 13, duration: number = 1500) => {
			if (!mapRef.current) {
				return;
			}

			mapRef.current.flyTo({
				center: [lng, lat],
				zoom,
				duration,
			});
		},
		[]
	);

	const refetchHexagons = useCallback(() => {
		refetchHexagonsRef.current?.();
	}, []);

	const value: MapContextType = {
		mapRef,
		flyToHex,
		flyToLocation,
		refetchHexagons,
		refetchHexagonsRef,
		currentParentHexagonIds,
	};

	return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}
