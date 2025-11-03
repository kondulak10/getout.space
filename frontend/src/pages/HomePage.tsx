import { useMapbox } from '@/hooks/useMapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export function HomePage() {
	const { mapContainerRef } = useMapbox({
		style: 'mapbox://styles/mapbox/outdoors-v12',
		center: [-98.5795, 39.8283],
		zoom: 3,
	});

	return (
		<div className="relative w-full h-screen">
			<div ref={mapContainerRef} className="w-full h-full" />
		</div>
	);
}
