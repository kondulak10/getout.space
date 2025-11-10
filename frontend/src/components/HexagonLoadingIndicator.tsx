import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/pro-solid-svg-icons';

interface HexagonLoadingIndicatorProps {
	isLoading: boolean;
}

export function HexagonLoadingIndicator({ isLoading }: HexagonLoadingIndicatorProps) {
	if (!isLoading) return null;

	return (
		<div className="absolute bottom-4 left-4 z-10">
			<div className="bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
				<FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4 text-blue-500" />
				<span className="text-xs font-medium text-gray-700">Loading hexagons...</span>
			</div>
		</div>
	);
}
