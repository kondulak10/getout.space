import { useEffect, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { routeToHexagons, sampleRouteCoordinates } from '@/utils/routeToHexagons';
import { h3ToGeoJSON, getViewportHexagons } from '@/utils/hexagonUtils';

interface RouteHexMapViewProps {
	coordinates: [number, number][]; // [lat, lng] pairs
	className?: string;
	showBackgroundHexagons?: boolean; // Show grid hexagons around route
}

export function RouteHexMapView({ coordinates, className, showBackgroundHexagons = true }: RouteHexMapViewProps) {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const isMapLoadedRef = useRef(false);

	const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

	// Convert route to hexagons (memoized)
	const routeHexagons = useMemo(() => {
		if (coordinates.length === 0) return [];
		// Sample coordinates to reduce density
		const sampled = sampleRouteCoordinates(coordinates, 3);
		return routeToHexagons(sampled);
	}, [coordinates]);

	useEffect(() => {
		if (!mapContainerRef.current || coordinates.length === 0) return;

		mapboxgl.accessToken = mapboxToken;

		// Convert [lat, lng] to [lng, lat] for Mapbox
		const geoJsonCoords = coordinates.map(([lat, lng]) => [lng, lat]);

		// Calculate bounds
		const lngs = geoJsonCoords.map((coord) => coord[0]);
		const lats = geoJsonCoords.map((coord) => coord[1]);

		const minLng = Math.min(...lngs);
		const maxLng = Math.max(...lngs);
		const minLat = Math.min(...lats);
		const maxLat = Math.max(...lats);

		const centerLng = (minLng + maxLng) / 2;
		const centerLat = (minLat + maxLat) / 2;

		// Initialize map
		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: 'mapbox://styles/mapbox/light-v11',
			center: [centerLng, centerLat],
			zoom: 12,
		});

		mapRef.current = map;

		map.on('load', () => {
			isMapLoadedRef.current = true;

			// Create route hexagon features
			const routeHexSet = new Set(routeHexagons);
			const routeFeatures = routeHexagons.map((hex) => {
				const feature = h3ToGeoJSON(hex);
				return {
					...feature,
					properties: {
						...feature.properties,
						isRoute: true,
					},
				};
			});

			// Add hexagon sources
			map.addSource('route-hexagons', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: routeFeatures,
				},
			});

			// Add route hexagon fill layer - highlighted
			map.addLayer({
				id: 'route-hexagon-fills',
				type: 'fill',
				source: 'route-hexagons',
				paint: {
					'fill-color': '#FC4C02', // Strava orange
					'fill-opacity': 0.6,
				},
			});

			// Add route hexagon outline layer
			map.addLayer({
				id: 'route-hexagon-outlines',
				type: 'line',
				source: 'route-hexagons',
				paint: {
					'line-color': '#D93B00',
					'line-width': 2,
					'line-opacity': 0.8,
				},
			});

			// Optionally add background hexagons
			if (showBackgroundHexagons) {
				// Get viewport hexagons
				const updateBackgroundHexagons = () => {
					const viewportHexagons = getViewportHexagons(map);

					// Filter out route hexagons
					const backgroundHexagons = viewportHexagons.filter(
						(hex) => !routeHexSet.has(hex)
					);

					const backgroundFeatures = backgroundHexagons.map((hex) => {
						const feature = h3ToGeoJSON(hex);
						return {
							...feature,
							properties: {
								...feature.properties,
								isRoute: false,
							},
						};
					});

					const source = map.getSource('background-hexagons') as mapboxgl.GeoJSONSource;
					if (source) {
						source.setData({
							type: 'FeatureCollection',
							features: backgroundFeatures,
						});
					}
				};

				// Add background hexagon source
				map.addSource('background-hexagons', {
					type: 'geojson',
					data: {
						type: 'FeatureCollection',
						features: [],
					},
				});

				// Add background hexagon fill layer - muted
				map.addLayer({
					id: 'background-hexagon-fills',
					type: 'fill',
					source: 'background-hexagons',
					paint: {
						'fill-color': '#E0E0E0',
						'fill-opacity': 0.3,
					},
				});

				// Add background hexagon outline layer
				map.addLayer({
					id: 'background-hexagon-outlines',
					type: 'line',
					source: 'background-hexagons',
					paint: {
						'line-color': '#CCCCCC',
						'line-width': 1,
						'line-opacity': 0.3,
					},
				});

				// Bring route hexagons to front
				map.moveLayer('route-hexagon-fills');
				map.moveLayer('route-hexagon-outlines');

				// Initial update
				updateBackgroundHexagons();

				// Update on zoom/move
				map.on('moveend', updateBackgroundHexagons);
				map.on('zoomend', updateBackgroundHexagons);
			}

			// Fit map to route bounds with padding
			map.fitBounds(
				[
					[minLng, minLat],
					[maxLng, maxLat],
				],
				{
					padding: 50,
					duration: 1000,
				}
			);

			// Add info about hexagon count
			console.log(`📍 Route hexagons: ${routeHexagons.length} unique cells`);
		});

		// Cleanup
		return () => {
			map.remove();
		};
	}, [coordinates, mapboxToken, routeHexagons, showBackgroundHexagons]);

	return (
		<div className="relative">
			<div ref={mapContainerRef} className={className} />
			<div className="absolute top-2 right-2 bg-white rounded px-2 py-1 text-xs shadow">
				{routeHexagons.length} hexagons
			</div>
		</div>
	);
}
