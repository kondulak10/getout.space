import { H3_RESOLUTION } from '@/constants/map';

interface MapInfoOverlayProps {
	hexCount: number;
	renderTime: number;
	zoomLevel: number;
}

export function MapInfoOverlay({ hexCount, renderTime, zoomLevel }: MapInfoOverlayProps) {
	return (
		<div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
			<h2 className="text-xl font-bold mb-2">🌍 H3 Hexagon Grid Test</h2>
			<div className="text-sm space-y-1 text-gray-700">
				<p>
					<strong>Resolution:</strong> {H3_RESOLUTION} (~65m hexagons)
				</p>
				<p>
					<strong>Rendering:</strong> Viewport-based (dynamic)
				</p>
				<div className="my-2 p-2 bg-blue-50 rounded border border-blue-200">
					<p className="font-semibold text-blue-900">📊 Performance</p>
					<p className="text-blue-800">
						<strong>Hexagons:</strong> {hexCount.toLocaleString()}
					</p>
					<p className="text-blue-800">
						<strong>Render time:</strong> {renderTime.toFixed(2)}ms
					</p>
					<p className="text-blue-800">
						<strong>Zoom level:</strong> {zoomLevel.toFixed(2)}
					</p>
				</div>
				<p>
					<strong>Colors:</strong> 90% random colors
				</p>
				<p>
					<strong>Images:</strong> 10% with circular icon
				</p>
				<p className="text-xs text-gray-500">
					Image hexagons show photo as circular icon
				</p>
				<p className="text-xs mt-2 text-gray-500">
					💡 Zoom in/out and pan to see hexagons update
				</p>
				<p className="text-xs text-gray-500">🖱️ Click hexagons for details</p>
			</div>
		</div>
	);
}
