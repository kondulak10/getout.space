import { useMemo, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client/react';
import {
	DeleteMyAccountDocument,
	UserPublicStatsDocument,
	UsersByIdsDocument,
	HexagonsStolenFromUserDocument,
	VersusStatsDocument,
	UserBattleStatsDocument,
	UserRecordStatsDocument
} from '@/gql/graphql';
import { useAuth } from '@/contexts/useAuth';
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

/** Calculate days since a given date */
function daysSince(date: unknown): number {
	if (!date) return 0;
	return Math.floor((Date.now() - new Date(date as string).getTime()) / (1000 * 60 * 60 * 24));
}

/** Rival data with optional user info */
interface RivalWithUser {
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
}

export function ProfilePage() {
	const { user: currentUser, logout } = useAuth();
	const navigate = useNavigate();
	const { userId } = useParams<{ userId?: string }>();
	const [deleteMyAccount, { loading: deletingAccount }] = useMutation(DeleteMyAccountDocument);
	const [showActivitiesModal, setShowActivitiesModal] = useState(false);

	const isOwnProfile = !userId || userId === currentUser?.id;
	const profileUserId = userId || currentUser?.id;

	// Profile user's public stats (header + hex stats)
	const { data: userPublicStatsData, loading: userPublicStatsLoading } = useQuery(
		UserPublicStatsDocument,
		{
			variables: { userId: profileUserId! },
			skip: !profileUserId,
			fetchPolicy: 'cache-and-network'
		}
	);

	// Battle stats (OG/conquered/clean territory counts)
	const { data: battleStatsData, loading: battleStatsLoading } = useQuery(
		UserBattleStatsDocument,
		{
			variables: { userId: profileUserId! },
			skip: !profileUserId,
			fetchPolicy: 'cache-and-network'
		}
	);

	// Record stats (most contested + longest held)
	const { data: recordStatsData, loading: recordStatsLoading } = useQuery(
		UserRecordStatsDocument,
		{
			variables: { userId: profileUserId! },
			skip: !profileUserId,
			fetchPolicy: 'cache-and-network'
		}
	);

	// Stolen hexagons (for rivals calculation)
	const { data: userStolenHexagonsData, loading: userStolenHexagonsLoading } = useQuery(
		HexagonsStolenFromUserDocument,
		{
			variables: { userId: profileUserId! },
			skip: !profileUserId,
			fetchPolicy: 'cache-and-network'
		}
	);

	// Versus stats (only when viewing another profile)
	const { data: versusStatsData, loading: versusStatsLoading } = useQuery(VersusStatsDocument, {
		variables: { userId1: profileUserId || '', userId2: currentUser?.id || '' },
		skip: !profileUserId || !currentUser?.id || isOwnProfile,
		fetchPolicy: 'cache-and-network'
	});

	// Current user's stats for comparison (only when viewing another profile)
	const { data: currentUserPublicStatsData, loading: currentUserPublicStatsLoading } = useQuery(
		UserPublicStatsDocument,
		{
			variables: { userId: currentUser?.id || '' },
			skip: !currentUser?.id || isOwnProfile,
			fetchPolicy: 'cache-and-network'
		}
	);

	// Lazy query for rival user details
	const [fetchRivalUsers, { data: rivalUsersData }] = useLazyQuery(UsersByIdsDocument);

	const user = userPublicStatsData?.userPublicStats;
	const userProfile = user?.stravaProfile || null;
	const battleStats = battleStatsData?.userBattleStats;
	const recordStats = recordStatsData?.userRecordStats;

	const daysSinceLastActivity = user?.latestActivityDate ? daysSince(user.latestActivityDate) : null;
	const daysHeld = daysSince(recordStats?.longestHeld?.lastCapturedAt);
	const approximateArea = ((user?.totalHexagons || 0) * 0.015).toFixed(2);

	// Versus stats transformation
	const versusStats = useMemo(() => {
		if (isOwnProfile || !currentUser || !user || !versusStatsData) return null;
		return {
			profileUserTotalHexagons: user.totalHexagons,
			currentUserTotalHexagons: currentUserPublicStatsData?.userPublicStats?.totalHexagons || 0,
			profileStolenFromCurrent: versusStatsData.versusStats.user1StolenFromUser2,
			currentUserStolenFromProfile: versusStatsData.versusStats.user2StolenFromUser1
		};
	}, [isOwnProfile, currentUser, user, versusStatsData, currentUserPublicStatsData]);

	// Calculate top rivals from stolen hexagons
	const { topRivals, totalRivalBattles } = useMemo(() => {
		const stolenHexagons = userStolenHexagonsData?.hexagonsStolenFromUser || [];
		const rivalMap: Record<string, { count: number; userId: string; stravaId: number }> = {};

		for (const hex of stolenHexagons) {
			const rivalId = hex.currentOwnerId;
			if (rivalId && rivalId !== profileUserId) {
				if (!rivalMap[rivalId]) {
					rivalMap[rivalId] = { count: 0, userId: rivalId, stravaId: hex.currentOwnerStravaId || 0 };
				}
				rivalMap[rivalId].count++;
			}
		}

		const sorted = Object.values(rivalMap).sort((a, b) => b.count - a.count).slice(0, 10);
		const total = Object.values(rivalMap).reduce((sum, r) => sum + r.count, 0);
		return { topRivals: sorted, totalRivalBattles: total };
	}, [userStolenHexagonsData?.hexagonsStolenFromUser, profileUserId]);

	// Fetch rival user details when rivals are calculated
	useEffect(() => {
		if (topRivals.length > 0) {
			fetchRivalUsers({ variables: { ids: topRivals.map((r) => r.userId) } });
		}
	}, [topRivals, fetchRivalUsers]);

	// Merge rival data with user info
	const rivalsWithUserData = useMemo((): RivalWithUser[] => {
		if (!rivalUsersData?.usersByIds) {
			return topRivals.map((r) => ({ ...r, user: null }));
		}
		return topRivals.map((rival) => ({
			...rival,
			user: rivalUsersData.usersByIds.find((u) => u.id === rival.userId) || null
		}));
	}, [topRivals, rivalUsersData]);

	const handleDeleteAccount = async () => {
		try {
			await deleteMyAccount();
			logout();
			navigate('/');
		} catch {
			// Silently ignore deletion errors
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
					onOpenActivities={() => setShowActivitiesModal(true)}
					onLogout={logout}
				/>

				{/* Main Stats Grid - Hexagonal Numbers */}
				<ProfileHexStats
					totalHexagons={user.totalHexagons}
					totalActivities={user.totalActivities}
					totalDistance={user.totalDistance}
					totalMovingTime={user.totalMovingTime}
					daysSinceLastActivity={daysSinceLastActivity}
					approximateArea={approximateArea}
					loading={userPublicStatsLoading}
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
						loading={versusStatsLoading || currentUserPublicStatsLoading}
					/>
				)}

				{/* Battle Stats */}
				<ProfileBattleStats
					ogHexagons={battleStats?.ogHexagons || 0}
					conqueredHexagons={battleStats?.conqueredHexagons || 0}
					cleanTerritory={battleStats?.cleanTerritory || 0}
					totalHexagons={battleStats?.totalHexagons || 0}
					loading={battleStatsLoading}
				/>

				{/* Top Rivals */}
				<ProfileTopRivals
					rivals={rivalsWithUserData}
					totalRivalBattles={totalRivalBattles}
					loading={userStolenHexagonsLoading}
				/>

				{/* Records */}
				<ProfileRecords
					mostContested={recordStats?.mostContested || null}
					longestHeld={recordStats?.longestHeld || null}
					daysHeld={daysHeld}
					loading={recordStatsLoading}
				/>

				<ProfileAverages
					totalActivities={user.totalActivities}
					totalDistance={user.totalDistance}
					totalMovingTime={user.totalMovingTime}
					totalHexagons={user.totalHexagons}
				/>

				{/* Danger Zone */}
				{isOwnProfile && (
					<ProfileDangerZone onDelete={handleDeleteAccount} deleting={deletingAccount} />
				)}
			</div>

			{/* Activities Modal */}
			{showActivitiesModal && (
				<ActivitiesModal
					isOpen={showActivitiesModal}
					onClose={() => setShowActivitiesModal(false)}
				/>
			)}
		</div>
	);
}
