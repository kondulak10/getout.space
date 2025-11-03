import { useState } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { HexagonDetailDocument } from '@/gql/graphql';
import { useMapbox } from '@/hooks/useMapbox';
import { useUserHexagons } from '@/hooks/useUserHexagons';
import { useMapView } from '@/hooks/useMapView';
import { useHexagonLayerSetup } from '@/hooks/useHexagonLayerSetup';
import { useAppLoadingState } from '@/hooks/useAppLoadingState';
import { UserOverlay } from '@/components/UserOverlay';
import { LandingOverlay } from '@/components/LandingOverlay';
import { AuthLoadingOverlay } from '@/components/AuthLoadingOverlay';
import { MapViewToggle } from '@/components/MapViewToggle';
import { HexagonLoadingIndicator } from '@/components/HexagonLoadingIndicator';
import { HexagonDetailModal } from '@/components/HexagonDetailModal';
import 'mapbox-gl/dist/mapbox-gl.css';

interface SelectedHexagonData {
	hexagonId: string;
	captureCount: number;
	activity: {
		stravaActivityId: number;
		name: string;
		distance: number;
		averageSpeed: number;
		startDateLocal: string;
		movingTime: number;
	};
}

export function HomePage() {
	const { isAuthenticated, showLoading } = useAppLoadingState();
	const { mapView, setMapView, isOnlyYouView } = useMapView();
	const [selectedHexagon, setSelectedHexagon] = useState<SelectedHexagonData | null>(null);

	// Lazy query for fetching hexagon details on click
	const [fetchHexagonDetail, { loading: hexagonDetailLoading }] = useLazyQuery(HexagonDetailDocument);

	const handleHexagonClick = async (hexagonId: string) => {
		try {
			const { data } = await fetchHexagonDetail({
				variables: { hexagonId },
			});

			if (data?.hexagon?.currentActivity) {
				setSelectedHexagon({
					hexagonId: data.hexagon.hexagonId,
					captureCount: data.hexagon.captureCount,
					activity: {
						stravaActivityId: data.hexagon.currentActivity.stravaActivityId,
						name: data.hexagon.currentActivity.name,
						distance: data.hexagon.currentActivity.distance,
						averageSpeed: data.hexagon.currentActivity.averageSpeed,
						startDateLocal: data.hexagon.currentActivity.startDateLocal,
						movingTime: data.hexagon.currentActivity.movingTime,
					},
				});
			}
		} catch (error) {
			console.error('Failed to fetch hexagon details:', error);
		}
	};

	const { mapContainerRef, mapRef } = useMapbox({
		viewport: 'ostrava',
		style: 'mapbox://styles/mapbox/light-v11',
	});

	const { totalHexCount, loading: hexagonsLoading, setupHexagonLayer, updateHexagons, cleanupHexagonLayer } = useUserHexagons({
		mapRef,
		enabled: isAuthenticated && isOnlyYouView,
		onHexagonClick: handleHexagonClick,
	});

	useHexagonLayerSetup({
		mapRef,
		enabled: isAuthenticated && isOnlyYouView,
		setupHexagonLayer,
		updateHexagons,
		cleanupHexagonLayer,
	});

	return (
		<div className="relative w-full h-screen">
			{/* Always render map so ref works */}
			<div ref={mapContainerRef} className="w-full h-full" />

			{/* Show appropriate overlay */}
			{showLoading ? (
				<AuthLoadingOverlay />
			) : !isAuthenticated ? (
				<LandingOverlay />
			) : (
				<>
					<MapViewToggle view={mapView} onViewChange={setMapView} totalHexCount={totalHexCount} />
					<UserOverlay />
					<HexagonLoadingIndicator isLoading={hexagonsLoading} />
				</>
			)}

			{/* Hexagon Detail Modal */}
			{(selectedHexagon || hexagonDetailLoading) && (
				<HexagonDetailModal
					activity={selectedHexagon?.activity}
					hexagonId={selectedHexagon?.hexagonId}
					captureCount={selectedHexagon?.captureCount}
					loading={hexagonDetailLoading}
					onClose={() => setSelectedHexagon(null)}
				/>
			)}
		</div>
	);
}
