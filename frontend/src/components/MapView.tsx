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
	const { flyToHex, mapRef } = useMap();
	const initialHexFromUrl = useRef(searchParams.get("hex"));
	const [sourcesReady, setSourcesReady] = useState(false);

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
			initialCenter: undefined,
			initialZoom: undefined,
		};
	}, [searchParams, user.lastHex]);

	const { mapContainerRef, isLoaded } = useMapbox({
		initialCenter,
		initialZoom,
	});

	useEffect(() => {
		console.log("🔵 MapView: isLoaded =", isLoaded, "mapRef.current =", !!mapRef.current);

		if (!isLoaded || !mapRef.current) return;

		const map = mapRef.current;
		let pollInterval: number | null = null;

		const createSources = () => {
			console.log("🎬 MapView: createSources called at", new Date().toISOString());
			const hexSource = map.getSource("hexagons");
			const parentSource = map.getSource("parent-hexagons");
			console.log(
				"🔍 MapView: Checking sources - hexagons:",
				!!hexSource,
				"parent-hexagons:",
				!!parentSource
			);

			if (hexSource && parentSource) {
				console.log("✅ MapView: Sources already exist, setting ready=true");
				setSourcesReady(true);
				return;
			}

			if (!hexSource) {
				console.log("➕ MapView: Creating hexagons source and layers at", new Date().toISOString());
				try {
					map.addSource("hexagons", {
						type: "geojson",
						data: {
							type: "FeatureCollection",
							features: [],
						},
					});
					console.log("✓ Hexagons source added");

					map.addLayer({
						id: "hexagon-fills",
						type: "fill",
						source: "hexagons",
						paint: {
							"fill-color": ["get", "color"],
							"fill-opacity": 0.35,
						},
					});
					console.log("✓ Hexagon-fills layer added");

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
					console.log("✓ Hexagon-outlines layer added");
				} catch (error) {
					console.error("❌ MapView: Error creating hexagons source:", error);
				}
			}

			if (!parentSource) {
				console.log("➕ MapView: Creating parent-hexagons source and layer");
				try {
					map.addSource("parent-hexagons", {
						type: "geojson",
						data: {
							type: "FeatureCollection",
							features: [],
						},
					});
					console.log("✓ Parent-hexagons source added");

					map.addLayer({
						id: "parent-hexagon-borders",
						type: "line",
						source: "parent-hexagons",
						paint: {
							"line-color": "#FFFFFF",
							"line-width": 2,
							"line-opacity": 0.6,
						},
					});
					console.log("✓ Parent-hexagon-borders layer added");
				} catch (error) {
					console.error("❌ MapView: Error creating parent source:", error);
				}
			}

			console.log(
				"✅ MapView: All sources/layers created, setting ready=true at",
				new Date().toISOString()
			);
			setSourcesReady(true);
		};

		const setupSources = () => {
			console.log("🟡 MapView: setupSources called, isStyleLoaded =", map.isStyleLoaded());

			if (!map.isStyleLoaded()) {
				console.log("⏳ MapView: Style not loaded, setting up polling + event listener");

				pollInterval = setInterval(() => {
					console.log("🔄 MapView: Polling... isStyleLoaded =", map.isStyleLoaded());
					if (map.isStyleLoaded()) {
						console.log("✅ MapView: Style loaded via polling!");
						if (pollInterval) clearInterval(pollInterval);
						createSources();
					}
				}, 100);

				map.once("styledata", () => {
					console.log("✅ MapView: Style loaded via styledata event!");
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

	return (
		<>
			<div ref={mapContainerRef} className="w-full h-[calc(100dvh-90px)] md:h-full" />

			{console.log(
				"🎯 MapView render: isLoaded =",
				isLoaded,
				"sourcesReady =",
				sourcesReady,
				"will render MapContent =",
				isLoaded && sourcesReady
			)}
			{isLoaded && sourcesReady && <MapContent />}
		</>
	);
}
