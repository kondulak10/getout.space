import { MapContent } from "@/components/MapContent";
import type { User } from "@/contexts/auth.types";
import { useMap } from "@/contexts/useMap";
import { useMapbox } from "@/hooks/useMapbox";
import * as h3 from "h3-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface MapViewProps {
	user: User;
}

export function MapView({ user }: MapViewProps) {
	const [searchParams, setSearchParams] = useSearchParams();
	const { flyToHex, mapRef, isReducedOpacity } = useMap();
	const initialHexFromUrl = useRef(searchParams.get("hex"));
	const [sourcesReady, setSourcesReady] = useState(false);

	const opacityUser = 0.7; // Always full opacity for current user
	const opacityOthers = isReducedOpacity ? 0.2 : 0.5;

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
			} catch {
				// Invalid hex ID, fall through to default
			}
		}

		return {
			initialCenter: undefined,
			initialZoom: undefined,
		};
	}, [searchParams, user.lastHex]);

	const { mapContainerRef, isLoaded } = useMapbox({
		initialCenter,
		initialZoom,
	});

	useEffect(() => {
		if (!isLoaded || !mapRef.current) return;

		const map = mapRef.current;
		let pollInterval: number | null = null;

		const createSources = () => {
			const hexSource = map.getSource("hexagons");
			const parentSource = map.getSource("parent-hexagons");

			if (hexSource && parentSource) {
				setSourcesReady(true);
				return;
			}

			if (!hexSource) {
				try {
					map.addSource("hexagons", {
						type: "geojson",
						data: {
							type: "FeatureCollection",
							features: [],
						},
					});

					map.addLayer({
						id: "hexagon-fills",
						type: "fill",
						source: "hexagons",
						paint: {
							"fill-color": ["get", "color"],
							"fill-opacity": [
								"case",
								["get", "isCurrentUser"],
								opacityUser,
								opacityOthers,
							],
						},
					});

					map.addLayer({
						id: "hexagon-outlines",
						type: "line",
						source: "hexagons",
						paint: {
							"line-color": "#000000",
							"line-width": 1.5,
							"line-opacity": 0.7,
						},
					});
				} catch {
					// Layer may already exist, ignore error
				}
			}

			if (!parentSource) {
				try {
					map.addSource("parent-hexagons", {
						type: "geojson",
						data: {
							type: "FeatureCollection",
							features: [],
						},
					});

					map.addLayer({
						id: "parent-hexagon-borders",
						type: "line",
						source: "parent-hexagons",
						paint: {
							"line-color": "#FFFFFF",
							"line-width": 2,
							"line-opacity": 0.3,
						},
					});
				} catch {
					// Layer may already exist, ignore error
				}
			}

			setSourcesReady(true);
		};

		const setupSources = () => {
			if (!map.isStyleLoaded()) {
				pollInterval = setInterval(() => {
					if (map.isStyleLoaded()) {
						if (pollInterval) clearInterval(pollInterval);
						createSources();
					}
				}, 100);

				map.once("styledata", () => {
					if (pollInterval) clearInterval(pollInterval);
					createSources();
				});

				return;
			}

			createSources();
		};

		setupSources();

		return () => {
			if (pollInterval) {
				clearInterval(pollInterval);
			}
		};
	}, [isLoaded, mapRef]);

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

	// Update layer opacity when isReducedOpacity changes
	useEffect(() => {
		if (!mapRef.current || !sourcesReady) return;

		const map = mapRef.current;

		try {
			map.setPaintProperty("hexagon-fills", "fill-opacity", [
				"case",
				["get", "isCurrentUser"],
				opacityUser,
				opacityOthers,
			]);
		} catch (error) {
			// Layer might not exist yet, ignore
			console.debug("Failed to update opacity:", error);
		}
	}, [isReducedOpacity, mapRef, sourcesReady, opacityUser, opacityOthers]);

	return (
		<>
			<div ref={mapContainerRef} data-testid="map-container" className="w-full h-[calc(100dvh-90px)] md:h-full" />
			{isLoaded && sourcesReady && <MapContent user={user} />}
		</>
	);
}
