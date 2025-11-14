import { useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client/react';
import {
	DeleteMyAccountDocument,
	UserHexagonsForStatsDocument,
	UserPublicStatsDocument,
	UsersByIdsDocument,
	HexagonsStolenFromUserDocument,
	VersusStatsDocument
} from '@/gql/graphql';
import { useAuth } from '@/contexts/useAuth';
import { useActivitiesManager } from '@/hooks/useActivitiesManager';
import { useProfileStats } from '@/hooks/useProfileStats';
import { ActivitiesModal } from '@/components/ActivitiesModal';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileHexStats } from '@/components/profile/ProfileHexStats';
import { ProfileVersusStats } from '@/components/profile/ProfileVersusStats';
import { ProfileBattleStats } from '@/components/profile/ProfileBattleStats';
import { ProfileTopRivals } from '@/components/profile/ProfileTopRivals';
import { ProfileRecords } from '@/components/profile/ProfileRecords';
import { ProfileAverages } from '@/components/profile/ProfileAverages';
import { ProfileDangerZone } from '@/components/profile/ProfileDangerZone';
import { Loading } from '@/components/ui/Loading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function ProfilePage() {
	const { user: currentUser, logout } = useAuth();
	const navigate = useNavigate();
	const { userId } = useParams<{ userId?: string }>();
	const [deleteMyAccount, { loading: deletingAccount }] = useMutation(DeleteMyAccountDocument);

	const isOwnProfile = !userId || userId === currentUser?.id;
	const profileUserId = userId || currentUser?.id;

	// Fetch user data
	const { data: userHexagonsData, loading: userHexagonsLoading } = useQuery(
		UserHexagonsForStatsDocument,
		{
			variables: { userId: profileUserId! },
			skip: !profileUserId,
			fetchPolicy: 'network-only'
		}
	);

	const { data: userPublicStatsData, loading: userPublicStatsLoading } = useQuery(
		UserPublicStatsDocument,
		{
			variables: { userId: profileUserId! },
			skip: !profileUserId,
			fetchPolicy: 'cache-and-network'
		}
	);

	const { data: userStolenHexagonsData, loading: userStolenHexagonsLoading } = useQuery(
		HexagonsStolenFromUserDocument,
		{
			variables: { userId: profileUserId! },
			skip: !profileUserId,
			fetchPolicy: 'network-only'
		}
	);

	const user = userPublicStatsData?.userPublicStats;
	const userProfile = user?.stravaProfile || null;

	// Fetch versus stats when viewing another profile
	const { data: versusStatsData, loading: versusStatsLoading } = useQuery(VersusStatsDocument, {
		variables: { userId1: profileUserId || '', userId2: currentUser?.id || '' },
		skip: !profileUserId || !currentUser?.id || isOwnProfile,
		fetchPolicy: 'cache-and-network'
	});

	// Lazy query for fetching rival users
	const [fetchRivalUsers, { data: rivalUsersData }] = useLazyQuery(UsersByIdsDocument);

	// Activities management
	const {
		showModal,
		activities,
		loading: activitiesLoading,
		openModal,
		closeModal,
		loadStravaActivities,
		handleSaveActivity,
		handleRemoveActivity
	} = useActivitiesManager();

	// Calculate stats using custom hook
	const stats = useProfileStats({
		user,
		hexagons: userHexagonsData?.userHexagons || [],
		stolenHexagons: userStolenHexagonsData?.hexagonsStolenFromUser || [],
		publicStats: userPublicStatsData?.userPublicStats
	});

	// Transform versus stats from query (only when viewing another profile)
	const versusStats = useMemo(() => {
		if (isOwnProfile || !currentUser || !user || !versusStatsData) return null;

		return {
			profileUserTotalHexagons: userHexagonsData?.userHexagons?.length || 0,
			currentUserTotalHexagons: stats?.totalHexagons || 0,
			profileStolenFromCurrent: versusStatsData.versusStats.user1StolenFromUser2,
			currentUserStolenFromProfile: versusStatsData.versusStats.user2StolenFromUser1
		};
	}, [isOwnProfile, currentUser, user, versusStatsData, userHexagonsData, stats]);

	// Fetch rival user data when stats are available
	useEffect(() => {
		if (stats && stats.topRivals.length > 0) {
			const rivalIds = stats.topRivals.map((r) => r.userId);
			fetchRivalUsers({ variables: { ids: rivalIds } });
		}
	}, [stats, fetchRivalUsers]);

	// Merge rival data with user info
	const rivalsWithUserData = useMemo(() => {
		if (!stats || !rivalUsersData?.usersByIds) return stats?.topRivals || [];

		return stats.topRivals.map((rival) => {
			const userData = rivalUsersData.usersByIds.find((u) => u.id === rival.userId);
			return {
				...rival,
				user: userData || null
			};
		});
	}, [stats, rivalUsersData]) as Array<{
		count: number;
		userId: string;
		stravaId: number;
		user: {
			id: string;
			stravaId: number;
			stravaProfile: {
				firstname?: string | null;
				lastname?: string | null;
				profile?: string | null;
				imghex?: string | null;
			};
		} | null;
	}>;

	const handleDeleteAccount = async () => {
		try {
			await deleteMyAccount();
			logout();
			navigate('/');
		} catch {
			// Account deletion failed, silently ignore
		}
	};

	// Only show loading spinner if we have no user data at all and it's the first load
	if (userPublicStatsLoading && !user) {
		return <Loading text="Loading profile..." />;
	}

	if (!user) {
		return null;
	}

	return (
		<div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
			<div className="max-w-6xl mx-auto space-y-6">
				{/* Back Button */}
				<button
					onClick={() => navigate('/')}
					className="flex items-center gap-2 bg-white/10 border border-white/20 text-gray-100 px-4 py-2.5 rounded-lg hover:bg-white/20 hover:border-white/30 transition-all cursor-pointer font-medium"
				>
					<FontAwesomeIcon icon="chevron-left" className="w-4 h-4" />
					Back to Map
				</button>

				{/* Profile Header */}
				<ProfileHeader
					userProfile={userProfile}
					stravaId={user.stravaId}
					isOwnProfile={isOwnProfile}
					isAdmin={currentUser?.isAdmin}
					onOpenActivities={openModal}
					onLogout={logout}
					activitiesLoading={activitiesLoading}
				/>

				{/* Main Stats Grid - Hexagonal Numbers */}
				<ProfileHexStats
					totalHexagons={stats?.totalHexagons || 0}
					totalActivities={stats?.totalActivities || 0}
					totalDistance={stats?.totalDistance || 0}
					totalMovingTime={stats?.totalMovingTime || 0}
					daysSinceLastActivity={stats?.daysSinceLastActivity || null}
					approximateArea={stats?.approximateArea || "0.00"}
					loading={userHexagonsLoading || userPublicStatsLoading}
				/>

				{/* Versus Stats - Only shown when viewing another profile */}
				{!isOwnProfile && currentUser && (
					<ProfileVersusStats
						profileUserImage={userProfile?.imghex || userProfile?.profile}
						profileUserName={userProfile?.firstname || 'User'}
						profileUserTotalHexagons={versusStats?.profileUserTotalHexagons || 0}
						profileUserStolenFromCurrent={versusStats?.profileStolenFromCurrent || 0}
						currentUserImage={currentUser.profile?.imghex || currentUser.profile?.profile}
						currentUserName={currentUser.profile?.firstname || 'You'}
						currentUserTotalHexagons={versusStats?.currentUserTotalHexagons || 0}
						currentUserStolenFromProfile={versusStats?.currentUserStolenFromProfile || 0}
						loading={userHexagonsLoading || versusStatsLoading}
					/>
				)}

				{/* Battle Stats */}
				<ProfileBattleStats
					ogHexagons={stats?.ogHexagons || 0}
					conqueredHexagons={stats?.conqueredHexagons || 0}
					cleanTerritory={stats?.cleanTerritory || 0}
					totalHexagons={stats?.totalHexagons || 0}
					loading={userHexagonsLoading}
				/>

				{/* Top Rivals */}
				<ProfileTopRivals
					rivals={rivalsWithUserData}
					totalRivalBattles={stats?.totalRivalBattles || 0}
					loading={userStolenHexagonsLoading}
				/>

				{/* Records and Averages */}
				{stats && (
					<>
						<ProfileRecords
							mostContested={stats.mostContested}
							longestHeld={stats.longestHeld}
							daysHeld={stats.daysHeld}
						/>

						<ProfileAverages
							totalActivities={stats.totalActivities}
							totalDistance={stats.totalDistance}
							totalMovingTime={stats.totalMovingTime}
							totalHexagons={stats.totalHexagons}
						/>
					</>
				)}

				{/* Danger Zone */}
				{isOwnProfile && (
					<ProfileDangerZone onDelete={handleDeleteAccount} deleting={deletingAccount} />
				)}
			</div>

			{/* Activities Modal */}
			<ActivitiesModal
				isOpen={showModal}
				onClose={closeModal}
				onFetchActivities={loadStravaActivities}
				stravaActivities={activities}
				loadingStrava={activitiesLoading}
				onProcess={handleSaveActivity}
				onDeleteStrava={handleRemoveActivity}
			/>
		</div>
	);
}
