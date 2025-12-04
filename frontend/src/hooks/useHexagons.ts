import { getUserColor } from "@/constants/hexagonColors";
import { HexagonsByParentDocument, HexagonsByParentQuery } from "@/gql/graphql";
import { h3ToGeoJSON } from "@/utils/hexagonUtils";
import { useApolloClient } from "@apollo/client/react";
import { gridDisk, latLngToCell } from "h3-js";
import type { Map as MapboxMap } from "mapbox-gl";
import React, { useCallback, useEffect, useState } from "react";
import { useMap } from "@/contexts/useMap";
interface UseHexagonsOptions {
	mapRef: React.RefObject<MapboxMap | null>;
	onHexagonClick?: (hexagonId: string) => void;
	currentUserId?: string;
}
export const useHexagons = ({ mapRef, onHexagonClick, currentUserId }: UseHexagonsOptions) => {
	const [visibleHexCount, setVisibleHexCount] = useState(0);
	const [userCount, setUserCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const [hexagonsData, setHexagonsData] = useState<HexagonsByParentQuery['hexagonsByParent'] | null>(null);
	const apolloClient = useApolloClient();
	const { currentParentHexagonIds } = useMap();
	const debounceTimeoutRef = React.useRef<number | null>(null);
	const onHexagonClickRef = React.useRef(onHexagonClick);
	const lastCenterHexRef = React.useRef<string | null>(null);
	const isMountedRef = React.useRef(true);
	const clickHandlerRef = React.useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
	const mouseEnterHandlerRef = React.useRef<(() => void) | null>(null);
	const mouseLeaveHandlerRef = React.useRef<(() => void) | null>(null);
	const updateHexagonsRef = React.useRef<(() => void) | null>(null);
	const isInitialLoadRef = React.useRef(true);
	useEffect(() => {
		onHexagonClickRef.current = onHexagonClick;
	}, [onHexagonClick]);
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
		debounceTimeoutRef.current = setTimeout(async () => {
			const bounds = map.getBounds();
			if (!bounds) return;

			// Don't fetch hexagons if zoom is too low (user can't see them anyway)
			const zoom = map.getZoom();
			if (zoom < 9.5) {
				setHexagonsData([]);
				setVisibleHexCount(0);
				setUserCount(0);
				setLoading(false);
				return;
			}

			try {
				const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
				const centerLng = (bounds.getEast() + bounds.getWest()) / 2;
				const centerParentHex = latLngToCell(centerLat, centerLng, 6);
				if (lastCenterHexRef.current === centerParentHex) {
					return;
				}
				// Separate center from ring for center-first loading
				const allParentHexes = gridDisk(centerParentHex, 1);
				const ringHexes = allParentHexes.filter(id => id !== centerParentHex);

				currentParentHexagonIds.current = allParentHexes;
				updateParentVisualization(allParentHexes);

				setLoading(true);

				// PHASE 1: Load center first (gets full bandwidth)
				const centerResult = await apolloClient.query({
					query: HexagonsByParentDocument,
					variables: { parentHexagonId: centerParentHex },
				});

				const centerHexagons = centerResult.data?.hexagonsByParent || [];

				// Render center immediately (first render - ~70% of viewport)
				setHexagonsData(centerHexagons);
				setVisibleHexCount(centerHexagons.length);
				setUserCount(new Set(centerHexagons.map(hex => hex.currentOwnerId)).size);

				// PHASE 2: Load remaining 6 ring hexes (share bandwidth)
				const ringResults = await Promise.all(
					ringHexes.map(parentHexagonId =>
						apolloClient.query({
							query: HexagonsByParentDocument,
							variables: { parentHexagonId },
						})
					)
				);

				// Combine all hexagons from center + ring
				const allHexagons = [
					...centerHexagons,
					...ringResults.flatMap(result => result.data?.hexagonsByParent || [])
				];

				// Final render with complete data (second render)
				setHexagonsData(allHexagons);
				setVisibleHexCount(allHexagons.length);
				setUserCount(new Set(allHexagons.map(hex => hex.currentOwnerId)).size);
				setLoading(false);
			} catch {
				// Failed to calculate parent hexagons
				setLoading(false);
			}
		}, 300);
		// currentParentHexagonIds is a ref and doesn't trigger re-renders
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mapRef, apolloClient, updateParentVisualization]);
	updateHexagonsRef.current = updateHexagonsImpl;
	useEffect(() => {
		updateHexagonsRef.current = updateHexagonsImpl;
	}, [updateHexagonsImpl]);
	const refetchHexagons = useCallback(() => {
		clearCenterCache();
		updateHexagonsImpl();
	}, [clearCenterCache, updateHexagonsImpl]);
	useEffect(() => {
		if (!mapRef.current || !hexagonsData) return;
		const map = mapRef.current;
		const source = map.getSource("hexagons") as import("mapbox-gl").GeoJSONSource;
		if (!source) {
			return;
		}

		// Build GeoJSON features for map rendering
		const features = hexagonsData.map((hex) => {
			const feature = h3ToGeoJSON(hex.hexagonId);
			const color = getUserColor(hex.currentOwnerId, currentUserId);
			const isCurrentUser = currentUserId && hex.currentOwnerId === currentUserId;
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
					isCurrentUser: isCurrentUser,
				},
			};
		});

		const geojson: GeoJSON.FeatureCollection = {
			type: "FeatureCollection",
			features,
		};

		// Update map source (no setState calls - avoids extra re-renders)
		source.setData(geojson);

		// Update lastCenterHex tracking
		try {
			const bounds = map.getBounds();
			if (bounds) {
				const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
				const centerLng = (bounds.getEast() + bounds.getWest()) / 2;
				const centerParentHex = latLngToCell(centerLat, centerLng, 6);
				lastCenterHexRef.current = centerParentHex;
			}
		} catch {
			// Ignore coordinate conversion errors
		}
	}, [hexagonsData, mapRef, currentUserId]);
	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;
		const stableUpdateHandler = () => {
			// Skip first map event (Mapbox fires moveend after style loads)
			// This prevents duplicate queries on initial page load
			if (isInitialLoadRef.current) {
				isInitialLoadRef.current = false;
				return;
			}
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
		clearCenterCache();
		// Use ref to avoid re-running effect when callback changes
		// This prevents duplicate queries on mount
		updateHexagonsRef.current?.();
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
	}, [mapRef, clearCenterCache]);
	return {
		visibleHexCount,
		userCount,
		loading,
		refetchHexagons,
		hexagonsData,
	};
};
