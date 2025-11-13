import { Loading } from '@/components/ui/Loading';

export function AuthLoadingOverlay() {
	return <Loading variant="auth" text="Authenticating..." />;
}
