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

		// Wait for style to load before adding sources/layers
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

		// Wait for style to load before adding sources/layers
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

	const updateHexagons = useCallback(() => {
		if (!mapRef.current) return;

		const map = mapRef.current;
		const bounds = map.getBounds();

		if (!bounds) return;

		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		debounceTimeoutRef.current = setTimeout(() => {
			const currentMode = modeRef.current;

			try {
				const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
				const centerLng = (bounds.getEast() + bounds.getWest()) / 2;

				const centerParentHex = latLngToCell(centerLat, centerLng, 6);

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
				console.error("❌ Error in updateHexagons:", error);
			}
		}, 300);
	}, [mapRef, fetchMyHexagons, fetchAllHexagons, updateParentVisualization]);

	const refetchHexagons = useCallback(() => {
		clearCenterCache();
		updateHexagons();
	}, [updateHexagons, clearCenterCache]);

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

	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		isMountedRef.current = true;

		const initializeHexagons = () => {
			if (!isMountedRef.current) {
				return;
			}

			setupHexagonLayer();
			setupParentLayer();

			const doInitialFetch = () => {
				if (!isMountedRef.current) return;

				clearCenterCache();
				updateHexagons();
			};

			if (map.loaded() && !map.isMoving()) {
				setTimeout(doInitialFetch, 100);
			} else {
				map.once("idle", doInitialFetch);
			}

			map.on("moveend", updateHexagons);
			map.on("zoomend", updateHexagons);
		};

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

			if (map && map.getStyle()) {
				try {
					map.off("moveend", updateHexagons);
					map.off("zoomend", updateHexagons);
				} catch (error) {
					console.error(error);
				}
			}

			cleanupHexagonLayer();
		};
	}, [
		mapRef,
		setupHexagonLayer,
		setupParentLayer,
		updateHexagons,
		cleanupHexagonLayer,
		clearCenterCache,
	]);

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
