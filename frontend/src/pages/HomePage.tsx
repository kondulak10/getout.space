import { HexOverlay } from "@/components/HexOverlay";
import { HexagonDetailModal } from "@/components/HexagonDetailModal";
import { HexagonLoadingIndicator } from "@/components/HexagonLoadingIndicator";
import { VersionBadge } from "@/components/VersionBadge";
import { useAuth } from "@/contexts/useAuth";
import { useActivityProfileImages } from "@/hooks/useActivityProfileImages";
import { useHexagonSelection } from "@/hooks/useHexagonSelection";
import { useHexagons } from "@/hooks/useHexagons";
import { useMapView } from "@/hooks/useMapView";
import { useMapbox } from "@/hooks/useMapbox";
import * as h3 from "h3-js";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export function HomePage() {
	const { user } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const { mapView, setMapView } = useMapView();
	const { selectedHexagon, hexagonDetailLoading, handleHexagonClick, clearSelection } =
		useHexagonSelection();

	const hexFromUrl = searchParams.get("hex");

	const mapCenter = useMemo(() => {
		// Prioritize hex from URL parameter
		const hexToUse = hexFromUrl || user?.lastHex;

		if (hexToUse) {
			try {
				const [lat, lng] = h3.cellToLatLng(hexToUse);
				const coords = [lng, lat] as [number, number];
				return coords;
			} catch (error) {
				console.error("Invalid hex ID:", hexToUse);
			}
		}
		return undefined;
	}, [hexFromUrl, user?.lastHex]);

	const { mapContainerRef, mapRef } = useMapbox({
		viewport: "ostrava",
		center: mapCenter,
		zoom: mapCenter ? 13 : undefined,
	});

	const { loading, refetchHexagons, hexagonsData } = useHexagons({
		mapRef,
		mode: mapView,
		onHexagonClick: handleHexagonClick,
	});

	useActivityProfileImages(mapRef, hexagonsData ?? null);

	// Handle hex navigation from URL parameter
	useEffect(() => {
		if (hexFromUrl && mapRef.current) {
			try {
				const [lat, lng] = h3.cellToLatLng(hexFromUrl);
				mapRef.current.flyTo({
					center: [lng, lat],
					zoom: 13,
					duration: 1500,
				});

				// Clear the hex parameter from URL after navigating
				setTimeout(() => {
					setSearchParams({});
				}, 1500);
			} catch (error) {
				console.error("Failed to navigate to hex:", error);
			}
		}
	}, [hexFromUrl, mapRef, setSearchParams]);

	const handleActivityChanged = () => {
		refetchHexagons();
	};

	return (
		<div className="relative w-full h-dvh md:h-screen bg-black">
			<div ref={mapContainerRef} className="w-full h-[calc(100dvh-90px)] md:h-full" />

			<VersionBadge />
			<HexOverlay
				view={mapView}
				onViewChange={setMapView}
				onActivityChanged={handleActivityChanged}
			/>
			<HexagonLoadingIndicator isLoading={loading} />

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
