import { ReactNode, useCallback, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import * as h3 from 'h3-js';
import { MapContext, MapContextType } from './map.types';

export function MapProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<MapboxMap | null>(null);

  const flyToHex = useCallback((hexId: string, zoom: number = 13) => {
    if (!mapRef.current) {
      console.warn('🗺️ Map not ready for navigation');
      return;
    }

    try {
      const [lat, lng] = h3.cellToLatLng(hexId);
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom,
        duration: 1500,
      });
      console.log('✈️ Flying to hex:', hexId, { lat, lng, zoom });
    } catch (error) {
      console.error('❌ Invalid hex ID:', hexId, error);
    }
  }, []);

  const flyToLocation = useCallback((
    lng: number,
    lat: number,
    zoom: number = 13,
    duration: number = 1500
  ) => {
    if (!mapRef.current) {
      console.warn('🗺️ Map not ready for navigation');
      return;
    }

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom,
      duration,
    });
    console.log('✈️ Flying to location:', { lng, lat, zoom });
  }, []);

  const value: MapContextType = {
    mapRef,
    flyToHex,
    flyToLocation,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}
