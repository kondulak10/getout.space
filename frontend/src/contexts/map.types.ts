import { createContext } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';

export interface MapContextType {
  mapRef: React.RefObject<MapboxMap | null>;
  flyToHex: (hexId: string, zoom?: number) => void;
  flyToLocation: (lng: number, lat: number, zoom?: number, duration?: number) => void;
}

export const MapContext = createContext<MapContextType | undefined>(undefined);
