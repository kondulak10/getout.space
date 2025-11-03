import { useMapbox } from '@/hooks/useMapbox';
import { UserOverlay } from '@/components/UserOverlay';
import { LandingOverlay } from '@/components/LandingOverlay';
import { AuthLoadingOverlay } from '@/components/AuthLoadingOverlay';
import { useAuth } from '@/contexts/useAuth';
import { useStravaAuth } from '@/hooks/useStravaAuth';
import 'mapbox-gl/dist/mapbox-gl.css';

export function HomePage() {
	const { isAuthenticated, isLoading } = useAuth();
	const { isAuthenticating } = useStravaAuth();
	const { mapContainerRef } = useMapbox({
		viewport: 'ostrava',
		style: 'mapbox://styles/mapbox/outdoors-v12',
	});

	const showLoading = isLoading || isAuthenticating;

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
				<UserOverlay />
			)}
		</div>
	);
}
