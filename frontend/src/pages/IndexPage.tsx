import { useAppLoadingState } from '@/hooks/useAppLoadingState';
import { LandingPage } from '@/pages/LandingPage';
import { HomePage } from '@/pages/HomePage';
export function IndexPage() {
	const { isAuthenticated, showLoading } = useAppLoadingState();
	if (!isAuthenticated || showLoading) {
		return <LandingPage />;
	}
	return <HomePage />;
}
