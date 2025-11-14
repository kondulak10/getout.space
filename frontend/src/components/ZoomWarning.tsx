import { useMap } from "@/contexts/useMap";
import { useEffect, useState } from "react";

export function ZoomWarning() {
	const { mapRef } = useMap();
	const [showWarning, setShowWarning] = useState(false);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		const updateZoomWarning = () => {
			const zoom = map.getZoom();
			setShowWarning(zoom < 9.5);
		};

		// Check initial zoom
		updateZoomWarning();

		// Update on zoom change
		map.on("zoom", updateZoomWarning);
		map.on("zoomend", updateZoomWarning);

		return () => {
			if (map.getStyle()) {
				map.off("zoom", updateZoomWarning);
				map.off("zoomend", updateZoomWarning);
			}
		};
	}, [mapRef]);

	if (!showWarning) return null;

	return (
		<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 rounded-md text-sm font-medium text-center pointer-events-none z-10 whitespace-nowrap">
			Zoom in to see activities
		</div>
	);
}
