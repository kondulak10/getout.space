import { useMapbox } from '@/hooks/useMapbox';
import { useHexagons } from '@/hooks/useHexagons';
import { useMapView } from '@/hooks/useMapView';
import { useHexagonSelection } from '@/hooks/useHexagonSelection';
import { useActivityProfileImages } from '@/hooks/useActivityProfileImages';
import { HexOverlay } from '@/components/HexOverlay';
import { HexagonLoadingIndicator } from '@/components/HexagonLoadingIndicator';
import { HexagonDetailModal } from '@/components/HexagonDetailModal';
import { VersionBadge } from '@/components/VersionBadge';
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
		// Uses dark-v11 with custom monochrome flat styling + 3D buildings
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
		refetchHexagons();
	};

	return (
		<div className="relative w-full h-[100dvh] md:h-screen bg-black">
			{/* Map container - adjusted for mobile bottom nav */}
			<div ref={mapContainerRef} className="w-full h-[calc(100dvh-90px)] md:h-full" />

			{/* UI Overlays */}
			<VersionBadge />
			<HexOverlay view={mapView} onViewChange={setMapView} onActivityChanged={handleActivityChanged} />
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
