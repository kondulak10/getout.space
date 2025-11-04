import { useState } from 'react';

export type MapView = 'only-you' | 'battle';

export function useMapView(initialView: MapView = 'battle') {
	const [mapView, setMapView] = useState<MapView>(initialView);

	return {
		mapView,
		setMapView,
		isOnlyYouView: mapView === 'only-you',
		isBattleView: mapView === 'battle',
	};
}
