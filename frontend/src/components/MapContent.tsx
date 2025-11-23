import { HexOverlay } from "@/components/HexOverlay";
import { HexagonDetailModal } from "@/components/HexagonDetailModal";
import { HexagonLoadingIndicator } from "@/components/HexagonLoadingIndicator";
import { ZoomWarning } from "@/components/ZoomWarning";
import { useMap } from "@/contexts/useMap";
import { useActivityProfileImages } from "@/hooks/useActivityProfileImages";
import { useHexagonSelection } from "@/hooks/useHexagonSelection";
import { useHexagons } from "@/hooks/useHexagons";
import type { User } from "@/contexts/auth.types";
import { useEffect } from "react";

interface MapContentProps {
	user: User;
}

export function MapContent({ user }: MapContentProps) {
	const { mapRef, refetchHexagonsRef } = useMap();

	const { selectedHexagon, hexagonDetailLoading, handleHexagonClick, clearSelection } =
		useHexagonSelection(user.id);

	const { loading, refetchHexagons, hexagonsData } = useHexagons({
		mapRef,
		onHexagonClick: handleHexagonClick,
		currentUserId: user.id,
	});

	useEffect(() => {
		refetchHexagonsRef.current = refetchHexagons;

		return () => {
			refetchHexagonsRef.current = undefined;
		};
	}, [refetchHexagons, refetchHexagonsRef]);

	useActivityProfileImages(mapRef, hexagonsData ?? null);

	const handleActivityChanged = () => {
		// Activity processing is rare (1-2x per session)
		// Simple page reload ensures fresh data from all 7 parent hex caches
		window.location.reload();
	};

	return (
		<>
			<HexOverlay
				hexagonsData={hexagonsData}
				onActivityChanged={handleActivityChanged}
			/>
			<HexagonLoadingIndicator isLoading={loading} />
			<ZoomWarning />

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
