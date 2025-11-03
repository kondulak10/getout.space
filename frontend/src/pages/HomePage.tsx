import { useMapbox } from '@/hooks/useMapbox';
import { useUserHexagons } from '@/hooks/useUserHexagons';
import { useMapView } from '@/hooks/useMapView';
import { useHexagonLayerSetup } from '@/hooks/useHexagonLayerSetup';
import { useAppLoadingState } from '@/hooks/useAppLoadingState';
import { UserOverlay } from '@/components/UserOverlay';
import { LandingOverlay } from '@/components/LandingOverlay';
import { AuthLoadingOverlay } from '@/components/AuthLoadingOverlay';
import { MapViewToggle } from '@/components/MapViewToggle';
import 'mapbox-gl/dist/mapbox-gl.css';

export function HomePage() {
	const { isAuthenticated, showLoading } = useAppLoadingState();
	const { mapView, setMapView, isOnlyYouView } = useMapView();

	const { mapContainerRef, mapRef } = useMapbox({
		viewport: 'ostrava',
		style: 'mapbox://styles/mapbox/light-v11',
	});

	const { totalHexCount, setupHexagonLayer, updateHexagons, cleanupHexagonLayer } = useUserHexagons({
		mapRef,
		enabled: isAuthenticated && isOnlyYouView,
	});

	useHexagonLayerSetup({
		mapRef,
		enabled: isAuthenticated && isOnlyYouView,
		setupHexagonLayer,
		updateHexagons,
		cleanupHexagonLayer,
	});

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
