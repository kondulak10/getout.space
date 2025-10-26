import { INITIAL_CENTER, INITIAL_ZOOM, SAMPLE_IMAGE_URL } from "@/constants/map";
import type { HexagonData } from "@/utils/hexagonUtils";
import { createHexagonFeatures, getViewportHexagons } from "@/utils/hexagonUtils";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseMapInstanceProps {
	mapboxToken: string;
	hexDataMap: Map<string, HexagonData>;
	onHexClick: (hex: string, data: HexagonData | undefined) => void;
}

export const useMapInstance = ({ mapboxToken, hexDataMap, onHexClick }: UseMapInstanceProps) => {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const isMapLoadedRef = useRef(false);
	const [hexCount, setHexCount] = useState(0);
	const [renderTime, setRenderTime] = useState(0);
	const [zoomLevel, setZoomLevel] = useState(0);

	// Update hexagons on map
	const updateHexagons = useCallback(
		(map: mapboxgl.Map) => {
			if (!isMapLoadedRef.current) return;

			const startTime = performance.now();

			// Get hexagons in viewport
			const hexagons = getViewportHexagons(map);

			// Create GeoJSON features
			const features = createHexagonFeatures(hexagons, hexDataMap);

			const geojson: GeoJSON.FeatureCollection = {
				type: "FeatureCollection",
				features,
			};

			// Update source
			const source = map.getSource("hexagons") as mapboxgl.GeoJSONSource;
			if (source) {
				source.setData(geojson);
			}

			const duration = performance.now() - startTime;

			// Update stats
			setHexCount(hexagons.length);
			setRenderTime(Math.round(duration * 100) / 100);
			setZoomLevel(Math.round(map.getZoom() * 100) / 100);
		},
		[hexDataMap]
	);

	// Setup map layers
	const setupMapLayers = useCallback((map: mapboxgl.Map) => {
		// Load and add circular image
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			if (!map.hasImage("sample-image")) {
				const size = 256; // Larger base size for better quality
				const canvas = document.createElement("canvas");
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext("2d");

				if (ctx) {
					// Draw circular clip
					ctx.beginPath();
					ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
					ctx.closePath();
					ctx.clip();

					// Draw image in circle
					ctx.drawImage(img, 0, 0, size, size);

					map.addImage("sample-image", ctx.getImageData(0, 0, size, size));
				}
			}
		};
		img.src = SAMPLE_IMAGE_URL;

		// Add hexagon source
		map.addSource("hexagons", {
			type: "geojson",
			data: {
				type: "FeatureCollection",
				features: [],
			},
		});

		// Add hexagon fill layer
		map.addLayer({
			id: "hexagon-fills",
			type: "fill",
			source: "hexagons",
			paint: {
				"fill-color": ["get", "color"],
				"fill-opacity": 0.6,
			},
		});

		// Add symbol layer for image hexagons - better scaling
		map.addLayer({
			id: "hexagon-images",
			type: "symbol",
			source: "hexagons",
			filter: ["==", ["get", "hasImage"], true],
			layout: {
				"icon-image": "sample-image",
				"icon-size": ["interpolate", ["linear"], ["zoom"], 1, 0.2, 13, 0.05, 18, 0.5],
				"icon-allow-overlap": true,
				"icon-ignore-placement": false,
			},
			paint: {
				"icon-opacity": 0.9,
			},
		});

		// Add hexagon outline layer
		map.addLayer({
			id: "hexagon-outlines",
			type: "line",
			source: "hexagons",
			paint: {
				"line-color": "#333333",
				"line-width": 1,
				"line-opacity": 0.3,
			},
		});
	}, []);

	// Setup event handlers
	const setupEventHandlers = useCallback(
		(map: mapboxgl.Map) => {
			// Update on move/zoom
			map.on("moveend", () => updateHexagons(map));
			map.on("zoomend", () => updateHexagons(map));

			// Click handler
			map.on("click", "hexagon-fills", (e) => {
				if (e.features && e.features[0]) {
					const hex = e.features[0].properties?.h3Index;
					const data = hexDataMap.get(hex);
					onHexClick(hex, data);

					// Show popup
					new mapboxgl.Popup()
						.setLngLat(e.lngLat)
						.setHTML(
							`<div style="padding: 8px;">
								<strong>H3 Index:</strong><br/>
								<code style="font-size: 10px;">${hex}</code><br/>
								${
									data?.image
										? `
									<strong>Type:</strong> Circular Icon<br/>
									<img src="${data.image}"
									     style="width: 100%; max-width: 200px; margin-top: 8px; border-radius: 50%;" />
								`
										: `
									<strong>Type:</strong> Color Fill<br/>
									<strong>Color:</strong> <span style="background: ${data?.color}; padding: 2px 8px; border-radius: 3px; color: white;">${data?.color}</span>
								`
								}
							</div>`
						)
						.addTo(map);
				}
			});

			// Cursor change on hover
			map.on("mouseenter", "hexagon-fills", () => {
				map.getCanvas().style.cursor = "pointer";
			});
			map.on("mouseleave", "hexagon-fills", () => {
				map.getCanvas().style.cursor = "";
			});
		},
		[hexDataMap, onHexClick, updateHexagons]
	);

	// Initialize map
	useEffect(() => {
		if (!mapContainerRef.current) return;

		mapboxgl.accessToken = mapboxToken;

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: "mapbox://styles/mapbox/light-v11",
			center: INITIAL_CENTER,
			zoom: INITIAL_ZOOM,
		});

		mapRef.current = map;

		map.on("load", () => {
			isMapLoadedRef.current = true;

			setupMapLayers(map);
			setupEventHandlers(map);

			// Initial render
			updateHexagons(map);
		});

		return () => {
			map.remove();
		};
	}, [mapboxToken, setupMapLayers, setupEventHandlers, updateHexagons]);

	return {
		mapContainerRef,
		mapRef,
		hexCount,
		renderTime,
		zoomLevel,
	};
};
