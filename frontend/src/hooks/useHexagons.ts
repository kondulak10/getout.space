import { MyHexagonsByParentsDocument, HexagonsByParentsDocument, MyHexagonsCountDocument } from "@/gql/graphql";
import { h3ToGeoJSON } from "@/utils/hexagonUtils";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import type { Map as MapboxMap } from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import React from "react";
import { polygonToCells } from "h3-js";

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
	const lastFetchedBoundsRef = React.useRef<BoundingBox | null>(null);
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
			console.log(`✓ Hexagon layers already exist`);
			return;
		}

		console.log(`🎨 Setting up hexagon layers`);

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

	// Cleanup hex layers
	const cleanupHexagonLayer = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		// Check if map is still valid before cleaning up
		if (!map.getStyle()) {
			console.log(`⚠️ Map already destroyed, skipping layer cleanup`);
			return;
		}

		console.log(`🧹 Cleaning up hexagon layers`);

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
		} catch (error) {
			console.warn(`Failed to cleanup hexagon layers:`, error);
		}

		// Clear cached bounds so we fetch fresh data next time
		lastFetchedBoundsRef.current = null;
	}, [mapRef]);

	// Clear bounds cache
	const clearBoundsCache = useCallback(() => {
		lastFetchedBoundsRef.current = null;
	}, []);

	// Check if new bounds are within previously fetched bounds
	const isWithinLastFetchedBounds = useCallback((newBounds: BoundingBox): boolean => {
		const lastBounds = lastFetchedBoundsRef.current;
		if (!lastBounds) return false;

		return (
			newBounds.south >= lastBounds.south &&
			newBounds.north <= lastBounds.north &&
			newBounds.west >= lastBounds.west &&
			newBounds.east <= lastBounds.east
		);
	}, []);

	// Debounced function to update hexagons based on current viewport (OPTIMIZED!)
	const updateHexagons = useCallback(() => {
		if (!mapRef.current) return;

		const map = mapRef.current;
		const bounds = map.getBounds();

		if (!bounds) return;

		const newBounds: BoundingBox = {
			south: bounds.getSouth(),
			west: bounds.getWest(),
			north: bounds.getNorth(),
			east: bounds.getEast(),
		};

		// Skip if new bounds are within last fetched bounds (zoom in case)
		if (isWithinLastFetchedBounds(newBounds)) {
			return;
		}

		// Clear previous timeout
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		// Debounce to avoid hammering the backend during panning/zooming
		debounceTimeoutRef.current = setTimeout(() => {
			const currentMode = modeRef.current; // Read current mode from ref
			console.log(`📡 Calculating visible H3 cells for ${currentMode} mode`);
			lastFetchedBoundsRef.current = newBounds;

			// Calculate PARENT H3 hexagons in viewport (resolution 6 ~3km)
			// H3 expects [lat, lng] format, NOT [lng, lat]!
			const bboxPolygon: [number, number][] = [
				[newBounds.north, newBounds.west],  // top-left [lat, lng]
				[newBounds.north, newBounds.east],  // top-right [lat, lng]
				[newBounds.south, newBounds.east],  // bottom-right [lat, lng]
				[newBounds.south, newBounds.west],  // bottom-left [lat, lng]
				[newBounds.north, newBounds.west],  // close polygon
			];

			try {
				// Get parent hexagons at resolution 6 (NOT resolution 10!)
				const allParentHexagonIds = polygonToCells(bboxPolygon, 6);
				console.log(`📊 Calculated ${allParentHexagonIds.length} parent hexagons (res 6) for viewport`);

				// Safety limit: max 1000 parent hexagons (prevents massive queries when zoomed way out)
				const MAX_PARENT_HEXAGONS = 1000;
				const parentHexagonIds = allParentHexagonIds.slice(0, MAX_PARENT_HEXAGONS);

				if (allParentHexagonIds.length > MAX_PARENT_HEXAGONS) {
					console.warn(`⚠️  Limited from ${allParentHexagonIds.length} to ${MAX_PARENT_HEXAGONS} parent hexagons`);
				}

				// Call the appropriate query based on current mode
				if (currentMode === 'only-you') {
					fetchMyHexagons({ variables: { parentHexagonIds } });
				} else {
					fetchAllHexagons({ variables: { parentHexagonIds } });
				}
			} catch (error) {
				console.error('Failed to calculate parent H3 cells:', error);
			}
		}, 300);
	}, [mapRef, fetchMyHexagons, fetchAllHexagons, isWithinLastFetchedBounds]);

	// Force refresh hexagons (clears cache and refetches)
	const refetchHexagons = useCallback(() => {
		console.log('🔄 Force refreshing hexagons...');
		clearBoundsCache();
		updateHexagons();
	}, [updateHexagons, clearBoundsCache]);

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
			console.log(`✅ Updating map with ${hexagonsData.length} hexagons`);
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

		console.log(`🎬 Initial setup`);

		const initializeHexagons = () => {
			// Check if component is still mounted
			if (!isMountedRef.current) {
				console.log(`⚠️ Component unmounted, skipping initialization`);
				return;
			}

			console.log(`🗺️ Setting up layers and listeners`);

			// Setup layers
			setupHexagonLayer();

			// Fetch initial hexagons
			const doInitialFetch = () => {
				// Double-check component is still mounted
				if (!isMountedRef.current) return;

				console.log(`📡 Fetching initial hexagons...`);
				clearBoundsCache();
				updateHexagons();
			};

			// If map is already loaded and idle, fetch immediately
			if (map.loaded() && !map.isMoving()) {
				setTimeout(doInitialFetch, 100);
			} else {
				map.once('idle', doInitialFetch);
			}

			// Set up listeners ONCE - they stay active and use modeRef for current mode
			console.log(`➕ Adding map event listeners (permanent)`);
			map.on('moveend', updateHexagons);
			map.on('zoomend', updateHexagons);
		};

		if (map.loaded()) {
			initializeHexagons();
		} else {
			map.once('load', initializeHexagons);
		}

		return () => {
			console.log(`🧹 Component unmounting - final cleanup`);

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
					console.warn(`Failed to remove event listeners:`, error);
				}
			}

			cleanupHexagonLayer();
		};
	}, [mapRef, setupHexagonLayer, updateHexagons, cleanupHexagonLayer, clearBoundsCache]);

	// When mode changes, just clear cache and refetch
	useEffect(() => {
		if (!mapRef.current) return;

		console.log(`🔄 Mode changed to: ${mode}`);
		console.log(`♻️ Clearing cache and refetching hexagons...`);

		clearBoundsCache();
		updateHexagons();
	}, [mode, clearBoundsCache, updateHexagons]);

	return {
		totalHexCount: countData?.myHexagonsCount ?? 0, // Only meaningful in 'only-you' mode
		visibleHexCount,
		userCount, // Only meaningful in 'battle' mode
		loading,
		refetchHexagons,
		hexagonsData, // Expose hexagons data for other hooks
	};
};
