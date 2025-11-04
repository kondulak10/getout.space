import { useQuery } from '@apollo/client/react';
import { MyActivitiesDocument } from '@/gql/graphql';
import { deleteActivity } from '@/services/stravaApi.service';

/**
 * Hook for managing activities stored in the database
 * Reuses delete logic from stravaApi.service
 */
export function useStoredActivities() {
	const { data, loading, error, refetch } = useQuery(MyActivitiesDocument, {
		variables: { limit: 100, offset: 0 },
		fetchPolicy: 'network-only',
	});

	/**
	 * Delete a stored activity and clean up hexagons
	 */
	const removeActivity = async (activityId: number): Promise<boolean> => {
		try {

			const result = await deleteActivity(activityId);

			if (result.success) {

				await refetch();

				return true;
			} else {
				return false;
			}
		} catch (err) {
			return false;
		}
	};

	return {
		activities: data?.myActivities ?? [],
		loading,
		error,
		refetch,
		removeActivity,
	};
}
