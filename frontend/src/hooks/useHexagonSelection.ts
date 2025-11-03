import { useState } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { HexagonDetailDocument } from '@/gql/graphql';

export interface SelectedHexagonData {
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

/**
 * Hook for managing hexagon selection and fetching hexagon details
 */
export function useHexagonSelection() {
	const [selectedHexagon, setSelectedHexagon] = useState<SelectedHexagonData | null>(null);
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

	const clearSelection = () => {
		setSelectedHexagon(null);
	};

	return {
		selectedHexagon,
		hexagonDetailLoading,
		handleHexagonClick,
		clearSelection,
	};
}
