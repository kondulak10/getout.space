import { useAppLoadingState } from '@/hooks/useAppLoadingState';
import { LandingOverlay } from '@/components/LandingOverlay';
import { AuthLoadingOverlay } from '@/components/AuthLoadingOverlay';

export function LandingPage() {
	const { showLoading } = useAppLoadingState();

	return (
		<div className="relative w-full h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
			{showLoading ? <AuthLoadingOverlay /> : <LandingOverlay />}
		</div>
	);
}
