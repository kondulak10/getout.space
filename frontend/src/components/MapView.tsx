import { MapContent } from "@/components/MapContent";
import type { User } from "@/contexts/auth.types";
import { useMap } from "@/contexts/useMap";
import { useMapbox } from "@/hooks/useMapbox";
import * as h3 from "h3-js";
import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";

interface MapViewProps {
	user: User;
}

export function MapView({ user }: MapViewProps) {
	const [searchParams, setSearchParams] = useSearchParams();
	const { flyToHex } = useMap();
	const initialHexFromUrl = useRef(searchParams.get("hex"));

	// Calculate initial map position ONCE (from URL hex or user's lastHex)
	const { initialCenter, initialZoom } = useMemo(() => {
		const hexFromUrl = searchParams.get("hex");
		const hexToUse = hexFromUrl || user.lastHex;

		if (hexToUse) {
			try {
				const [lat, lng] = h3.cellToLatLng(hexToUse);
				return {
					initialCenter: [lng, lat] as [number, number],
					initialZoom: 13,
				};
			} catch (error) {
				console.error("❌ Invalid hex ID:", hexToUse, error);
			}
		}

		return {
			initialCenter: undefined, // Will use default Prague
			initialZoom: undefined,
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Empty deps - only calculate ONCE on mount

	// Create the map at the initial position and wait for it to load
	const { mapContainerRef, isLoaded } = useMapbox({
		initialCenter,
		initialZoom,
	});

	useEffect(() => {
		const hexFromUrl = searchParams.get("hex");

		if (!hexFromUrl || !isLoaded) return;

		if (hexFromUrl !== initialHexFromUrl.current) {
			flyToHex(hexFromUrl, 13);
		}

		setTimeout(() => {
			setSearchParams({});
		}, 100);
	}, [isLoaded, searchParams, setSearchParams, flyToHex]);

	return (
		<>
			<div ref={mapContainerRef} className="w-full h-[calc(100dvh-90px)] md:h-full" />

			{/* Only render map content after map is fully loaded */}
			{isLoaded && <MapContent />}
		</>
	);
}
