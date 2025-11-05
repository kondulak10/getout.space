import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useMapbox } from '@/hooks/useMapbox';
import { useStaticHexagons } from '@/hooks/useStaticHexagons';
import { useStaticProfileImages } from '@/hooks/useStaticProfileImages';
import { loadTestData } from '@/utils/loadTestData';
import type { MockData, MockHexagon } from '@/utils/mockHexData';
import { MockHexagonModal } from '@/components/MockHexagonModal';
import { Loader2 } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * HexTestPage - Test page for hex routing work
 * - Centered on Oslo with 7 parent hexagons
 * - 12 users (3 premium) with ~60% hex fill rate
 * - Premium users: 1 profile image per 5 hexes (max 30 per user)
 * - Long routes: 100-400 hexagons per activity for realistic visualization
 * - Progressive loading: map → hexagons → images
 */
export function HexTestPage() {
	const [mockData, setMockData] = useState<MockData | null>(null);
	const [loadingStage, setLoadingStage] = useState<'generating' | 'hexagons' | 'images' | 'complete'>('generating');
	const [selectedHexagon, setSelectedHexagon] = useState<MockHexagon | null>(null);

	// Initialize map at Oslo (shows immediately)
	const { mapContainerRef, mapRef } = useMapbox({
		viewport: 'oslo',
		enableCustomStyling: true,
	});

	// Load pre-generated test data from files
	useEffect(() => {
		const toastId = toast.loading('Loading test data...', {
			description: 'Fetching 7 parent hexagons in parallel',
		});

		// Defer to next tick to allow map to render first
		setTimeout(async () => {
			try {
				const data = await loadTestData();

				toast.loading('Rendering hexagons...', {
					id: toastId,
					description: `Processing ${data.hexagons.length} hexagons`,
				});

				setMockData(data);
				setLoadingStage('hexagons');

				// After hexagons render, load images
				setTimeout(() => {
					toast.loading('Adding profile images...', {
						id: toastId,
						description: 'Loading premium user images',
					});
					setLoadingStage('images');

					setTimeout(() => {
						toast.success('Test page loaded!', {
							id: toastId,
							description: `${data.hexagons.length} hexagons, ${data.users.length} users`,
						});
						setLoadingStage('complete');
					}, 100);
				}, 100);
			} catch (error) {
				console.error('Failed to load test data:', error);
				toast.error('Failed to load test data', {
					id: toastId,
					description: 'Check console for details',
				});
			}
		}, 100);
	}, []);

	// Render static hexagons (only when data is ready)
	useStaticHexagons({
		mapRef,
		mockData: mockData || { users: [], parentHexagons: [], hexagons: [] },
	});

	// Add profile images (only after hexagons are rendered)
	useStaticProfileImages(
		mapRef,
		loadingStage === 'images' || loadingStage === 'complete' ? mockData : null
	);

	// Add click handler for hexagons
	useEffect(() => {
		if (!mapRef.current || !mockData) return;
		const map = mapRef.current;

		const handleClick = (e: mapboxgl.MapMouseEvent) => {
			// Check if we clicked on a hexagon
			const features = map.queryRenderedFeatures(e.point, {
				layers: ['hexagon-fills'],
			});

			if (features.length > 0) {
				const hexagonId = features[0].properties?.hexagonId;
				if (hexagonId) {
					// Find the hexagon data
					const hexagon = mockData.hexagons.find((h) => h.hexagonId === hexagonId);
					if (hexagon) {
						setSelectedHexagon(hexagon);
					}
				}
			}
		};

		// Change cursor on hover
		const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
			const features = map.queryRenderedFeatures(e.point, {
				layers: ['hexagon-fills'],
			});
			map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
		};

		const handleMouseLeave = () => {
			map.getCanvas().style.cursor = '';
		};

		map.on('click', 'hexagon-fills', handleClick);
		map.on('mousemove', 'hexagon-fills', handleMouseMove);
		map.on('mouseleave', 'hexagon-fills', handleMouseLeave);

		return () => {
			map.off('click', 'hexagon-fills', handleClick);
			map.off('mousemove', 'hexagon-fills', handleMouseMove);
			map.off('mouseleave', 'hexagon-fills', handleMouseLeave);
		};
	}, [mapRef, mockData]);

	return (
		<div className="relative w-full h-screen bg-black">
			{/* Map container - shows immediately */}
			<div ref={mapContainerRef} className="w-full h-full" />

			{/* Loading overlay */}
			{loadingStage !== 'complete' && (
				<div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-black/90 border border-white/20 rounded-xl p-6 flex flex-col items-center gap-4">
						<Loader2 className="w-8 h-8 animate-spin text-white" />
						<div className="text-white font-medium">
							{loadingStage === 'generating' && 'Generating mock data...'}
							{loadingStage === 'hexagons' && 'Rendering hexagons...'}
							{loadingStage === 'images' && 'Adding profile images...'}
						</div>
					</div>
				</div>
			)}

			{/* Mock Modal */}
			{selectedHexagon && mockData && (
				<MockHexagonModal
					hexagon={selectedHexagon}
					user={mockData.users.find((u) => u.id === selectedHexagon.currentOwnerId) || null}
					onClose={() => setSelectedHexagon(null)}
				/>
			)}
		</div>
	);
}
