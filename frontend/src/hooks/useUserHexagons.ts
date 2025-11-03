import { MyHexagonsCountDocument, MyHexagonsInBboxDocument } from "@/gql/graphql";
import { h3ToGeoJSON } from "@/utils/hexagonUtils";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import type { Map as MapboxMap } from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import React from "react";

interface UseUserHexagonsOptions {
	mapRef: React.RefObject<MapboxMap | null>;
	enabled: boolean;
}

export const useUserHexagons = ({ mapRef, enabled }: UseUserHexagonsOptions) => {
	const [visibleHexCount, setVisibleHexCount] = useState(0);
	const debounceTimeoutRef = React.useRef<number | null>(null);

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

		// Create GeoJSON features from hexagons
		const features = hexagons.map((hex) => {
			const feature = h3ToGeoJSON(hex.hexagonId);
			return {
				...feature,
				properties: {
					...feature.properties,
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

	// Debounced function to update hexagons based on current viewport
	const updateHexagons = useCallback(() => {
		if (!mapRef.current || !enabled) return;

		const map = mapRef.current;
		const bounds = map.getBounds();

		if (!bounds) return;

		// Clear previous timeout
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		// Debounce to avoid hammering the backend during panning/zooming
		debounceTimeoutRef.current = setTimeout(() => {
			fetchHexagons({
				variables: {
					south: bounds.getSouth(),
					west: bounds.getWest(),
					north: bounds.getNorth(),
					east: bounds.getEast(),
				},
			});
		}, 300); // 300ms debounce
	}, [mapRef, enabled, fetchHexagons]);

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
	}, [mapRef]);

	return {
		totalHexCount: countData?.myHexagonsCount ?? 0,
		visibleHexCount,
		loading,
		updateHexagons,
		setupHexagonLayer,
		cleanupHexagonLayer,
	};
};
