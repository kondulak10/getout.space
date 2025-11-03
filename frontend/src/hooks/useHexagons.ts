import { MyHexagonsInBboxDocument, HexagonsInBboxDocument, MyHexagonsCountDocument } from "@/gql/graphql";
import { h3ToGeoJSON } from "@/utils/hexagonUtils";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import type { Map as MapboxMap } from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import React from "react";

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

	// Keep refs updated
	useEffect(() => {
		onHexagonClickRef.current = onHexagonClick;
		modeRef.current = mode;
	}, [onHexagonClick, mode]);

	// Get total hex count (only for 'only-you' mode)
	const { data: countData } = useQuery(MyHexagonsCountDocument, {
		skip: mode !== 'only-you',
	});

	// Lazy queries for both modes
	const [fetchMyHexagons, { data: myHexagonsData, loading: myLoading }] = useLazyQuery(MyHexagonsInBboxDocument);
	const [fetchAllHexagons, { data: allHexagonsData, loading: allLoading }] = useLazyQuery(HexagonsInBboxDocument);

	// Select the appropriate data and loading state based on mode
	const hexagonsData = mode === 'only-you' ? myHexagonsData?.myHexagonsInBbox : allHexagonsData?.hexagonsInBbox;
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

		map.on("click", "hexagon-fills", handleHexagonClick);

		// Change cursor on hover
		map.on("mouseenter", "hexagon-fills", () => {
			map.getCanvas().style.cursor = "pointer";
		});

		map.on("mouseleave", "hexagon-fills", () => {
			map.getCanvas().style.cursor = "";
		});
	}, [mapRef]);

	// Cleanup hex layers
	const cleanupHexagonLayer = useCallback(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;

		console.log(`🧹 Cleaning up hexagon layers`);

		if (map.getLayer("hexagon-fills")) {
			map.removeLayer("hexagon-fills");
		}
		if (map.getLayer("hexagon-outlines")) {
			map.removeLayer("hexagon-outlines");
		}
		if (map.getSource("hexagons")) {
			map.removeSource("hexagons");
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

	// Debounced function to update hexagons based on current viewport
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
			console.log(`📡 Fetching hexagons for ${currentMode} mode`);
			lastFetchedBoundsRef.current = newBounds;

			// Call the appropriate query based on current mode
			if (currentMode === 'only-you') {
				fetchMyHexagons({ variables: newBounds });
			} else {
				fetchAllHexagons({ variables: newBounds });
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

		console.log(`🎬 Initial setup`);

		const initializeHexagons = () => {
			console.log(`🗺️ Setting up layers and listeners`);

			// Setup layers
			setupHexagonLayer();

			// Fetch initial hexagons
			const doInitialFetch = () => {
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
			map.off('moveend', updateHexagons);
			map.off('zoomend', updateHexagons);
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
	};
};
