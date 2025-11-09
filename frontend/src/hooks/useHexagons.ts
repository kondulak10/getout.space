import { getUserColor } from "@/constants/hexagonColors";
import {
	HexagonsByParentsDocument,
	MyHexagonsByParentsDocument,
	MyHexagonsCountDocument,
} from "@/gql/graphql";
import { h3ToGeoJSON } from "@/utils/hexagonUtils";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import { gridDisk, latLngToCell } from "h3-js";
import type { Map as MapboxMap } from "mapbox-gl";
import React, { useCallback, useEffect, useState } from "react";

interface UseHexagonsOptions {
	mapRef: React.RefObject<MapboxMap | null>;
	mode: "only-you" | "battle";
	onHexagonClick?: (hexagonId: string) => void;
}

export const useHexagons = ({ mapRef, mode, onHexagonClick }: UseHexagonsOptions) => {
	const [visibleHexCount, setVisibleHexCount] = useState(0);
	const [userCount, setUserCount] = useState(0);
	const debounceTimeoutRef = React.useRef<number | null>(null);
	const onHexagonClickRef = React.useRef(onHexagonClick);
	const lastCenterHexRef = React.useRef<string | null>(null);
	const modeRef = React.useRef(mode);
	const isMountedRef = React.useRef(true);
	const clickHandlerRef = React.useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
	const mouseEnterHandlerRef = React.useRef<(() => void) | null>(null);
	const mouseLeaveHandlerRef = React.useRef<(() => void) | null>(null);
	const updateHexagonsRef = React.useRef<(() => void) | null>(null);

	useEffect(() => {
		onHexagonClickRef.current = onHexagonClick;
		modeRef.current = mode;
	}, [onHexagonClick, mode]);

	const { data: countData } = useQuery(MyHexagonsCountDocument, {
		skip: mode !== "only-you",
	});

	const [fetchMyHexagons, { data: myHexagonsData, loading: myLoading }] = useLazyQuery(
		MyHexagonsByParentsDocument
	);
	const [fetchAllHexagons, { data: allHexagonsData, loading: allLoading }] =
		useLazyQuery(HexagonsByParentsDocument);

	const hexagonsData =
		mode === "only-you" ? myHexagonsData?.myHexagonsByParents : allHexagonsData?.hexagonsByParents;
	const loading = mode === "only-you" ? myLoading : allLoading;

	const setupHexagonLayer = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		if (!map.isStyleLoaded()) {
			return;
		}

		if (map.getSource("hexagons")) {
			return;
		}

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
				"fill-opacity": 0.35,
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

		const handleHexagonClick = (e: mapboxgl.MapMouseEvent) => {
			if (!e.features || e.features.length === 0) return;
			const feature = e.features[0];
			const hexagonId = feature.properties?.hexagonId;
			if (hexagonId && onHexagonClickRef.current) {
				onHexagonClickRef.current(hexagonId);
			}
		};

		const handleMouseEnter = () => {
			map.getCanvas().style.cursor = "pointer";
		};

		const handleMouseLeave = () => {
			map.getCanvas().style.cursor = "";
		};

		clickHandlerRef.current = handleHexagonClick;
		mouseEnterHandlerRef.current = handleMouseEnter;
		mouseLeaveHandlerRef.current = handleMouseLeave;

		map.on("click", "hexagon-fills", handleHexagonClick);
		map.on("mouseenter", "hexagon-fills", handleMouseEnter);
		map.on("mouseleave", "hexagon-fills", handleMouseLeave);
	}, [mapRef]);

	const setupParentLayer = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		if (!map.isStyleLoaded()) {
			return;
		}

		if (map.getSource("parent-hexagons")) {
			return;
		}

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
				"line-opacity": 0.6,
			},
		});
	}, [mapRef]);

	const updateParentVisualization = useCallback(
		(parentHexagonIds: string[]) => {
			if (!mapRef.current) return;
			const map = mapRef.current;

			const source = map.getSource("parent-hexagons") as import("mapbox-gl").GeoJSONSource;
			if (!source) {
				setupParentLayer();
				setTimeout(() => updateParentVisualization(parentHexagonIds), 100);
				return;
			}

			const features = parentHexagonIds.map((parentId) => {
				return h3ToGeoJSON(parentId);
			});

			const geojson: GeoJSON.FeatureCollection = {
				type: "FeatureCollection",
				features,
			};

			source.setData(geojson);
		},
		[mapRef, setupParentLayer]
	);

	const cleanupHexagonLayer = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		if (!map.getStyle()) {
			return;
		}

		try {
			if (clickHandlerRef.current) {
				map.off("click", "hexagon-fills", clickHandlerRef.current);
				clickHandlerRef.current = null;
			}
			if (mouseEnterHandlerRef.current) {
				map.off("mouseenter", "hexagon-fills", mouseEnterHandlerRef.current);
				mouseEnterHandlerRef.current = null;
			}
			if (mouseLeaveHandlerRef.current) {
				map.off("mouseleave", "hexagon-fills", mouseLeaveHandlerRef.current);
				mouseLeaveHandlerRef.current = null;
			}

			if (map.getLayer("hexagon-fills")) {
				map.removeLayer("hexagon-fills");
			}
			if (map.getLayer("hexagon-outlines")) {
				map.removeLayer("hexagon-outlines");
			}
			if (map.getSource("hexagons")) {
				map.removeSource("hexagons");
			}

			if (map.getLayer("parent-hexagon-borders")) {
				map.removeLayer("parent-hexagon-borders");
			}
			if (map.getSource("parent-hexagons")) {
				map.removeSource("parent-hexagons");
			}
		} catch (error) {
			console.error(error);
		}

		lastCenterHexRef.current = null;
	}, [mapRef]);

	const clearCenterCache = useCallback(() => {
		lastCenterHexRef.current = null;
	}, []);

	const updateHexagonsImpl = useCallback(() => {
		if (!mapRef.current) return;

		const map = mapRef.current;

		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		debounceTimeoutRef.current = setTimeout(() => {
			const bounds = map.getBounds();

			if (!bounds) return;

			const currentMode = modeRef.current;

			try {
				const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
				const centerLng = (bounds.getEast() + bounds.getWest()) / 2;

				const centerParentHex = latLngToCell(centerLat, centerLng, 6);

				// Skip if same parent hex (unless cache was cleared)
				if (lastCenterHexRef.current === centerParentHex) {
					return;
				}

				lastCenterHexRef.current = centerParentHex;

				const parentHexagonIds = gridDisk(centerParentHex, 1);

				updateParentVisualization(parentHexagonIds);

				if (currentMode === "only-you") {
					fetchMyHexagons({ variables: { parentHexagonIds } });
				} else {
					fetchAllHexagons({ variables: { parentHexagonIds } });
				}
			} catch (error) {
				console.error("Error in updateHexagons:", error);
			}
		}, 300);
	}, [mapRef, fetchMyHexagons, fetchAllHexagons, updateParentVisualization]);

	// Initialize ref immediately - before any effects run
	updateHexagonsRef.current = updateHexagonsImpl;

	// Keep the ref up to date
	useEffect(() => {
		updateHexagonsRef.current = updateHexagonsImpl;
	}, [updateHexagonsImpl]);

	// Stable wrapper that always calls the latest version
	const updateHexagons = useCallback(() => {
		updateHexagonsRef.current?.();
	}, []);

	const refetchHexagons = useCallback(() => {
		// Clear cache and force update on next moveend
		clearCenterCache();
		// Trigger update immediately
		updateHexagonsImpl();
	}, [clearCenterCache, updateHexagonsImpl]);

	useEffect(() => {
		if (!mapRef.current || !hexagonsData) return;

		const map = mapRef.current;

		if (!map.getSource("hexagons")) {
			setupHexagonLayer();
		}

		if (mode === "battle") {
			const uniqueUsers = new Set(hexagonsData.map((hex) => hex.currentOwnerId));
			setUserCount(uniqueUsers.size);
		}

		const features = hexagonsData.map((hex) => {
			const feature = h3ToGeoJSON(hex.hexagonId);

			const color = getUserColor(hex.currentOwnerId);

			return {
				...feature,
				properties: {
					...feature.properties,
					hexagonId: hex.hexagonId,
					userId: hex.currentOwnerId,
					color: color,
					hasImage: false,
					captureCount: hex.captureCount,
					activityType: hex.activityType,
				},
			};
		});

		const geojson: GeoJSON.FeatureCollection = {
			type: "FeatureCollection",
			features,
		};

		const source = map.getSource("hexagons") as import("mapbox-gl").GeoJSONSource;
		if (source) {
			source.setData(geojson);
			setVisibleHexCount(hexagonsData.length);
		}
	}, [hexagonsData, mapRef, mode, setupHexagonLayer]);

	// Separate effect to attach/detach map event listeners with stable references
	useEffect(() => {
		const map = mapRef.current;

		if (!map) return;

		// Use the stable wrapper function - this reference NEVER changes
		const stableUpdateHandler = () => {
			updateHexagonsRef.current?.();
		};

		map.on("moveend", stableUpdateHandler);
		map.on("zoomend", stableUpdateHandler);

		return () => {
			if (map.getStyle()) {
				map.off("moveend", stableUpdateHandler);
				map.off("zoomend", stableUpdateHandler);
			}
		};
	}, []); // Empty deps - only run once on mount/unmount

	// Separate effect for initialization
	useEffect(() => {
		const map = mapRef.current;

		if (!map) return;

		isMountedRef.current = true;

		const initializeHexagons = () => {
			if (!isMountedRef.current) {
				return;
			}

			// Ensure style is loaded before setting up layers
			const setupLayersWhenReady = () => {
				if (!map.isStyleLoaded()) {
					map.once("styledata", setupLayersWhenReady);
					return;
				}

				setupHexagonLayer();
				setupParentLayer();

				const doInitialFetch = () => {
					if (!isMountedRef.current) return;

					clearCenterCache();
					// Call directly instead of through ref to ensure it runs
					updateHexagonsImpl();
				};

				if (map.loaded() && !map.isMoving()) {
					setTimeout(doInitialFetch, 100);
				} else {
					map.once("idle", doInitialFetch);
				}
			};

			setupLayersWhenReady();
		};

		// Map is guaranteed to be loaded when this component mounts
		if (map.loaded()) {
			initializeHexagons();
		} else {
			map.once("load", initializeHexagons);
		}

		return () => {
			isMountedRef.current = false;

			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
				debounceTimeoutRef.current = null;
			}

			cleanupHexagonLayer();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!mapRef.current) return;

		clearCenterCache();
		updateHexagons();
	}, [mode, mapRef, clearCenterCache, updateHexagons]);

	return {
		totalHexCount: countData?.myHexagonsCount ?? 0,
		visibleHexCount,
		userCount,
		loading,
		refetchHexagons,
		hexagonsData,
	};
};
