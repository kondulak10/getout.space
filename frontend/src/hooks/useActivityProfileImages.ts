import { useAuth } from "@/contexts/useAuth";
import * as turf from "@turf/turf";
import { cellToBoundary } from "h3-js";
import type { Map as MapboxMap } from "mapbox-gl";
import { useEffect, useRef } from "react";

interface ActivityHexagons {
	[activityId: string]: string[]; // activityId -> hexagonIds
}

interface SelectedHexagons {
	[activityId: string]: string; // activityId -> selected hexagonId
}

const STORAGE_KEY = "activity_profile_image_positions";

/**
 * Hook to display user profile images on hexagons
 * - Regular users: Places one profile image per activity on a randomly selected hexagon
 * - Premium users: Places profile image on ALL their hexagons
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
			// Helper function to add profile image to a hexagon
			const addProfileImage = (hexagonId: string, imageUrl: string, uniqueId: string) => {
				const layerId = `profile-image-${uniqueId}`;
				const sourceId = `profile-image-source-${uniqueId}`;

				// Skip if already added
				if (layersAddedRef.current.has(layerId)) {
					return;
				}

				try {
					// Get hexagon boundary (6 vertices)
					const boundary = cellToBoundary(hexagonId, true); // GeoJSON format = [lng, lat]

					// Calculate bounding box from the 6 vertices
					let minLat = Infinity,
						maxLat = -Infinity;
					let minLng = Infinity,
						maxLng = -Infinity;

					boundary.forEach(([lng, lat]) => {
						minLat = Math.min(minLat, lat);
						maxLat = Math.max(maxLat, lat);
						minLng = Math.min(minLng, lng);
						maxLng = Math.max(maxLng, lng);
					});

					// Create bounding box polygon
					const bbox = turf.polygon([
						[
							[minLng, maxLat], // top-left
							[maxLng, maxLat], // top-right
							[maxLng, minLat], // bottom-right
							[minLng, minLat], // bottom-left
							[minLng, maxLat], // close the polygon
						],
					]);

					// Scale down by 10% (make it 90% of original size)
					const scaledBbox = turf.transformScale(bbox, 0.9);

					// Rotate the polygon by 20 degrees
					const rotatedBbox = turf.transformRotate(scaledBbox, 20);

					// Extract the rotated coordinates (first 4 points, excluding the closing point)
					const rotatedCoords = rotatedBbox.geometry.coordinates[0];
					const imageBounds: [
						[number, number],
						[number, number],
						[number, number],
						[number, number],
					] = [
						[rotatedCoords[0][0], rotatedCoords[0][1]], // top-left
						[rotatedCoords[1][0], rotatedCoords[1][1]], // top-right
						[rotatedCoords[2][0], rotatedCoords[2][1]], // bottom-right
						[rotatedCoords[3][0], rotatedCoords[3][1]], // bottom-left
					];

					// Add image source with error handling
					if (!map.getSource(sourceId)) {
						map.addSource(sourceId, {
							type: "image",
							url: imageUrl,
							coordinates: imageBounds,
						});

						// Listen for source errors and clean up failed loads
						const errorHandler = (e: any) => {
							if (e.sourceId === sourceId || e.source?.id === sourceId) {
								// Image loading failed, removing from map
								try {
									if (map.getLayer(layerId)) {
										map.removeLayer(layerId);
									}
									if (map.getSource(sourceId)) {
										map.removeSource(sourceId);
									}
									layersAddedRef.current.delete(layerId);
									map.off("error", errorHandler);
								// eslint-disable-next-line @typescript-eslint/no-unused-vars
								} catch (_cleanupError) {
									// Ignore error
								}
							}
						};

						map.on("error", errorHandler);
					}

					// Add image layer (make sure it's on top)
					if (!map.getLayer(layerId)) {
						map.addLayer({
							id: layerId,
							type: "raster",
							source: sourceId,
							paint: {
								"raster-opacity": 0.9,
							},
						});

						layersAddedRef.current.add(layerId);
					} else {
						// If layer exists, ensure it's on top by moving it
						map.moveLayer(layerId);
					}
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				} catch (_error) {
					// Ignore error
				}
			};

			// Group hexagons by user (using denormalized fields from backend)
			const userHexagons: {
				[userId: string]: { isPremium: boolean; imghex?: string; hexagons: any[] };
			} = {};

			hexagonsData.forEach((hex: any) => {
				const userId = hex.currentOwnerId;
				const imghex = hex.currentOwnerImghex;
				const isPremium = hex.currentOwnerIsPremium || false;

				// Only include users who have profile images (denormalized in backend)
				if (imghex) {
					if (!userHexagons[userId]) {
						userHexagons[userId] = {
							isPremium,
							imghex,
							hexagons: [],
						};
					}
					userHexagons[userId].hexagons.push(hex);
				}
			});

			// Load or create selected hexagons for each activity (for non-premium users)
			const storedSelections = localStorage.getItem(STORAGE_KEY);
			const selectedHexagons: SelectedHexagons = storedSelections
				? JSON.parse(storedSelections)
				: {};

			Object.entries(userHexagons).forEach(([userId, userData]) => {
				const { isPremium, imghex, hexagons: userHexes } = userData;

				if (!imghex) return;

				// Group hexagons by activity for BOTH premium and non-premium users
				const activityHexagons: ActivityHexagons = {};
				userHexes.forEach((hex: any) => {
					if (hex.currentStravaActivityId) {
						const activityId = hex.currentStravaActivityId.toString();
						if (!activityHexagons[activityId]) {
							activityHexagons[activityId] = [];
						}
						activityHexagons[activityId].push(hex.hexagonId);
					}
				});

				const cacheBustTimestamp = Date.now();

				if (isPremium) {
					// Premium users: Multiple images per activity (route)
					// 1 image per 20 hexagons, max 5 images per activity
					const intervalPerActivity = 20;
					const maxImagesPerActivity = 5;

					Object.keys(activityHexagons).forEach((activityId) => {
						const hexagons = activityHexagons[activityId];
						const numImages = Math.min(
							Math.ceil(hexagons.length / intervalPerActivity),
							maxImagesPerActivity
						);

						// Select evenly distributed hexagons across the activity
						for (let i = 0; i < numImages; i++) {
							const index = Math.floor((i * hexagons.length) / numImages);
							const hexagonId = hexagons[index];
							const uniqueId = `${userId}-${activityId}-${i}`;
							const imageUrlWithCacheBust = `${imghex}?t=${cacheBustTimestamp}`;
							addProfileImage(hexagonId, imageUrlWithCacheBust, uniqueId);
						}
					});
				} else {
					// Non-premium users: 1 image per activity (randomly placed, persisted in localStorage)
					Object.keys(activityHexagons).forEach((activityId) => {
						const hexagons = activityHexagons[activityId];

						// Check if we already have a selection for this activity
						if (!selectedHexagons[activityId] || !hexagons.includes(selectedHexagons[activityId])) {
							// Pick random hexagon from this activity
							const randomIndex = Math.floor(Math.random() * hexagons.length);
							selectedHexagons[activityId] = hexagons[randomIndex];
						}

						// Add image to selected hexagon
						const hexagonId = selectedHexagons[activityId];
						const uniqueId = `${userId}-${activityId}`;
						const imageUrlWithCacheBust = `${imghex}?t=${cacheBustTimestamp}`;
						addProfileImage(hexagonId, imageUrlWithCacheBust, uniqueId);
					});

					// Save selections to localStorage
					localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedHexagons));
				}
			});
		};

		// Map is ready if hexagons are loaded - just call onMapLoad
		// The load event already fired when the map was first created
		onMapLoad();

		return () => {
			// No need to clean up load event since we're not listening to it

			// Cleanup markers
			markersRef.current.forEach((marker) => marker.remove());
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
						const sourceId = layerId.replace("profile-image-", "profile-image-source-");
						if (currentMap.getSource(sourceId)) {
							currentMap.removeSource(sourceId);
						}
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					} catch (_error) {
						// Ignore error
					}
				});
			}
			layersAddedRef.current.clear();
		};
	}, [mapRef, hexagonsData, user?.profile.imghex]);
}
