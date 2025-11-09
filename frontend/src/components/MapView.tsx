import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import * as h3 from "h3-js";
import { HexOverlay } from "@/components/HexOverlay";
import { HexagonDetailModal } from "@/components/HexagonDetailModal";
import { HexagonLoadingIndicator } from "@/components/HexagonLoadingIndicator";
import { useActivityProfileImages } from "@/hooks/useActivityProfileImages";
import { useHexagonSelection } from "@/hooks/useHexagonSelection";
import { useHexagons } from "@/hooks/useHexagons";
import { useMapView } from "@/hooks/useMapView";
import { useMapbox } from "@/hooks/useMapbox";
import type { User } from "@/contexts/auth.types";

interface MapViewProps {
	user: User | null;
}

export function MapView({ user }: MapViewProps) {
	const [searchParams, setSearchParams] = useSearchParams();
	const { mapView, setMapView } = useMapView();
	const { selectedHexagon, hexagonDetailLoading, handleHexagonClick, clearSelection } =
		useHexagonSelection();

	const hexFromUrl = searchParams.get("hex");

	console.log("🎯 MapView rendered with user:", {
		hasUser: !!user,
		userId: user?.id,
		stravaId: user?.stravaId,
		name: user?.profile.firstname,
		lastHex: user?.lastHex,
	});

	// Calculate map center from user's lastHex or URL param
	const mapCenter = (() => {
		const hexToUse = hexFromUrl || user?.lastHex;

		console.log("🗺️ MapView center calculation:", {
			hexFromUrl,
			userLastHex: user?.lastHex,
			hexToUse,
			userName: user?.profile.firstname,
		});

		if (hexToUse) {
			try {
				const [lat, lng] = h3.cellToLatLng(hexToUse);
				const coords = [lng, lat] as [number, number];
				console.log("✅ Map center coordinates:", { hex: hexToUse, lat, lng, coords });
				return coords;
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (_error) {
				console.error("❌ Invalid hex ID:", hexToUse);
			}
		}
		console.log("⚠️ No hex found, will use default fallback");
		return undefined;
	})();

	// Default fallback: Prague, Czech Republic (when user has no lastHex)
	const DEFAULT_CENTER: [number, number] = [14.4378, 50.0755];
	const DEFAULT_ZOOM = 8;

	const finalCenter = mapCenter || DEFAULT_CENTER;
	const finalZoom = mapCenter ? 13 : DEFAULT_ZOOM;

	console.log("📍 Final map settings:", { finalCenter, finalZoom, hasUserHex: !!mapCenter });

	const { mapContainerRef, mapRef } = useMapbox({
		center: finalCenter,
		zoom: finalZoom,
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
			} catch (_error) {
				console.error("Failed to navigate to hex:", _error);
			}
		}
	}, [hexFromUrl, mapRef, setSearchParams]);

	const handleActivityChanged = () => {
		refetchHexagons();
	};

	return (
		<>
			<div ref={mapContainerRef} className="w-full h-[calc(100dvh-90px)] md:h-full" />

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
		</>
	);
}
