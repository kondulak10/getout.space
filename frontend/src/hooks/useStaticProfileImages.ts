import { useEffect, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { cellToBoundary } from 'h3-js';
import * as turf from '@turf/turf';
import type { MockData } from '@/utils/mockHexData';

/**
 * Hook to display profile images on hexagons for static test data
 * - Premium users: 1 image per 5 hexagons, max 30 images per user
 * - Regular users: No images (to keep it simple for testing)
 */
export function useStaticProfileImages(
	mapRef: React.RefObject<MapboxMap | null>,
	mockData: MockData | null
) {
	const layersAddedRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		const map = mapRef.current;
		if (!map || !mockData) {
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
					} else {
						// If layer exists, ensure it's on top by moving it
						map.moveLayer(layerId);
					}
				} catch (error) {
					// Silently fail
				}
			};

			// Add images for premium users: 1 photo per 10 hexes, max 10 photos per user
			const premiumHexagons = mockData.hexagons.filter(
				hex => hex.currentOwnerIsPremium && hex.currentOwnerImghex
			);

			// Group by user
			const hexagonsByUser = new Map<string, typeof premiumHexagons>();
			premiumHexagons.forEach(hex => {
				if (!hexagonsByUser.has(hex.currentOwnerId)) {
					hexagonsByUser.set(hex.currentOwnerId, []);
				}
				hexagonsByUser.get(hex.currentOwnerId)!.push(hex);
			});

			const maxImagesPerUser = 30;
			const interval = 5;
			let totalImages = 0;

			// For each premium user, select every 5th hexagon, max 30 images
			hexagonsByUser.forEach((userHexes) => {
				const selectedHexes = userHexes.filter((_, index) => index % interval === 0).slice(0, maxImagesPerUser);

				selectedHexes.forEach((hex) => {
					const uniqueId = `${hex.currentOwnerId}-${hex.hexagonId}`;
					addProfileImage(hex.hexagonId, hex.currentOwnerImghex!, uniqueId);
					totalImages++;
				});
			});

			console.log(`🖼️ Added ${totalImages} profile images for ${hexagonsByUser.size} premium users (1 per 5 hexes, max 30 per user)`);
			console.log(`   Total premium hexagons: ${premiumHexagons.length}, showing images on: ${totalImages}`);
		};

		// Map is ready if hexagons are loaded - just call onMapLoad
		if (map.loaded()) {
			// Wait a bit for hexagon layers to be added first
			setTimeout(onMapLoad, 500);
		} else {
			map.once('load', () => {
				setTimeout(onMapLoad, 500);
			});
		}

		return () => {
			// Cleanup layers when component unmounts
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
	}, [mapRef, mockData]);
}
