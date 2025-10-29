import { MapInfoOverlay } from "@/components/MapInfoOverlay";
import { useHexagonData } from "@/hooks/useHexagonData";
import { useMapInstance } from "@/hooks/useMapInstance";
import type { HexagonData } from "@/utils/hexagonUtils";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback } from "react";

export function MapPage() {
	const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

	// Hexagon data management
	const { hexDataMap } = useHexagonData();

	// Handle hexagon click
	const handleHexClick = useCallback((hex: string, data: HexagonData | undefined) => {
		console.log("🔷 Clicked hexagon:", hex);
		console.log("Data:", data);
	}, []);

	// Map instance
	const { mapContainerRef, hexCount, renderTime, zoomLevel } = useMapInstance({
		mapboxToken,
		hexDataMap,
		onHexClick: handleHexClick,
	});

	return (
		<div className="relative w-full h-screen">
			<div ref={mapContainerRef} className="w-full h-full" />

			<MapInfoOverlay hexCount={hexCount} renderTime={renderTime} zoomLevel={zoomLevel} />

			{/* Navigation link */}
			<div className="absolute bottom-4 right-4">
				<a
					href="/"
					className="bg-white rounded-lg shadow-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
				>
					← Back to Home
				</a>
			</div>
		</div>
	);
}
