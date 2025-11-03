import { useMapbox } from '@/hooks/useMapbox';
import { useHexagons } from '@/hooks/useHexagons';
import { useMapView } from '@/hooks/useMapView';
import { useHexagonSelection } from '@/hooks/useHexagonSelection';
import { useActivityProfileImages } from '@/hooks/useActivityProfileImages';
import { UserOverlay } from '@/components/UserOverlay';
import { MapViewToggle } from '@/components/MapViewToggle';
import { HexagonLoadingIndicator } from '@/components/HexagonLoadingIndicator';
import { HexagonDetailModal } from '@/components/HexagonDetailModal';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * HomePage - Authenticated users only
 * Shows the interactive map with hexagons
 */
export function HomePage() {
	const { mapView, setMapView } = useMapView();
	const { selectedHexagon, hexagonDetailLoading, handleHexagonClick, clearSelection } = useHexagonSelection();

	const { mapContainerRef, mapRef } = useMapbox({
		viewport: 'ostrava',
		style: 'mapbox://styles/mapbox/light-v11',
	});

	// Unified hexagon hook - mode changes based on view
	const { loading, refetchHexagons, hexagonsData } = useHexagons({
		mapRef,
		mode: mapView,
		onHexagonClick: handleHexagonClick,
	});

	// Add profile images on hexagons
	useActivityProfileImages(mapRef, hexagonsData ?? null);

	// Callback for when activities change
	const handleActivityChanged = () => {
		console.log('🔄 Activity changed, refreshing hexagons...');
		refetchHexagons();
	};

	return (
		<div className="relative w-full h-screen">
			{/* Map container */}
			<div ref={mapContainerRef} className="w-full h-full" />

			{/* UI Overlays */}
			<MapViewToggle view={mapView} onViewChange={setMapView} />
			<UserOverlay onActivityChanged={handleActivityChanged} />
			<HexagonLoadingIndicator isLoading={loading} />

			{/* Hexagon Detail Modal */}
			{(selectedHexagon || hexagonDetailLoading) && (
				<HexagonDetailModal
					activity={selectedHexagon?.activity}
					hexagonId={selectedHexagon?.hexagonId}
					captureCount={selectedHexagon?.captureCount}
					loading={hexagonDetailLoading}
					onClose={clearSelection}
				/>
			)}
		</div>
	);
}
