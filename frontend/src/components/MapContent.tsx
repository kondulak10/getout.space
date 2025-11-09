import { HexOverlay } from "@/components/HexOverlay";
import { HexagonDetailModal } from "@/components/HexagonDetailModal";
import { HexagonLoadingIndicator } from "@/components/HexagonLoadingIndicator";
import { useMap } from "@/contexts/useMap";
import { useActivityProfileImages } from "@/hooks/useActivityProfileImages";
import { useHexagonSelection } from "@/hooks/useHexagonSelection";
import { useHexagons } from "@/hooks/useHexagons";
import { useMapView } from "@/hooks/useMapView";
import { useEffect } from "react";

export function MapContent() {
	const { mapRef, refetchHexagonsRef } = useMap();

	const { mapView, setMapView } = useMapView();
	const { selectedHexagon, hexagonDetailLoading, handleHexagonClick, clearSelection } =
		useHexagonSelection();

	const { loading, refetchHexagons, hexagonsData } = useHexagons({
		mapRef,
		mode: mapView,
		onHexagonClick: handleHexagonClick,
	});

	useEffect(() => {
		refetchHexagonsRef.current = refetchHexagons;

		return () => {
			refetchHexagonsRef.current = undefined;
		};
	}, [refetchHexagons, refetchHexagonsRef]);

	useActivityProfileImages(mapRef, hexagonsData ?? null);

	const handleActivityChanged = () => {
		refetchHexagons();
	};

	return (
		<>
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
