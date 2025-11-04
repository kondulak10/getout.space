import type { Map as MapboxMap } from 'mapbox-gl';

// Track if map has been styled to prevent duplicate styling
const styledMaps = new WeakSet<MapboxMap>();

/**
 * Configure map for dark, monochrome, flat appearance with 3D buildings
 * High contrast between roads and ground
 * 3D buildings create depth even from top-down view
 * Makes base layers subtle so hexagons stand out
 * Only runs once per map instance for performance
 */
export function configureMapStyle(map: MapboxMap) {
	// Prevent duplicate styling
	if (styledMaps.has(map)) {
		return;
	}
	styledMaps.add(map);

	map.once('load', () => {
		// Disable pitch/skew - keep map flat
		map.setPitch(0);

		// Add 3D buildings layer (looks good even from top-down view)
		const layers = map.getStyle().layers;
		if (layers) {
			// Find where to insert 3D buildings (before labels)
			let labelLayerId;
			for (const layer of layers) {
				if (layer.type === 'symbol' && layer.layout && 'text-field' in layer.layout) {
					labelLayerId = layer.id;
					break;
				}
			}

			// Add 3D buildings if not already present
			if (!map.getLayer('3d-buildings')) {
				map.addLayer(
					{
						id: '3d-buildings',
						source: 'composite',
						'source-layer': 'building',
						filter: ['==', 'extrude', 'true'],
						type: 'fill-extrusion',
						minzoom: 14,
						maxzoom: 18, // Hide at very high zoom
						paint: {
							'fill-extrusion-color': '#000000', // Black buildings for contrast
							'fill-extrusion-height': [
								'interpolate',
								['linear'],
								['zoom'],
								14,
								0,
								14.05,
								['get', 'height'],
							],
							'fill-extrusion-base': [
								'interpolate',
								['linear'],
								['zoom'],
								14,
								0,
								14.05,
								['get', 'min_height'],
							],
							'fill-extrusion-opacity': 0.8,
						},
					},
					labelLayerId
				);
			}
		}

		// Make map more monochrome by desaturating colors
		const styleLayers = map.getStyle().layers;
		if (styleLayers) {
			styleLayers.forEach((layer) => {
				// Skip our own layers (hexagons, profile images, activity layers)
				if (
					layer.id.includes('hexagon') ||
					layer.id.includes('profile-image') ||
					layer.id.includes('parent-') ||
					layer.id.includes('activity')
				) {
					return;
				}

				// Only modify base map layers, not user-added layers
				try {
					// Style background layers
					if (layer.type === 'background') {
						map.setPaintProperty(layer.id, 'background-color', '#121212'); // Dark background
					} else if (layer.type === 'fill') {
						// Land/water fills - darker with high contrast
						const currentColor = map.getPaintProperty(layer.id, 'fill-color');
						if (currentColor) {
							// Buildings - make them darker to stand out
							if (layer.id.includes('building')) {
								map.setPaintProperty(layer.id, 'fill-color', '#050505'); // Very dark buildings
								map.setPaintProperty(layer.id, 'fill-opacity', 0.9);
							}
							// Water
							else if (layer.id.includes('water')) {
								map.setPaintProperty(layer.id, 'fill-color', '#0a0a0a'); // Very dark water
								map.setPaintProperty(layer.id, 'fill-opacity', 0.7);
							}
							// Land
							else {
								map.setPaintProperty(layer.id, 'fill-color', '#1e1e1e'); // Dark land
								map.setPaintProperty(layer.id, 'fill-opacity', 0.6);
							}
						}
					} else if (layer.type === 'line') {
						// Roads and streets - lighter for high contrast, hide smallest paths
						const currentColor = map.getPaintProperty(layer.id, 'line-color');
						if (currentColor && typeof currentColor === 'string') {
							// Hide smallest paths (footpaths, service roads, minor trails)
							if (
								layer.id.includes('path') ||
								layer.id.includes('service') ||
								layer.id.includes('track') ||
								layer.id.includes('pedestrian') ||
								layer.id.includes('footway')
							) {
								map.setPaintProperty(layer.id, 'line-opacity', 0); // Hide smallest roads
							}
							// Major roads much brighter
							else if (layer.id.includes('major') || layer.id.includes('primary') || layer.id.includes('motorway')) {
								map.setPaintProperty(layer.id, 'line-color', '#888888'); // Bright gray
								map.setPaintProperty(layer.id, 'line-opacity', 0.9);
							}
							// Regular roads visible
							else {
								map.setPaintProperty(layer.id, 'line-color', '#666666'); // Medium-bright gray
								map.setPaintProperty(layer.id, 'line-opacity', 0.7);
							}
						}
					} else if (layer.type === 'symbol') {
						// Labels - bright for readability
						if (layer.layout && 'text-field' in layer.layout) {
							map.setPaintProperty(layer.id, 'text-color', '#cccccc'); // Bright labels
							map.setPaintProperty(layer.id, 'text-halo-color', '#000000');
							map.setPaintProperty(layer.id, 'text-halo-width', 2);
						}
					}
				} catch (error) {
					// Silently skip layers that can't be modified
					console.debug(`Could not style layer ${layer.id}:`, error);
				}
			});
		}
	});
}
