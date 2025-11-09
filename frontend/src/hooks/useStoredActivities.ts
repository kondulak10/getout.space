import { useQuery } from '@apollo/client/react';
import { MyActivitiesDocument } from '@/gql/graphql';
import { deleteActivity } from '@/services/stravaApi.service';

export function useStoredActivities() {
	const { data, loading, error, refetch } = useQuery(MyActivitiesDocument, {
		variables: { limit: 100, offset: 0 },
		fetchPolicy: 'network-only',
	});

	const removeActivity = async (activityId: number): Promise<boolean> => {
		try {

			const result = await deleteActivity(activityId);

			if (result.success) {

				await refetch();

				return true;
			} else {
				return false;
			}
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_err) {
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
