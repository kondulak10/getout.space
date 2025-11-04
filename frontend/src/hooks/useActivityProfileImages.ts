import { useEffect, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { cellToBoundary } from 'h3-js';
import { useAuth } from '@/contexts/useAuth';
import * as turf from '@turf/turf';

interface ActivityHexagons {
	[activityId: string]: string[]; // activityId -> hexagonIds
}

interface SelectedHexagons {
	[activityId: string]: string; // activityId -> selected hexagonId
}

const STORAGE_KEY = 'activity_profile_image_positions';

/**
 * Hook to display user profile images on hexagons
 * Places one profile image per activity on a randomly selected hexagon
 */
export function useActivityProfileImages(
	mapRef: React.RefObject<MapboxMap | null>,
	hexagonsData: any[] | null
) {
	const { user } = useAuth();
	const layersAddedRef = useRef<Set<string>>(new Set());
	const markersRef = useRef<mapboxgl.Marker[]>([]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) {
			return;
		}
		if (!hexagonsData) {
			return;
		}
		if (!user?.profile.imghex) {
			return;
		}

		const onMapLoad = () => {

			// Group hexagons by activityId
			const activityHexagons: ActivityHexagons = {};

			hexagonsData.forEach((hex: any) => {
				if (hex.currentStravaActivityId) {
					const activityId = hex.currentStravaActivityId.toString();
					if (!activityHexagons[activityId]) {
						activityHexagons[activityId] = [];
					}
					activityHexagons[activityId].push(hex.hexagonId);
				}
			});

			// Load or create selected hexagons for each activity
			const storedSelections = localStorage.getItem(STORAGE_KEY);
			const selectedHexagons: SelectedHexagons = storedSelections
				? JSON.parse(storedSelections)
				: {};

			// For each activity, pick one hexagon
			Object.keys(activityHexagons).forEach((activityId) => {
				const hexagons = activityHexagons[activityId];

				// Check if we already have a selection for this activity
				if (!selectedHexagons[activityId] || !hexagons.includes(selectedHexagons[activityId])) {
					// Pick random hexagon from this activity
					const randomIndex = Math.floor(Math.random() * hexagons.length);
					selectedHexagons[activityId] = hexagons[randomIndex];
				}
			});

			// Save selections to localStorage
			localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedHexagons));

			// Add profile images to map (ONLY for currently loaded activities)
			Object.entries(selectedHexagons).forEach(([activityId, hexagonId]) => {
				// Skip if this activity is not in the currently loaded hexagons
				if (!activityHexagons[activityId]) {
					return;
				}

				const layerId = `profile-image-${activityId}`;
				const sourceId = `profile-image-source-${activityId}`;

				// Skip if already added
				if (layersAddedRef.current.has(layerId)) {
					return;
				}

				try {
					// Get hexagon boundary (6 vertices)
					const boundary = cellToBoundary(hexagonId, true); // GeoJSON format = [lng, lat]

					// Calculate bounding box from the 6 vertices
					let minLat = Infinity, maxLat = -Infinity;
					let minLng = Infinity, maxLng = -Infinity;

					boundary.forEach(([lng, lat]) => {
						minLat = Math.min(minLat, lat);
						maxLat = Math.max(maxLat, lat);
						minLng = Math.min(minLng, lng);
						maxLng = Math.max(maxLng, lng);
					});

					// Create bounding box polygon
					const bbox = turf.polygon([[
						[minLng, maxLat], // top-left
						[maxLng, maxLat], // top-right
						[maxLng, minLat], // bottom-right
						[minLng, minLat], // bottom-left
						[minLng, maxLat], // close the polygon
					]]);

					// Scale down by 10% (make it 90% of original size)
					const scaledBbox = turf.transformScale(bbox, 0.9);

					// Rotate the polygon by 20 degrees
					const rotatedBbox = turf.transformRotate(scaledBbox, 20);

					// Extract the rotated coordinates (first 4 points, excluding the closing point)
					const rotatedCoords = rotatedBbox.geometry.coordinates[0];
					const imageBounds: [[number, number], [number, number], [number, number], [number, number]] = [
						[rotatedCoords[0][0], rotatedCoords[0][1]], // top-left
						[rotatedCoords[1][0], rotatedCoords[1][1]], // top-right
						[rotatedCoords[2][0], rotatedCoords[2][1]], // bottom-right
						[rotatedCoords[3][0], rotatedCoords[3][1]], // bottom-left
					];

					// Add cache-busting parameter to help with image loading issues
					const imageUrl = `${user.profile.imghex}?t=${Date.now()}`;

					// Add image source with error handling
					if (!map.getSource(sourceId)) {
						map.addSource(sourceId, {
							type: 'image',
							url: imageUrl,
							coordinates: imageBounds,
						});

						// Listen for source errors and clean up failed loads
						const errorHandler = (e: any) => {
							if (e.sourceId === sourceId || e.source?.id === sourceId) {
								// Image loading failed, removing from map
								// Remove failed source/layer to prevent further errors
								try {
									if (map.getLayer(layerId)) {
										map.removeLayer(layerId);
									}
									if (map.getSource(sourceId)) {
										map.removeSource(sourceId);
									}
									layersAddedRef.current.delete(layerId);
									map.off('error', errorHandler);
								} catch (cleanupError) {
									// Silently fail
								}
							}
						};

						map.on('error', errorHandler);
					}

					// Add image layer (make sure it's on top)
					if (!map.getLayer(layerId)) {
						map.addLayer({
							id: layerId,
							type: 'raster',
							source: sourceId,
							paint: {
								'raster-opacity': 0.9,
							},
						});

						layersAddedRef.current.add(layerId);
					}
				} catch (error) {
					// Silently fail
				}
			});
		};

		// Map is ready if hexagons are loaded - just call onMapLoad
		// The load event already fired when the map was first created
		onMapLoad();

		return () => {
			// No need to clean up load event since we're not listening to it

			// Cleanup markers
			markersRef.current.forEach(marker => marker.remove());
			markersRef.current = [];

			// Cleanup layers when component unmounts
			// Check if map is still valid before cleaning up
			const currentMap = mapRef.current;
			if (currentMap && currentMap.getStyle()) {
				layersAddedRef.current.forEach((layerId) => {
					try {
						if (currentMap.getLayer(layerId)) {
							currentMap.removeLayer(layerId);
						}
						const sourceId = layerId.replace('profile-image-', 'profile-image-source-');
						if (currentMap.getSource(sourceId)) {
							currentMap.removeSource(sourceId);
						}
					} catch (error) {
						// Silently fail cleanup
					}
				});
			}
			layersAddedRef.current.clear();
		};
	}, [mapRef, hexagonsData, user?.profile.imghex]);
}
