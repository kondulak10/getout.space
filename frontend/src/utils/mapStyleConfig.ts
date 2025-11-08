import type { Map as MapboxMap } from 'mapbox-gl';

const styledMaps = new WeakSet<MapboxMap>();

export function configureMapStyle(map: MapboxMap) {
	if (styledMaps.has(map)) {
		return;
	}
	styledMaps.add(map);

	map.once('load', () => {
		map.setPitch(0);

		const layers = map.getStyle().layers;
		if (layers) {
			let labelLayerId;
			for (const layer of layers) {
				if (layer.type === 'symbol' && layer.layout && 'text-field' in layer.layout) {
					labelLayerId = layer.id;
					break;
				}
			}

			if (!map.getLayer('3d-buildings')) {
				map.addLayer(
					{
						id: '3d-buildings',
						source: 'composite',
						'source-layer': 'building',
						filter: ['==', 'extrude', 'true'],
						type: 'fill-extrusion',
						minzoom: 14,
						maxzoom: 18,
						paint: {
							'fill-extrusion-color': '#000000',
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

		const styleLayers = map.getStyle().layers;
		if (styleLayers) {
			styleLayers.forEach((layer) => {
				if (
					layer.id.includes('hexagon') ||
					layer.id.includes('profile-image') ||
					layer.id.includes('parent-') ||
					layer.id.includes('activity')
				) {
					return;
				}

				try {
					if (layer.type === 'background') {
						map.setPaintProperty(layer.id, 'background-color', '#121212');
					} else if (layer.type === 'fill') {
						const currentColor = map.getPaintProperty(layer.id, 'fill-color');
						if (currentColor) {
							if (layer.id.includes('building')) {
								map.setPaintProperty(layer.id, 'fill-color', '#050505');
								map.setPaintProperty(layer.id, 'fill-opacity', 0.9);
							}
							else if (layer.id.includes('water')) {
								map.setPaintProperty(layer.id, 'fill-color', '#0a0a0a');
								map.setPaintProperty(layer.id, 'fill-opacity', 0.7);
							}
							else {
								map.setPaintProperty(layer.id, 'fill-color', '#1e1e1e');
								map.setPaintProperty(layer.id, 'fill-opacity', 0.6);
							}
						}
					} else if (layer.type === 'line') {
						const currentColor = map.getPaintProperty(layer.id, 'line-color');
						if (currentColor && typeof currentColor === 'string') {
							if (
								layer.id.includes('path') ||
								layer.id.includes('service') ||
								layer.id.includes('track') ||
								layer.id.includes('pedestrian') ||
								layer.id.includes('footway')
							) {
								map.setPaintProperty(layer.id, 'line-opacity', 0);
							}
							else if (layer.id.includes('major') || layer.id.includes('primary') || layer.id.includes('motorway')) {
								map.setPaintProperty(layer.id, 'line-color', '#888888');
								map.setPaintProperty(layer.id, 'line-opacity', 0.9);
							}
							else {
								map.setPaintProperty(layer.id, 'line-color', '#666666');
								map.setPaintProperty(layer.id, 'line-opacity', 0.7);
							}
						}
					} else if (layer.type === 'symbol') {
						if (layer.layout && 'text-field' in layer.layout) {
							map.setPaintProperty(layer.id, 'text-color', '#cccccc');
							map.setPaintProperty(layer.id, 'text-halo-color', '#000000');
							map.setPaintProperty(layer.id, 'text-halo-width', 2);
						}
					}
				} catch (error) {
				}
			});
		}
	});
}
