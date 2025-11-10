import { getUserColor } from "@/constants/hexagonColors";
import { HexagonsByParentsDocument } from "@/gql/graphql";
import { h3ToGeoJSON } from "@/utils/hexagonUtils";
import { useApolloClient, useLazyQuery } from "@apollo/client/react";
import { gridDisk, latLngToCell } from "h3-js";
import type { Map as MapboxMap } from "mapbox-gl";
import React, { useCallback, useEffect, useState } from "react";

interface UseHexagonsOptions {
	mapRef: React.RefObject<MapboxMap | null>;
	onHexagonClick?: (hexagonId: string) => void;
}

export const useHexagons = ({ mapRef, onHexagonClick }: UseHexagonsOptions) => {
	const [visibleHexCount, setVisibleHexCount] = useState(0);
	const [userCount, setUserCount] = useState(0);
	const apolloClient = useApolloClient();
	const debounceTimeoutRef = React.useRef<number | null>(null);
	const onHexagonClickRef = React.useRef(onHexagonClick);
	const lastCenterHexRef = React.useRef<string | null>(null);
	const isMountedRef = React.useRef(true);
	const clickHandlerRef = React.useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
	const mouseEnterHandlerRef = React.useRef<(() => void) | null>(null);
	const mouseLeaveHandlerRef = React.useRef<(() => void) | null>(null);
	const updateHexagonsRef = React.useRef<(() => void) | null>(null);

	useEffect(() => {
		apolloClient.cache.evict({ fieldName: "hexagonsByParents" });
		apolloClient.cache.gc();
	}, [apolloClient]);

	useEffect(() => {
		onHexagonClickRef.current = onHexagonClick;
	}, [onHexagonClick]);

	const [fetchAllHexagons, { data: allHexagonsData, loading }] =
		useLazyQuery(HexagonsByParentsDocument);

	const hexagonsData = allHexagonsData?.hexagonsByParents;

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
				"line-color": "#BBBBBB",
				"line-width": 2,
				"line-opacity": 0.5,
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

			try {
				const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
				const centerLng = (bounds.getEast() + bounds.getWest()) / 2;

				const centerParentHex = latLngToCell(centerLat, centerLng, 6);

				if (lastCenterHexRef.current === centerParentHex) {
					return;
				}

				const parentHexagonIds = gridDisk(centerParentHex, 1);

				updateParentVisualization(parentHexagonIds);

				fetchAllHexagons({ variables: { parentHexagonIds } });
			} catch (error) {
				console.error("Error in updateHexagons:", error);
			}
		}, 300);
	}, [mapRef, fetchAllHexagons, updateParentVisualization]);

	// Initialize ref immediately - before any effects run
	updateHexagonsRef.current = updateHexagonsImpl;

	// Keep the ref up to date
	useEffect(() => {
		updateHexagonsRef.current = updateHexagonsImpl;
	}, [updateHexagonsImpl]);

	// Stable wrapper that always calls the latest version
	// const updateHexagons = useCallback(() => {
	// 	updateHexagonsRef.current?.();
	// }, []);

	const refetchHexagons = useCallback(() => {
		// Clear cache and force update on next moveend
		clearCenterCache();
		// Trigger update immediately
		updateHexagonsImpl();
	}, [clearCenterCache, updateHexagonsImpl]);

	useEffect(() => {
		console.log(
			"📊 useHexagons: Data effect triggered - hexagonsData:",
			!!hexagonsData,
			"count:",
			hexagonsData?.length
		);

		if (!mapRef.current || !hexagonsData) return;

		const map = mapRef.current;
		const source = map.getSource("hexagons") as import("mapbox-gl").GeoJSONSource;

		if (!source) {
			console.error(
				"❌ useHexagons: Hexagons source not found - sources should be ready before MapContent renders"
			);
			return;
		}

		console.log(
			"🎨 useHexagons: Starting to render",
			hexagonsData.length,
			"hexagons at",
			new Date().toISOString()
		);

		const uniqueUsers = new Set(hexagonsData.map((hex) => hex.currentOwnerId));
		setUserCount(uniqueUsers.size);

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

		console.log("🖼️ useHexagons: Setting data on source with", features.length, "features");
		source.setData(geojson);
		setVisibleHexCount(hexagonsData.length);
		console.log("✅ useHexagons: Data rendered successfully at", new Date().toISOString());

		try {
			const bounds = map.getBounds();
			if (bounds) {
				const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
				const centerLng = (bounds.getEast() + bounds.getWest()) / 2;
				const centerParentHex = latLngToCell(centerLat, centerLng, 6);
				lastCenterHexRef.current = centerParentHex;
				console.log("💾 useHexagons: Cache updated to parent hex:", centerParentHex);
			}
		} catch (error) {
			console.error("Error calculating parent hex for cache:", error);
		}
	}, [hexagonsData, mapRef]);

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
	}, [mapRef]);

	useEffect(() => {
		const map = mapRef.current;

		if (!map) return;

		isMountedRef.current = true;

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

		console.log(
			"🚀 useHexagons: Initialization - setting up and triggering initial fetch at",
			new Date().toISOString()
		);
		clearCenterCache();
		updateHexagonsImpl();

		return () => {
			isMountedRef.current = false;

			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
				debounceTimeoutRef.current = null;
			}

			lastCenterHexRef.current = null;

			if (map.getStyle()) {
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
			}
		};
	}, [mapRef, clearCenterCache, updateHexagonsImpl]);

	return {
		visibleHexCount,
		userCount,
		loading,
		refetchHexagons,
		hexagonsData,
	};
};
