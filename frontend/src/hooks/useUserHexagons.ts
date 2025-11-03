import { MyHexagonsCountDocument, MyHexagonsInBboxDocument } from "@/gql/graphql";
import { h3ToGeoJSON } from "@/utils/hexagonUtils";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import type { Map as MapboxMap } from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import React from "react";

interface UseUserHexagonsOptions {
	mapRef: React.RefObject<MapboxMap | null>;
	enabled: boolean;
	onHexagonClick?: (hexagonId: string) => void;
}

interface BoundingBox {
	south: number;
	west: number;
	north: number;
	east: number;
}

export const useUserHexagons = ({ mapRef, enabled, onHexagonClick }: UseUserHexagonsOptions) => {
	const [visibleHexCount, setVisibleHexCount] = useState(0);
	const debounceTimeoutRef = React.useRef<number | null>(null);
	const onHexagonClickRef = React.useRef(onHexagonClick);
	const lastFetchedBoundsRef = React.useRef<BoundingBox | null>(null);

	// Keep ref updated
	useEffect(() => {
		onHexagonClickRef.current = onHexagonClick;
	}, [onHexagonClick]);

	// Get total hex count
	const { data: countData } = useQuery(MyHexagonsCountDocument, {
		skip: !enabled,
	});

	// Lazy query for bbox hexagons
	const [fetchHexagons, { data: hexagonsData, loading }] = useLazyQuery(MyHexagonsInBboxDocument);

	// Update hexagons on map when data changes
	useEffect(() => {
		if (!mapRef.current || !hexagonsData || !enabled) return;

		const map = mapRef.current;
		const hexagons = hexagonsData.myHexagonsInBbox;

		// Create GeoJSON features from hexagons (minimal data only!)
		const features = hexagons.map((hex) => {
			const feature = h3ToGeoJSON(hex.hexagonId);
			return {
				...feature,
				properties: {
					...feature.properties,
					hexagonId: hex.hexagonId, // Only store hexagonId for click handling
					color: "#3B82F6", // Blue color for user's hexes
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
			setVisibleHexCount(hexagons.length);
		}
	}, [hexagonsData, mapRef, enabled]);

	// Check if new bounds are within previously fetched bounds
	const isWithinLastFetchedBounds = useCallback((newBounds: BoundingBox): boolean => {
		const lastBounds = lastFetchedBoundsRef.current;
		if (!lastBounds) return false;

		// Check if new bounds are completely within last fetched bounds
		return (
			newBounds.south >= lastBounds.south &&
			newBounds.north <= lastBounds.north &&
			newBounds.west >= lastBounds.west &&
			newBounds.east <= lastBounds.east
		);
	}, []);

	// Debounced function to update hexagons based on current viewport
	const updateHexagons = useCallback(() => {
		if (!mapRef.current || !enabled) return;

		const map = mapRef.current;
		const bounds = map.getBounds();

		if (!bounds) {
			console.warn('⚠️ Map bounds not available yet, skipping hexagon fetch');
			return;
		}

		const newBounds: BoundingBox = {
			south: bounds.getSouth(),
			west: bounds.getWest(),
			north: bounds.getNorth(),
			east: bounds.getEast(),
		};

		// Skip if new bounds are within last fetched bounds (zoom in case)
		if (isWithinLastFetchedBounds(newBounds)) {
			console.log('⚡ Skipping hexagon fetch - zooming into already loaded area');
			return;
		}

		// Clear previous timeout
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		// Debounce to avoid hammering the backend during panning/zooming
		debounceTimeoutRef.current = setTimeout(() => {
			console.log('📡 Fetching hexagons for new bounds');
			lastFetchedBoundsRef.current = newBounds;
			fetchHexagons({
				variables: newBounds,
			});
		}, 300);
	}, [mapRef, enabled, fetchHexagons, isWithinLastFetchedBounds]);

	// Setup map layer for hexagons
	const setupHexagonLayer = useCallback(() => {
		if (!mapRef.current) return;

		const map = mapRef.current;

		// Check if source already exists
		if (map.getSource("hexagons")) return;

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
				"line-width": 2,
				"line-opacity": 0.8,
			},
		});

		// Add click handler for hexagons using ref
		const handleHexagonClick = (e: mapboxgl.MapMouseEvent) => {
			if (!e.features || e.features.length === 0) return;

			const feature = e.features[0];
			const hexagonId = feature.properties?.hexagonId;

			if (hexagonId && onHexagonClickRef.current) {
				onHexagonClickRef.current(hexagonId);
			}
		};

		// Add click event listener
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

	// Force refresh hexagons (clears cache and refetches)
	const refetchHexagons = useCallback(() => {
		console.log('🔄 Force refreshing hexagons...');
		clearBoundsCache();
		updateHexagons(); // Trigger immediate fetch
	}, [updateHexagons, clearBoundsCache]);

	return {
		totalHexCount: countData?.myHexagonsCount ?? 0,
		visibleHexCount,
		loading,
		updateHexagons,
		refetchHexagons,
		setupHexagonLayer,
		cleanupHexagonLayer,
		clearBoundsCache,
	};
};
