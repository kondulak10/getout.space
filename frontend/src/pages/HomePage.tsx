import { HexOverlay } from "@/components/HexOverlay";
import { HexagonDetailModal } from "@/components/HexagonDetailModal";
import { HexagonLoadingIndicator } from "@/components/HexagonLoadingIndicator";
import { VersionBadge } from "@/components/VersionBadge";
import { useActivityProfileImages } from "@/hooks/useActivityProfileImages";
import { useHexagonSelection } from "@/hooks/useHexagonSelection";
import { useHexagons } from "@/hooks/useHexagons";
import { useMapView } from "@/hooks/useMapView";
import { useMapbox } from "@/hooks/useMapbox";
import { useAuth } from "@/contexts/useAuth";
import { useMemo } from "react";
import * as h3 from "h3-js";
import "mapbox-gl/dist/mapbox-gl.css";

/**
 * HomePage - Authenticated users only
 * Shows the interactive map with hexagons
 */
export function HomePage() {
	const { user } = useAuth();
	const { mapView, setMapView } = useMapView();
	const { selectedHexagon, hexagonDetailLoading, handleHexagonClick, clearSelection } =
		useHexagonSelection();

	// Calculate map center from user's lastHex (if available)
	const mapCenter = useMemo(() => {
		console.log('👤 User lastHex:', user?.lastHex);
		if (user?.lastHex) {
			try {
				const [lat, lng] = h3.cellToLatLng(user.lastHex);
				const coords = [lng, lat] as [number, number];
				console.log('📍 Map will center on:', coords, `(from hex ${user.lastHex})`);
				return coords; // Mapbox uses [lng, lat]
			} catch (error) {
				console.warn('Failed to convert lastHex to coordinates:', error);
			}
		}
		console.log('📍 No lastHex, will use default viewport (Ostrava)');
		return undefined; // Fall back to default viewport (Ostrava)
	}, [user?.lastHex]);

	const { mapContainerRef, mapRef } = useMapbox({
		viewport: "ostrava",
		center: mapCenter, // Use user's lastHex location if available
		zoom: mapCenter ? 13 : undefined, // Slightly closer zoom when centering on user's hex
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
			<HexOverlay
				view={mapView}
				onViewChange={setMapView}
				onActivityChanged={handleActivityChanged}
			/>
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
