import { useAuth } from '@/contexts/useAuth';
import { useStravaAuth } from '@/hooks/useStravaAuth';

export function useAppLoadingState() {
	const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
	const { isAuthenticating } = useStravaAuth();

	const showLoading = isAuthLoading || isAuthenticating;

	return {
		isAuthenticated,
		showLoading,
		isAuthLoading,
		isAuthenticating,
	};
}
