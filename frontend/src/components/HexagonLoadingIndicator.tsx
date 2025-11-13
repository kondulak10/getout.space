import { Loading } from '@/components/ui/Loading';

interface HexagonLoadingIndicatorProps {
	isLoading: boolean;
}

export function HexagonLoadingIndicator({ isLoading }: HexagonLoadingIndicatorProps) {
	if (!isLoading) return null;
	return <Loading variant="map" text="Loading hexagons..." />;
}
