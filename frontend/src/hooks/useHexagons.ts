import { MyHexagonsByParentsDocument, HexagonsByParentsDocument, MyHexagonsCountDocument } from "@/gql/graphql";
import { h3ToGeoJSON } from "@/utils/hexagonUtils";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import type { Map as MapboxMap } from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import React from "react";
import { latLngToCell, gridDisk } from "h3-js";

interface UseHexagonsOptions {
	mapRef: React.RefObject<MapboxMap | null>;
	mode: 'only-you' | 'battle';
	onHexagonClick?: (hexagonId: string) => void;
}

interface BoundingBox {
	south: number;
	west: number;
	north: number;
	east: number;
}

/**
 * Generate a consistent color for a user ID
 */
function getUserColor(userId: string): string {
	let hash = 0;
	for (let i = 0; i < userId.length; i++) {
		hash = userId.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = Math.abs(hash % 360);
	const saturation = 65 + (Math.abs(hash) % 20);
	const lightness = 50 + (Math.abs(hash >> 8) % 15);
	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Unified hook for managing hexagons on the map
 * Handles both "only-you" and "battle" modes
 */
export const useHexagons = ({ mapRef, mode, onHexagonClick }: UseHexagonsOptions) => {
	const [visibleHexCount, setVisibleHexCount] = useState(0);
	const [userCount, setUserCount] = useState(0);
	const debounceTimeoutRef = React.useRef<number | null>(null);
	const onHexagonClickRef = React.useRef(onHexagonClick);
	const lastCenterHexRef = React.useRef<string | null>(null); // Track center parent hex
	const modeRef = React.useRef(mode); // Use ref so callbacks don't need to change
	const isMountedRef = React.useRef(true); // Track if component is mounted
	const clickHandlerRef = React.useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
	const mouseEnterHandlerRef = React.useRef<(() => void) | null>(null);
	const mouseLeaveHandlerRef = React.useRef<(() => void) | null>(null);

	// Keep refs updated
	useEffect(() => {
		onHexagonClickRef.current = onHexagonClick;
		modeRef.current = mode;
	}, [onHexagonClick, mode]);

	// Get total hex count (only for 'only-you' mode)
	const { data: countData } = useQuery(MyHexagonsCountDocument, {
		skip: mode !== 'only-you',
	});

	// Lazy queries for both modes (OPTIMIZED - using parent hexagon IDs!)
	const [fetchMyHexagons, { data: myHexagonsData, loading: myLoading }] = useLazyQuery(MyHexagonsByParentsDocument);
	const [fetchAllHexagons, { data: allHexagonsData, loading: allLoading }] = useLazyQuery(HexagonsByParentsDocument);

	// Select the appropriate data and loading state based on mode
	const hexagonsData = mode === 'only-you' ? myHexagonsData?.myHexagonsByParents : allHexagonsData?.hexagonsByParents;
	const loading = mode === 'only-you' ? myLoading : allLoading;

	// === ALL CALLBACKS DEFINED FIRST ===

	// Setup map layer for hexagons
	const setupHexagonLayer = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		// Check if source already exists
		if (map.getSource("hexagons")) {
			return;
		}

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
				"fill-opacity": 0.5,
			},
		});

		// Add hexagon outline layer
		map.addLayer({
			id: "hexagon-outlines",
			type: "line",
			source: "hexagons",
			paint: {
				"line-color": "#1E40AF",
				"line-width": 1.5,
				"line-opacity": 0.7,
			},
		});

		// Add click handler for hexagons
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

		// Store handlers in refs for cleanup
		clickHandlerRef.current = handleHexagonClick;
		mouseEnterHandlerRef.current = handleMouseEnter;
		mouseLeaveHandlerRef.current = handleMouseLeave;

		map.on("click", "hexagon-fills", handleHexagonClick);
		map.on("mouseenter", "hexagon-fills", handleMouseEnter);
		map.on("mouseleave", "hexagon-fills", handleMouseLeave);
	}, [mapRef]);

	// Setup parent hexagon visualization layer
	const setupParentLayer = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		if (map.getSource("parent-hexagons")) {
			return; // Already exists
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
				"line-color": "#6B7280", // Grey color
				"line-width": 2,
				"line-opacity": 0.5,
			},
		});
	}, [mapRef]);

	// Update parent hexagon visualization
	const updateParentVisualization = useCallback((parentHexagonIds: string[]) => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		const source = map.getSource("parent-hexagons") as import("mapbox-gl").GeoJSONSource;
		if (!source) {
			setupParentLayer(); // Ensure layer exists
			setTimeout(() => updateParentVisualization(parentHexagonIds), 100);
			return;
		}

		// Convert parent hexagon IDs to GeoJSON
		const features = parentHexagonIds.map(parentId => {
			return h3ToGeoJSON(parentId);
		});

		const geojson: GeoJSON.FeatureCollection = {
			type: "FeatureCollection",
			features,
		};

		source.setData(geojson);
	}, [mapRef, setupParentLayer]);

	// Cleanup hex layers
	const cleanupHexagonLayer = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		// Check if map is still valid before cleaning up
		if (!map.getStyle()) {
			return;
		}

		try {
			// Remove event handlers first (before removing layers)
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

			// Then remove layers
			if (map.getLayer("hexagon-fills")) {
				map.removeLayer("hexagon-fills");
			}
			if (map.getLayer("hexagon-outlines")) {
				map.removeLayer("hexagon-outlines");
			}
			if (map.getSource("hexagons")) {
				map.removeSource("hexagons");
			}

			// Remove parent hexagon visualization
			if (map.getLayer("parent-hexagon-borders")) {
				map.removeLayer("parent-hexagon-borders");
			}
			if (map.getSource("parent-hexagons")) {
				map.removeSource("parent-hexagons");
			}
		} catch (error) {
			// Silently fail cleanup
		}

		// Clear cached center hex so we fetch fresh data next time
		lastCenterHexRef.current = null;
	}, [mapRef]);

	// Clear center hex cache
	const clearCenterCache = useCallback(() => {
		lastCenterHexRef.current = null;
	}, []);

	// Debounced function to update hexagons based on center parent hex + 1 ring (7 total)
	const updateHexagons = useCallback(() => {
		if (!mapRef.current) return;

		const map = mapRef.current;
		const bounds = map.getBounds();

		if (!bounds) return;

		// Clear previous timeout
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		// Debounce to avoid hammering the backend during panning/zooming
		debounceTimeoutRef.current = setTimeout(() => {
			const currentMode = modeRef.current;

			try {
				// Get viewport center
				const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
				const centerLng = (bounds.getEast() + bounds.getWest()) / 2;

				// Get parent hexagon at center (resolution 6)
				const centerParentHex = latLngToCell(centerLat, centerLng, 6);

				// Check if center parent hex changed
				if (lastCenterHexRef.current === centerParentHex) {
					return; // No change, skip fetch
				}

				// Update cache
				lastCenterHexRef.current = centerParentHex;

				// Get parent hexagons using gridDisk: center + 1 ring = 7 total
				const parentHexagonIds = gridDisk(centerParentHex, 1);

				// OPTIONAL: Expand to ring 2 (19 hexagons) based on zoom level
				// Uncomment below to enable larger coverage when zoomed out:
				// const zoom = map.getZoom();
				// const ringSize = zoom >= 12 ? 1 : 2;
				// const parentHexagonIds = gridDisk(centerParentHex, ringSize);

				// Visualize the parent hexagons being queried
				updateParentVisualization(parentHexagonIds);

				// Call the appropriate query based on current mode
				if (currentMode === 'only-you') {
					fetchMyHexagons({ variables: { parentHexagonIds } });
				} else {
					fetchAllHexagons({ variables: { parentHexagonIds } });
				}
			} catch (error) {
				// Silently fail
			}
		}, 300);
	}, [mapRef, fetchMyHexagons, fetchAllHexagons, updateParentVisualization]);

	// Force refresh hexagons (clears cache and refetches)
	const refetchHexagons = useCallback(() => {
		clearCenterCache();
		updateHexagons();
	}, [updateHexagons, clearCenterCache]);

	// === ALL EFFECTS COME AFTER CALLBACKS ===

	// Update hexagons on map when data changes
	useEffect(() => {
		if (!mapRef.current || !hexagonsData) return;

		const map = mapRef.current;

		// Ensure layers exist before updating data
		if (!map.getSource("hexagons")) {
			setupHexagonLayer();
		}

		// Track unique users (for battle mode)
		if (mode === 'battle') {
			const uniqueUsers = new Set(hexagonsData.map(hex => hex.currentOwnerId));
			setUserCount(uniqueUsers.size);
		}

		// Create GeoJSON features from hexagons
		const features = hexagonsData.map((hex) => {
			const feature = h3ToGeoJSON(hex.hexagonId);

			// Apply color based on mode
			const color = mode === 'only-you'
				? '#3B82F6' // Blue for user's hexes
				: getUserColor(hex.currentOwnerId); // Unique color per user in battle mode

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

		// Update the map source
		const source = map.getSource("hexagons") as import("mapbox-gl").GeoJSONSource;
		if (source) {
			source.setData(geojson);
			setVisibleHexCount(hexagonsData.length);
		}
	}, [hexagonsData, mapRef, mode, setupHexagonLayer]);

	// Setup layers and event listeners ONCE on mount (stable callbacks)
	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		// Reset mounted flag (important for React strict mode)
		isMountedRef.current = true;

		const initializeHexagons = () => {
			// Check if component is still mounted
			if (!isMountedRef.current) {
				return;
			}

			// Setup layers
			setupHexagonLayer();
			setupParentLayer();

			// Fetch initial hexagons
			const doInitialFetch = () => {
				// Double-check component is still mounted
				if (!isMountedRef.current) return;

				clearCenterCache();
				updateHexagons();
			};

			// If map is already loaded and idle, fetch immediately
			if (map.loaded() && !map.isMoving()) {
				setTimeout(doInitialFetch, 100);
			} else {
				map.once('idle', doInitialFetch);
			}

			// Set up listeners ONCE - they stay active and use modeRef for current mode
			map.on('moveend', updateHexagons);
			map.on('zoomend', updateHexagons);
		};

		if (map.loaded()) {
			initializeHexagons();
		} else {
			map.once('load', initializeHexagons);
		}

		return () => {
			// Mark component as unmounted to prevent race conditions
			isMountedRef.current = false;

			// Clear any pending debounce timeout
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
				debounceTimeoutRef.current = null;
			}

			// Remove event listeners if map is still valid
			const currentMap = mapRef.current;
			if (currentMap && currentMap.getStyle()) {
				try {
					currentMap.off('moveend', updateHexagons);
					currentMap.off('zoomend', updateHexagons);
				} catch (error) {
					// Silently fail
				}
			}

			cleanupHexagonLayer();
		};
	}, [mapRef, setupHexagonLayer, setupParentLayer, updateHexagons, cleanupHexagonLayer, clearCenterCache]);

	// When mode changes, just clear cache and refetch
	useEffect(() => {
		if (!mapRef.current) return;

		clearCenterCache();
		updateHexagons();
	}, [mode, clearCenterCache, updateHexagons]);

	return {
		totalHexCount: countData?.myHexagonsCount ?? 0, // Only meaningful in 'only-you' mode
		visibleHexCount,
		userCount, // Only meaningful in 'battle' mode
		loading,
		refetchHexagons,
		hexagonsData, // Expose hexagons data for other hooks
	};
};
