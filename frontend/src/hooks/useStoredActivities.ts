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
			console.log(`🗑️ Deleting activity ${activityId}...`);

			const result = await deleteActivity(activityId);

			if (result.success) {
				console.log(`✅ Activity deleted successfully!`);
				console.log(`📊 Hexagons: ↩️ ${result.hexagons.restored} restored to previous owners, 🗑️ ${result.hexagons.deleted} removed (no previous owner)`);

				await refetch();

				return true;
			} else {
				console.error('❌ Error:', result.error);
				console.error(`Failed to delete activity: ${result.error || result.details || 'Unknown error'}`);
				return false;
			}
		} catch (err) {
			console.error('❌ Failed to delete activity:', err);
			console.error(`Error: ${err instanceof Error ? err.message : 'Network error'}`);
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
