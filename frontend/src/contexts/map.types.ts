import type { Map as MapboxMap } from "mapbox-gl";
import { createContext } from "react";

export interface MapContextType {
	mapRef: React.RefObject<MapboxMap | null>;
	flyToHex: (hexId: string, zoom?: number) => void;
	flyToLocation: (lng: number, lat: number, zoom?: number, duration?: number) => void;
	refetchHexagons: () => void;
	refetchHexagonsRef: React.MutableRefObject<(() => void) | undefined>;
	currentParentHexagonIds: React.MutableRefObject<string[]>;
}

export const MapContext = createContext<MapContextType | undefined>(undefined);
