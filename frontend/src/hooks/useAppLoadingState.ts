import { useAuth } from '@/contexts/useAuth';
import { useStravaAuth } from '@/hooks/useStravaAuth';
interface UseAppLoadingStateOptions {
	onActivitiesProcessed?: () => void;
}
export function useAppLoadingState(options?: UseAppLoadingStateOptions) {
	const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
	const { isAuthenticating } = useStravaAuth({
		onActivitiesProcessed: options?.onActivitiesProcessed,
	});
	const showLoading = isAuthLoading || isAuthenticating;
	return {
		isAuthenticated,
		showLoading,
		isAuthLoading,
		isAuthenticating,
	};
}
