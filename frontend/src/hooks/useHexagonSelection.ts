import { useState } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { HexagonDetailDocument } from '@/gql/graphql';

export interface SelectedHexagonData {
	hexagonId: string;
	captureCount: number;
	firstCapturedAt: string;
	lastCapturedAt: string;
	currentOwner?: {
		id: string;
		stravaId: number;
		stravaProfile?: {
			firstname?: string;
			profile?: string;
		};
	};
	firstCapturedBy?: {
		id: string;
		stravaId: number;
		stravaProfile?: {
			firstname?: string;
			profile?: string;
		};
	};
	activity: {
		stravaActivityId: number;
		name: string;
		distance: number;
		averageSpeed: number;
		startDateLocal: string;
		movingTime: number;
	};
	captureHistory: Array<{
		userId: string;
		user?: {
			id: string;
			stravaId: number;
			stravaProfile?: {
				firstname?: string;
				profile?: string;
			};
		};
		activityId: string;
		activity?: {
			stravaActivityId: number;
			distance: number;
			averageSpeed: number;
			startDateLocal: string;
		};
		capturedAt: string;
		activityType: string;
	}>;
}

export function useHexagonSelection() {
	const [selectedHexagon, setSelectedHexagon] = useState<SelectedHexagonData | null>(null);
	const [fetchHexagonDetail, { loading: hexagonDetailLoading }] = useLazyQuery(HexagonDetailDocument, {
		fetchPolicy: 'no-cache', // Don't cache hexagon details - fetch fresh every time
	});

	const handleHexagonClick = async (hexagonId: string) => {
		try {
			console.log('🔍 Fetching hexagon detail for:', hexagonId);
			const { data, error } = await fetchHexagonDetail({
				variables: { hexagonId },
			});

			if (error) {
				console.error('❌ GraphQL Error fetching hexagon:', error);
				return;
			}

			if (!data) {
				console.warn('⚠️ No data returned for hexagon:', hexagonId);
				return;
			}

			console.log('✅ Hexagon data received:', data);

			if (data?.hexagon?.currentActivity) {
				setSelectedHexagon({
					hexagonId: data.hexagon.hexagonId,
					captureCount: data.hexagon.captureCount,
					firstCapturedAt: data.hexagon.firstCapturedAt as string,
					lastCapturedAt: data.hexagon.lastCapturedAt as string,
					currentOwner: data.hexagon.currentOwner
						? {
								id: data.hexagon.currentOwner.id,
								stravaId: data.hexagon.currentOwner.stravaId,
								stravaProfile: data.hexagon.currentOwner.stravaProfile
									? {
											firstname: data.hexagon.currentOwner.stravaProfile.firstname ?? undefined,
											profile: data.hexagon.currentOwner.stravaProfile.profile ?? undefined,
									  }
									: undefined,
						  }
						: undefined,
					firstCapturedBy: data.hexagon.firstCapturedBy
						? {
								id: data.hexagon.firstCapturedBy.id,
								stravaId: data.hexagon.firstCapturedBy.stravaId,
								stravaProfile: data.hexagon.firstCapturedBy.stravaProfile
									? {
											firstname:
												data.hexagon.firstCapturedBy.stravaProfile.firstname ?? undefined,
											profile: data.hexagon.firstCapturedBy.stravaProfile.profile ?? undefined,
									  }
									: undefined,
						  }
						: undefined,
					activity: {
						stravaActivityId: data.hexagon.currentActivity.stravaActivityId,
						name: data.hexagon.currentActivity.name,
						distance: data.hexagon.currentActivity.distance,
						averageSpeed: data.hexagon.currentActivity.averageSpeed,
						startDateLocal: data.hexagon.currentActivity.startDateLocal as string,
						movingTime: data.hexagon.currentActivity.movingTime,
					},
					captureHistory: (data.hexagon.captureHistory || [])
						.filter((entry) => {
							if (!entry) {
								console.warn('⚠️ Null entry in captureHistory');
								return false;
							}
							return true;
						})
						.map((entry) => ({
							userId: entry.userId || 'unknown',
							user: entry.user
								? {
										id: entry.user.id,
										stravaId: entry.user.stravaId,
										stravaProfile: entry.user.stravaProfile
											? {
													firstname: entry.user.stravaProfile.firstname ?? undefined,
													profile: entry.user.stravaProfile.profile ?? undefined,
											  }
											: undefined,
								  }
								: undefined,
							activityId: entry.activityId || 'unknown',
							activity: entry.activity
								? {
										stravaActivityId: entry.activity.stravaActivityId,
										distance: entry.activity.distance,
										averageSpeed: entry.activity.averageSpeed,
										startDateLocal: entry.activity.startDateLocal as string,
								  }
								: undefined,
							capturedAt: (entry.capturedAt as string) || new Date().toISOString(),
							activityType: entry.activityType || 'Unknown',
						})),
				});
				console.log('✅ Selected hexagon state set successfully');
			}
		} catch (error) {
			console.error('❌ CRITICAL ERROR in handleHexagonClick:', error);
			console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
			// Don't silently ignore - this helps debug
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
