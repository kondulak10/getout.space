import { useAppLoadingState } from '@/hooks/useAppLoadingState';
import { LandingPage } from '@/pages/LandingPage';
import { HomePage } from '@/pages/HomePage';

/**
 * IndexPage - Router for authenticated/unauthenticated users
 * - Unauthenticated: Shows LandingPage with login prompt
 * - Authenticated: Shows HomePage with interactive map
 */
export function IndexPage() {
	const { isAuthenticated, showLoading } = useAppLoadingState();

	// Show loading or landing page for unauthenticated users
	if (!isAuthenticated || showLoading) {
		return <LandingPage />;
	}

	// Show map page for authenticated users
	return <HomePage />;
}
