import { useState } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { HexagonDetailDocument } from '@/gql/graphql';
import { analytics } from '@/lib/analytics';
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
			imghex?: string;
		};
	};
	firstCapturedBy?: {
		id: string;
		stravaId: number;
		stravaProfile?: {
			firstname?: string;
			profile?: string;
			imghex?: string;
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
				imghex?: string;
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
export function useHexagonSelection(currentUserId?: string) {
	const [selectedHexagon, setSelectedHexagon] = useState<SelectedHexagonData | null>(null);
	const [fetchHexagonDetail, { loading: hexagonDetailLoading }] = useLazyQuery(HexagonDetailDocument, {
		fetchPolicy: 'no-cache',
	});
	const handleHexagonClick = async (hexagonId: string) => {
		try {
			const { data, error } = await fetchHexagonDetail({
				variables: { hexagonId },
			});
			if (error) {
				return;
			}
			if (!data) {
				return;
			}
			if (data?.hexagon?.currentActivity) {
				const hexagonData = {
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
											imghex: data.hexagon.currentOwner.stravaProfile.imghex ?? undefined,
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
											imghex: data.hexagon.firstCapturedBy.stravaProfile.imghex ?? undefined,
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
						.filter((entry) => entry !== null)
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
													imghex: entry.user.stravaProfile.imghex ?? undefined,
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
				};

				// Track hexagon click event
				analytics.track('hexagon_clicked', {
					hexagon_id: hexagonId,
					owner_id: hexagonData.currentOwner?.id,
					is_own_hexagon: currentUserId ? hexagonData.currentOwner?.id === currentUserId : false,
				});

				setSelectedHexagon(hexagonData);
			}
		} catch {
			// Failed to fetch hexagon details
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
