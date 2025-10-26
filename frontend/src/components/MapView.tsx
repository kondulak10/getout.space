import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
	coordinates: [number, number][]; // [lat, lng] pairs
	className?: string;
}

export function MapView({ coordinates, className }: MapViewProps) {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);

	const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

	useEffect(() => {
		if (!mapContainerRef.current || coordinates.length === 0) return;

		// Set Mapbox access token
		mapboxgl.accessToken = mapboxToken;

		// Convert [lat, lng] to [lng, lat] for GeoJSON (Mapbox uses lng, lat order)
		const geoJsonCoords = coordinates.map(([lat, lng]) => [lng, lat]);

		// Calculate bounds
		const lngs = geoJsonCoords.map((coord) => coord[0]);
		const lats = geoJsonCoords.map((coord) => coord[1]);

		const minLng = Math.min(...lngs);
		const maxLng = Math.max(...lngs);
		const minLat = Math.min(...lats);
		const maxLat = Math.max(...lats);

		// Calculate center
		const centerLng = (minLng + maxLng) / 2;
		const centerLat = (minLat + maxLat) / 2;

		// Initialize map
		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: 'mapbox://styles/mapbox/outdoors-v12',
			center: [centerLng, centerLat],
			zoom: 12,
		});

		mapRef.current = map;

		map.on('load', () => {
			// Add route source
			map.addSource('route', {
				type: 'geojson',
				data: {
					type: 'Feature',
					properties: {},
					geometry: {
						type: 'LineString',
						coordinates: geoJsonCoords,
					},
				},
			});

			// Add route layer
			map.addLayer({
				id: 'route-line',
				type: 'line',
				source: 'route',
				layout: {
					'line-join': 'round',
					'line-cap': 'round',
				},
				paint: {
					'line-color': '#FC4C02',
					'line-width': 3,
					'line-opacity': 0.8,
				},
			});

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
		});

		// Cleanup
		return () => {
			map.remove();
		};
	}, [coordinates, mapboxToken]);

	return <div ref={mapContainerRef} className={className} />;
}
