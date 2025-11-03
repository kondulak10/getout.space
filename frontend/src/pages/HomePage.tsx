import { useEffect } from 'react';
import { useMapbox } from '@/hooks/useMapbox';
import { useUserHexagons } from '@/hooks/useUserHexagons';
import { useMapView } from '@/hooks/useMapView';
import { useHexagonLayerSetup } from '@/hooks/useHexagonLayerSetup';
import { useHexagonSelection } from '@/hooks/useHexagonSelection';
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
	const { mapView, setMapView, isOnlyYouView } = useMapView();
	const { selectedHexagon, hexagonDetailLoading, handleHexagonClick, clearSelection } = useHexagonSelection();

	const { mapContainerRef, mapRef } = useMapbox({
		viewport: 'ostrava',
		style: 'mapbox://styles/mapbox/light-v11',
	});

	const { totalHexCount, loading: hexagonsLoading, setupHexagonLayer, updateHexagons, refetchHexagons, cleanupHexagonLayer, clearBoundsCache } = useUserHexagons({
		mapRef,
		enabled: isOnlyYouView,
		onHexagonClick: handleHexagonClick,
	});

	useHexagonLayerSetup({
		mapRef,
		enabled: isOnlyYouView,
		setupHexagonLayer,
		updateHexagons,
		cleanupHexagonLayer,
		clearBoundsCache,
	});

	// Refetch hexagons when view changes
	useEffect(() => {
		if (mapRef.current) {
			refetchHexagons();
		}
	}, [mapView, refetchHexagons, mapRef]);

	return (
		<div className="relative w-full h-screen">
			{/* Map container */}
			<div ref={mapContainerRef} className="w-full h-full" />

			{/* UI Overlays */}
			<MapViewToggle view={mapView} onViewChange={setMapView} totalHexCount={totalHexCount} />
			<UserOverlay />
			<HexagonLoadingIndicator isLoading={hexagonsLoading} />

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
