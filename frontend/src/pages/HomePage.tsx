import { useState, useEffect } from 'react';
import { useMapbox } from '@/hooks/useMapbox';
import { useUserHexagons } from '@/hooks/useUserHexagons';
import { UserOverlay } from '@/components/UserOverlay';
import { LandingOverlay } from '@/components/LandingOverlay';
import { AuthLoadingOverlay } from '@/components/AuthLoadingOverlay';
import { MapViewToggle } from '@/components/MapViewToggle';
import { useAuth } from '@/contexts/useAuth';
import { useStravaAuth } from '@/hooks/useStravaAuth';
import 'mapbox-gl/dist/mapbox-gl.css';

export function HomePage() {
	const { isAuthenticated, isLoading } = useAuth();
	const { isAuthenticating } = useStravaAuth();
	const [mapView, setMapView] = useState<'only-you' | 'battle'>('only-you');

	const { mapContainerRef, mapRef } = useMapbox({
		viewport: 'ostrava',
		style: 'mapbox://styles/mapbox/light-v11',
	});

	const { totalHexCount, setupHexagonLayer, updateHexagons, cleanupHexagonLayer } = useUserHexagons({
		mapRef,
		enabled: isAuthenticated && mapView === 'only-you',
	});

	// Setup hexagons when authenticated and in "only-you" mode
	useEffect(() => {
		if (!isAuthenticated || !mapRef.current || mapView !== 'only-you') return;

		const map = mapRef.current;

		const initializeHexagons = () => {
			setupHexagonLayer();
			updateHexagons();

			map.on('moveend', updateHexagons);
			map.on('zoomend', updateHexagons);
		};

		if (map.loaded()) {
			initializeHexagons();
		} else {
			map.once('load', initializeHexagons);
		}

		return () => {
			map.off('moveend', updateHexagons);
			map.off('zoomend', updateHexagons);
			cleanupHexagonLayer();
		};
	}, [isAuthenticated, mapView, mapRef, setupHexagonLayer, updateHexagons, cleanupHexagonLayer]);

	const showLoading = isLoading || isAuthenticating;

	return (
		<div className="relative w-full h-screen">
			{/* Always render map so ref works */}
			<div ref={mapContainerRef} className="w-full h-full" />

			{/* Show appropriate overlay */}
			{showLoading ? (
				<AuthLoadingOverlay />
			) : !isAuthenticated ? (
				<LandingOverlay />
			) : (
				<>
					<MapViewToggle view={mapView} onViewChange={setMapView} totalHexCount={totalHexCount} />
					<UserOverlay />
				</>
			)}
		</div>
	);
}
