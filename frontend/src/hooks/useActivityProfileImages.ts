import { useAuth } from "@/contexts/useAuth";
import { polygon } from "@turf/helpers";
import transformScale from "@turf/transform-scale";
import transformRotate from "@turf/transform-rotate";
import { cellToBoundary } from "h3-js";
import type { Map as MapboxMap, ErrorEvent } from "mapbox-gl";
import { useEffect, useRef } from "react";
interface ActivityHexagons {
	[activityId: string]: string[]; 
}
interface SelectedHexagons {
	[activityId: string]: string; 
}
interface HexagonData {
	hexagonId: string;
	currentOwnerId: string;
	currentOwnerStravaId: number;
	currentOwnerIsPremium: boolean | null;
	currentOwnerImghex: string | null;
	currentStravaActivityId: number;
	activityType: string;
	captureCount: number;
	lastCapturedAt: unknown;
}
const STORAGE_KEY = "activity_profile_image_positions";
export function useActivityProfileImages(
	mapRef: React.RefObject<MapboxMap | null>,
	hexagonsData: HexagonData[] | null,
	isReducedOpacity: boolean
) {
	const { user } = useAuth();
	const layersAddedRef = useRef<Set<string>>(new Set());
	const currentUserLayersRef = useRef<Set<string>>(new Set());
	const markersRef = useRef<mapboxgl.Marker[]>([]);

	const imageOpacity = isReducedOpacity ? 0.5 : 0.9;
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
		const cleanupExistingLayers = () => {
			if (map && map.getStyle()) {
				layersAddedRef.current.forEach((layerId) => {
					try {
						if (map.getLayer(layerId)) {
							map.removeLayer(layerId);
						}
						const sourceId = layerId.replace("profile-image-", "profile-image-source-");
						if (map.getSource(sourceId)) {
							map.removeSource(sourceId);
						}
					} catch {
						// Layer/source may not exist, ignore error
					}
				});
			}
			layersAddedRef.current.clear();
			currentUserLayersRef.current.clear();
		};
		cleanupExistingLayers();
		const onMapLoad = () => {
			const addProfileImage = (hexagonId: string, imageUrl: string, uniqueId: string, isCurrentUser: boolean) => {
				const layerId = `profile-image-${uniqueId}`;
				const sourceId = `profile-image-source-${uniqueId}`;
				if (layersAddedRef.current.has(layerId)) {
					return;
				}
				try {
					const boundary = cellToBoundary(hexagonId, true); 
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
					const bbox = polygon([
						[
							[minLng, maxLat], 
							[maxLng, maxLat], 
							[maxLng, minLat], 
							[minLng, minLat], 
							[minLng, maxLat], 
						],
					]);
					const scaledBbox = transformScale(bbox, 0.8);
					const rotatedBbox = transformRotate(scaledBbox, 20);
					const rotatedCoords = rotatedBbox.geometry.coordinates[0];
					const imageBounds: [
						[number, number],
						[number, number],
						[number, number],
						[number, number],
					] = [
						[rotatedCoords[0][0], rotatedCoords[0][1]], 
						[rotatedCoords[1][0], rotatedCoords[1][1]], 
						[rotatedCoords[2][0], rotatedCoords[2][1]], 
						[rotatedCoords[3][0], rotatedCoords[3][1]], 
					];
					if (!map.getSource(sourceId)) {
						map.addSource(sourceId, {
							type: "image",
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
									map.off("error", errorHandler);
								} catch {
									// Cleanup may fail if already removed
								}
							}
						};
						map.on("error", errorHandler);
					}
					if (!map.getLayer(layerId)) {
						const opacity = isCurrentUser ? 0.9 : imageOpacity;
						map.addLayer({
							id: layerId,
							type: "raster",
							source: sourceId,
							paint: {
								"raster-opacity": opacity,
							},
						});
						layersAddedRef.current.add(layerId);
						if (isCurrentUser) {
							currentUserLayersRef.current.add(layerId);
						}
					} else {
						map.moveLayer(layerId);
					}
				} catch {
					// Failed to add profile image layer
				}
			};
			const userHexagons: {
				[userId: string]: { isPremium: boolean; imghex?: string; hexagons: HexagonData[] };
			} = {};
			hexagonsData.forEach((hex: HexagonData) => {
				const userId = hex.currentOwnerId;
				const imghex = hex.currentOwnerImghex;
				const isPremium = hex.currentOwnerIsPremium || false;
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
			const storedSelections = localStorage.getItem(STORAGE_KEY);
			const selectedHexagons: SelectedHexagons = storedSelections
				? JSON.parse(storedSelections)
				: {};
			Object.entries(userHexagons).forEach(([userId, userData]) => {
				const { isPremium, imghex, hexagons: userHexes } = userData;
				if (!imghex) return;
				const isCurrentUser = userId === user?.id;
				const activityHexagons: ActivityHexagons = {};
				userHexes.forEach((hex: HexagonData) => {
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
					const intervalPerActivity = 20;
					const maxImagesPerActivity = 5;
					Object.keys(activityHexagons).forEach((activityId) => {
						const hexagons = activityHexagons[activityId];
						const numImages = Math.min(
							Math.ceil(hexagons.length / intervalPerActivity),
							maxImagesPerActivity
						);
						for (let i = 0; i < numImages; i++) {
							const index = Math.floor((i * hexagons.length) / numImages);
							const hexagonId = hexagons[index];
							const uniqueId = `${userId}-${activityId}-${i}`;
							const imageUrlWithCacheBust = `${imghex}?t=${cacheBustTimestamp}`;
							addProfileImage(hexagonId, imageUrlWithCacheBust, uniqueId, isCurrentUser);
						}
					});
				} else {
					Object.keys(activityHexagons).forEach((activityId) => {
						const hexagons = activityHexagons[activityId];
						if (!selectedHexagons[activityId] || !hexagons.includes(selectedHexagons[activityId])) {
							const randomIndex = Math.floor(Math.random() * hexagons.length);
							selectedHexagons[activityId] = hexagons[randomIndex];
						}
						const hexagonId = selectedHexagons[activityId];
						const uniqueId = `${userId}-${activityId}`;
						const imageUrlWithCacheBust = `${imghex}?t=${cacheBustTimestamp}`;
						addProfileImage(hexagonId, imageUrlWithCacheBust, uniqueId, isCurrentUser);
					});
					localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedHexagons));
				}
			});
		};
		onMapLoad();
		// Capture refs at start of effect for cleanup
		const capturedMap = map;
		const layersAdded = layersAddedRef;
		const currentUserLayers = currentUserLayersRef;
		return () => {
			markersRef.current.forEach((marker) => marker.remove());
			markersRef.current = [];
			// Use captured refs for cleanup
			const layersToRemove = new Set(layersAdded.current);
			if (capturedMap && capturedMap.getStyle()) {
				layersToRemove.forEach((layerId) => {
					try {
						if (capturedMap.getLayer(layerId)) {
							capturedMap.removeLayer(layerId);
						}
						const sourceId = layerId.replace("profile-image-", "profile-image-source-");
						if (capturedMap.getSource(sourceId)) {
							capturedMap.removeSource(sourceId);
						}
					} catch {
						// Cleanup may fail if already removed
					}
				});
			}
			layersAdded.current.clear();
			currentUserLayers.current.clear();
		};
		// user?.id is used for determining current user layers but doesn't need to trigger re-render
		// since user?.profile.imghex already covers user changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mapRef, hexagonsData, user?.profile.imghex, imageOpacity]);

	// Update layer opacity when isReducedOpacity changes (only for other users' images)
	useEffect(() => {
		const map = mapRef.current;
		if (!map || layersAddedRef.current.size === 0) return;

		layersAddedRef.current.forEach((layerId) => {
			// Skip current user's layers - they always stay at full opacity
			if (currentUserLayersRef.current.has(layerId)) return;

			try {
				if (map.getLayer(layerId)) {
					map.setPaintProperty(layerId, "raster-opacity", imageOpacity);
				}
			} catch (error) {
				// Layer might not exist yet, ignore
				console.debug("Failed to update image opacity:", error);
			}
		});
	}, [isReducedOpacity, mapRef, imageOpacity]);
}
