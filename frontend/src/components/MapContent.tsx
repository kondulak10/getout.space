import { HexOverlay } from "@/components/HexOverlay";
import { HexagonDetailModal } from "@/components/HexagonDetailModal";
import { HexagonLoadingIndicator } from "@/components/HexagonLoadingIndicator";
import { useMap } from "@/contexts/useMap";
import { useActivityProfileImages } from "@/hooks/useActivityProfileImages";
import { useHexagonSelection } from "@/hooks/useHexagonSelection";
import { useHexagons } from "@/hooks/useHexagons";
import { useEffect } from "react";

export function MapContent() {
	const { mapRef, refetchHexagonsRef } = useMap();

	const { selectedHexagon, hexagonDetailLoading, handleHexagonClick, clearSelection } =
		useHexagonSelection();

	const { loading, refetchHexagons, hexagonsData } = useHexagons({
		mapRef,
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
				onActivityChanged={handleActivityChanged}
			/>
			<HexagonLoadingIndicator isLoading={loading} />

			{(selectedHexagon || hexagonDetailLoading) && (
				<HexagonDetailModal
					hexagonData={selectedHexagon ?? undefined}
					loading={hexagonDetailLoading}
					onClose={clearSelection}
				/>
			)}
		</>
	);
}
