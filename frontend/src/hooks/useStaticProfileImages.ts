import { useEffect, useRef } from 'react';
import type { Map as MapboxMap, ErrorEvent } from 'mapbox-gl';
import { cellToBoundary } from 'h3-js';
import { polygon } from '@turf/helpers';
import transformScale from '@turf/transform-scale';
import transformRotate from '@turf/transform-rotate';
import type { MockData } from '@/utils/mockHexData';

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
			const addProfileImage = (hexagonId: string, imageUrl: string, uniqueId: string) => {
				const layerId = `profile-image-${uniqueId}`;
				const sourceId = `profile-image-source-${uniqueId}`;

				if (layersAddedRef.current.has(layerId)) {
					return;
				}

				try {
					const boundary = cellToBoundary(hexagonId, true);

					let minLat = Infinity, maxLat = -Infinity;
					let minLng = Infinity, maxLng = -Infinity;

					boundary.forEach(([lng, lat]) => {
						minLat = Math.min(minLat, lat);
						maxLat = Math.max(maxLat, lat);
						minLng = Math.min(minLng, lng);
						maxLng = Math.max(maxLng, lng);
					});

					const bbox = polygon([[
						[minLng, maxLat],
						[maxLng, maxLat],
						[maxLng, minLat],
						[minLng, minLat],
						[minLng, maxLat],
					]]);

					const scaledBbox = transformScale(bbox, 0.8);

					const rotatedBbox = transformRotate(scaledBbox, 20);

					const rotatedCoords = rotatedBbox.geometry.coordinates[0];
					const imageBounds: [[number, number], [number, number], [number, number], [number, number]] = [
						[rotatedCoords[0][0], rotatedCoords[0][1]],
						[rotatedCoords[1][0], rotatedCoords[1][1]],
						[rotatedCoords[2][0], rotatedCoords[2][1]],
						[rotatedCoords[3][0], rotatedCoords[3][1]],
					];

					if (!map.getSource(sourceId)) {
						map.addSource(sourceId, {
							type: 'image',
							url: imageUrl,
							coordinates: imageBounds,
						});

						const errorHandler = (e: ErrorEvent & { sourceId?: string }) => {
							if (e.sourceId === sourceId) {
								try {
									if (map.getLayer(layerId)) {
										map.removeLayer(layerId);
									}
									if (map.getSource(sourceId)) {
										map.removeSource(sourceId);
									}
									layersAddedRef.current.delete(layerId);
									map.off('error', errorHandler);

								} catch {
									// Cleanup may fail if already removed
								}
							}
						};

						map.on('error', errorHandler);
					}

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
						map.moveLayer(layerId);
					}

				} catch {
					// Failed to add profile image layer
				}
			};

			const premiumHexagons = mockData.hexagons.filter(
				hex => hex.currentOwnerIsPremium && hex.currentOwnerImghex
			);

			const hexagonsByUser = new Map<string, typeof premiumHexagons>();
			premiumHexagons.forEach(hex => {
				if (!hexagonsByUser.has(hex.currentOwnerId)) {
					hexagonsByUser.set(hex.currentOwnerId, []);
				}
				hexagonsByUser.get(hex.currentOwnerId)!.push(hex);
			});

			const maxImagesPerUser = 30;
			const interval = 5;
			
	
			const imageDetails: Array<{ userId: string; imageUrl: string; count: number; totalHexagons: number }> = [];

			hexagonsByUser.forEach((userHexes) => {
				const selectedHexes = userHexes.filter((_, index) => index % interval === 0).slice(0, maxImagesPerUser);

				const cacheBustTimestamp = Date.now();
				const firstHex = userHexes[0];
				selectedHexes.forEach((hex) => {
					const uniqueId = `${hex.currentOwnerId}-${hex.hexagonId}`;
					const imageUrlWithCacheBust = `${hex.currentOwnerImghex}?t=${cacheBustTimestamp}`;
					addProfileImage(hex.hexagonId, imageUrlWithCacheBust, uniqueId);
				});

				imageDetails.push({
					userId: firstHex.currentOwnerId,
					imageUrl: `${firstHex.currentOwnerImghex}?t=${cacheBustTimestamp}`,
					count: selectedHexes.length,
					totalHexagons: userHexes.length,
				});
			});
		};

		if (map.loaded()) {
			setTimeout(onMapLoad, 500);
		} else {
			map.once('load', () => {
				setTimeout(onMapLoad, 500);
			});
		}

		// Capture refs at start of effect for cleanup
		const capturedMap = map;
		const layersAdded = layersAddedRef;
		return () => {
			// Use captured refs for cleanup
			const layersToRemove = new Set(layersAdded.current);
			if (capturedMap && capturedMap.getStyle()) {
				layersToRemove.forEach((layerId) => {
					try {
						if (capturedMap.getLayer(layerId)) {
							capturedMap.removeLayer(layerId);
						}
						const sourceId = layerId.replace('profile-image-', 'profile-image-source-');
						if (capturedMap.getSource(sourceId)) {
							capturedMap.removeSource(sourceId);
						}
					} catch {
						// Cleanup may fail if already removed
					}
				});
			}
			layersAdded.current.clear();
		};
	}, [mapRef, mockData]);
}
