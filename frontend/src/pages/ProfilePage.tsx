import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client/react';
import { DeleteMyAccountDocument, UserHexagonsForStatsDocument, UserPublicStatsDocument, UsersByIdsDocument, HexagonsStolenFromUserDocument } from '@/gql/graphql';
import { useAuth } from '@/contexts/useAuth';
import { useActivitiesManager } from '@/hooks/useActivitiesManager';
import { ActivitiesModal } from '@/components/ActivitiesModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faTrophy,
	faHexagon,
	faFire,
	faSparkles,
	faClock,
	faRoute,
	faChartLine,
	faCalendar,
	faBolt,
	faShieldAlt,
	faSpinner,
	faUser,
	faCrown
} from '@fortawesome/pro-solid-svg-icons';

export function ProfilePage() {
	const { user: currentUser, logout } = useAuth();
	const navigate = useNavigate();
	const { userId } = useParams<{ userId?: string }>();
	const [deleteMyAccount, { loading: deletingAccount }] = useMutation(DeleteMyAccountDocument);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const isOwnProfile = !userId || userId === currentUser?.id;
	const profileUserId = userId || currentUser?.id;

	// Use same queries for everyone - just pass the userId
	const { data: userHexagonsData, loading: userHexagonsLoading } = useQuery(UserHexagonsForStatsDocument, {
		variables: { userId: profileUserId! },
		skip: !profileUserId,
		fetchPolicy: 'network-only',
	});
	const { data: userPublicStatsData, loading: userPublicStatsLoading } = useQuery(UserPublicStatsDocument, {
		variables: { userId: profileUserId! },
		skip: !profileUserId,
	});
	const { data: userStolenHexagonsData, loading: userStolenHexagonsLoading } = useQuery(HexagonsStolenFromUserDocument, {
		variables: { userId: profileUserId! },
		skip: !profileUserId,
		fetchPolicy: 'network-only',
	});

	const isLoading = userHexagonsLoading || userPublicStatsLoading || userStolenHexagonsLoading;
	const user = userPublicStatsData?.userPublicStats;

	// Lazy query for fetching rival users
	const [fetchRivalUsers, { data: rivalUsersData }] = useLazyQuery(UsersByIdsDocument);
	const userProfile = user?.stravaProfile || null;

	const {
		showModal,
		activities,
		loading,
		openModal,
		closeModal,
		loadStravaActivities,
		handleSaveActivity,
		handleRemoveActivity,
	} = useActivitiesManager();


	const stats = useMemo(() => {
		if (!user) {
			return null;
		}

		// Get hexagon data - same for everyone
		const hexagons = userHexagonsData?.userHexagons || [];

		// Get public stats - same for everyone
		const publicStats = userPublicStatsData?.userPublicStats;

		const totalHexagons = hexagons.length;

		console.log('🔍 Territory Debug:', {
			totalHexagons,
			sampleHexagons: hexagons.slice(0, 3).map(h => ({
				hexagonId: h.hexagonId,
				currentOwnerId: h.currentOwnerId,
				firstCapturedById: h.firstCapturedBy?.id,
				captureCount: h.captureCount,
				captureHistoryLength: h.captureHistory?.length || 0,
				hasHistory: !!h.captureHistory && h.captureHistory.length > 0
			})),
			totalWithHistory: hexagons.filter(h => h.captureHistory && h.captureHistory.length > 0).length,
			totalWithoutHistory: hexagons.filter(h => !h.captureHistory || h.captureHistory.length === 0).length,
		});

		// Activity stats: use public stats for everyone
		const totalActivities = publicStats?.totalActivities || 0;
		const totalDistance = publicStats?.totalDistance || 0;
		const totalMovingTime = publicStats?.totalMovingTime || 0;

		const ogHexagons = hexagons.filter(
			(hex) => hex.firstCapturedBy?.id === user.id
		).length;


		const conqueredHexagons = hexagons.filter(
			(hex) => hex.firstCapturedBy?.id !== user.id
		).length;


		const cleanTerritory = hexagons.filter(
			(hex) => !hex.captureHistory || hex.captureHistory.length === 0
		).length;

		console.log('📊 Stats Breakdown:', {
			totalHexagons,
			ogHexagons,
			conqueredHexagons,
			cleanTerritory,
			ogAndClean: hexagons.filter(h => h.firstCapturedBy?.id === user.id && (!h.captureHistory || h.captureHistory.length === 0)).length,
			ogButDirty: hexagons.filter(h => h.firstCapturedBy?.id === user.id && h.captureHistory && h.captureHistory.length > 0).length,
			conqueredAndClean: hexagons.filter(h => h.firstCapturedBy?.id !== user.id && (!h.captureHistory || h.captureHistory.length === 0)).length,
		});


		const revengeCaptures = hexagons.filter((hex) => {
			if (!hex.captureHistory || hex.captureHistory.length === 0) return false;

			return hex.captureHistory.some((entry) => entry.userId === user.id);
		}).length;


		const battleTestedHexagons = hexagons.filter(
			(hex) => hex.captureCount > 1
		).length;


		const totalBattles = hexagons.reduce((sum, hex) => sum + (hex.captureCount - 1), 0);


		// Get hexagons stolen FROM the user (correct rivals calculation)
		const stolenHexagons = userStolenHexagonsData?.hexagonsStolenFromUser || [];

		const rivalMap: Record<string, { count: number, userId: string, stravaId: number }> = {};

		console.log('🔍 Rivals Debug:', {
			totalOwnedHexagons: hexagons.length,
			totalStolenHexagons: stolenHexagons.length,
			sampleStolenHex: stolenHexagons[0],
			userId: user.id
		});

		// Count current owners of hexagons stolen from us
		stolenHexagons.forEach((hex) => {
			const rivalId = hex.currentOwnerId;
			if (rivalId && rivalId !== user.id) {
				if (!rivalMap[rivalId]) {
					rivalMap[rivalId] = {
						count: 0,
						userId: rivalId,
						stravaId: hex.currentOwnerStravaId || 0
					};
				}
				rivalMap[rivalId].count++;
			}
		});

		console.log('🏆 Top Rivals:', Object.values(rivalMap).sort((a, b) => b.count - a.count).slice(0, 5));
		const topRivals = Object.values(rivalMap)
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);
		const totalRivalBattles = Object.values(rivalMap).reduce((sum, rival) => sum + rival.count, 0);

		
		const mostContested = hexagons.reduce((max, hex) =>
			(hex.captureCount > (max?.captureCount || 0) ? hex : max),
			hexagons[0]
		);

		
		const longestHeld = hexagons.reduce((oldest, hex) => {
			if (!oldest) return hex;
			const oldestDate = new Date(oldest.lastCapturedAt as string).getTime();
			const hexDate = new Date(hex.lastCapturedAt as string).getTime();
			return hexDate < oldestDate ? hex : oldest;
		}, hexagons[0]);

		
		const daysHeld = longestHeld
			? Math.floor((Date.now() - new Date(longestHeld.lastCapturedAt as string).getTime()) / (1000 * 60 * 60 * 24))
			: 0;

		// Latest activity from public stats
		const daysSinceLastActivity = publicStats?.latestActivityDate
			? Math.floor((Date.now() - new Date(publicStats.latestActivityDate as string).getTime()) / (1000 * 60 * 60 * 24))
			: null;

		
		const approximateArea = (totalHexagons * 0.015).toFixed(2);

		return {
			totalHexagons,
			totalActivities,
			ogHexagons,
			conqueredHexagons,
			cleanTerritory,
			revengeCaptures,
			battleTestedHexagons,
			totalBattles,
			topRivals,
			totalRivalBattles,
			mostContested,
			longestHeld,
			daysHeld,
			totalDistance,
			totalMovingTime,
			daysSinceLastActivity,
			approximateArea,
		};
	}, [user, userHexagonsData, userPublicStatsData, userStolenHexagonsData]);

	// Fetch rival user data when stats are available
	useEffect(() => {
		if (stats && stats.topRivals.length > 0) {
			const rivalIds = stats.topRivals.map(r => r.userId);
			fetchRivalUsers({ variables: { ids: rivalIds } });
		}
	}, [stats, fetchRivalUsers]);

	// Merge rival data with user info
	const rivalsWithUserData = useMemo(() => {
		if (!stats || !rivalUsersData?.usersByIds) return stats?.topRivals || [];

		return stats.topRivals.map(rival => {
			const userData = rivalUsersData.usersByIds.find(u => u.id === rival.userId);
			return {
				...rival,
				user: userData || null
			};
		});
	}, [stats, rivalUsersData]) as Array<{ count: number; userId: string; stravaId: number; user: { id: string; stravaId: number; stravaProfile: { firstname?: string | null; lastname?: string | null; profile?: string | null; imghex?: string | null } } | null }>;

	const handleDeleteAccount = async () => {
		if (!showDeleteConfirm) {
			setShowDeleteConfirm(true);
			return;
		}

		try {
			await deleteMyAccount();
			logout();
			navigate('/');

		} catch {
			// Account deletion failed, silently ignore
		}
	};

	const formatDistance = (meters: number) => {
		return (meters / 1000).toFixed(2) + ' km';
	};

	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	};

	const renderUserAvatar = (
		rivalUser?: { id: string; stravaId: number; stravaProfile: { firstname?: string | null; lastname?: string | null; profile?: string | null; imghex?: string | null } } | null,
		stravaId?: number
	) => {
		if (!rivalUser) {
			return (
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-full bg-gray-500/20 border-2 border-gray-500/40 flex items-center justify-center">
						<FontAwesomeIcon icon={faUser} className="w-5 h-5 text-gray-500" />
					</div>
					<span className="text-base font-bold text-gray-200">User #{stravaId}</span>
				</div>
			);
		}

		const displayName = rivalUser.stravaProfile?.firstname || `User ${rivalUser.stravaId}`;
		const imghexUrl = rivalUser.stravaProfile?.imghex;
		const profileUrl = rivalUser.stravaProfile?.profile;
		const imageUrl = imghexUrl || profileUrl;

		return (
			<div
				className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
				onClick={(e) => {
					e.stopPropagation();
					navigate(`/profile/${rivalUser.id}`);
				}}
			>
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={displayName}
						className={`w-10 h-10 ${imghexUrl ? '' : 'rounded-full'} object-cover shadow-lg`}
						onError={(e) => {
							(e.target as HTMLImageElement).style.display = 'none';
							const fallback = (e.target as HTMLImageElement).nextElementSibling;
							if (fallback) (fallback as HTMLElement).style.display = 'flex';
						}}
					/>
				) : null}
				{imageUrl && (
					<div
						className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/30 border-2 border-orange-500/40 flex items-center justify-center shadow-lg"
						style={{ display: imageUrl ? 'none' : 'flex' }}
					>
						<FontAwesomeIcon icon={faUser} className="w-5 h-5 text-orange-400" />
					</div>
				)}
				{!imageUrl && (
					<div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/30 border-2 border-orange-500/40 flex items-center justify-center shadow-lg">
						<FontAwesomeIcon icon={faUser} className="w-5 h-5 text-orange-400" />
					</div>
				)}
				<span className="text-base font-bold text-gray-100">{displayName}</span>
			</div>
		);
	};

	if (!user) {
		return null;
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
				<div className="text-center">
					<FontAwesomeIcon icon={faSpinner} spin className="w-12 h-12 text-orange-500 mb-4" />
					<p className="text-gray-400">Loading profile...</p>
				</div>
			</div>
		);
	}

	if (!stats) {
		return (
			<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-400">Failed to load profile data</p>
					<button onClick={() => navigate('/')} className="mt-4 text-orange-500 hover:text-orange-400">
						Back to Map
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
			<div className="max-w-6xl mx-auto space-y-6">
				{}
				<button
					onClick={() => navigate('/')}
					className="flex items-center gap-2 bg-white/10 border border-white/20 text-gray-100 px-4 py-2.5 rounded-lg hover:bg-white/20 hover:border-white/30 transition-all cursor-pointer font-medium"
				>
					<FontAwesomeIcon icon="chevron-left" className="w-4 h-4" />
					Back to Map
				</button>

				{}
				<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-white/10 rounded-xl p-6">
					<div className="flex items-center justify-between gap-4 flex-wrap">
						<div className="flex items-center gap-4">
							{(userProfile?.imghex || userProfile?.profile) && (
								<img
									src={userProfile.imghex || userProfile.profile || undefined}
									alt={userProfile?.firstname || ''}
									className={`w-20 h-20 object-cover ${userProfile.imghex ? '' : 'hex-clip'}`}
								/>
							)}
							<div>
								<h1 className="text-2xl font-bold text-gray-100">
									{userProfile?.firstname} {userProfile?.lastname}
								</h1>
								<p className="text-sm text-gray-400">Strava ID: {user?.stravaId}</p>
								{isOwnProfile && currentUser?.isAdmin && (
									<span className="inline-flex items-center gap-1 text-xs text-purple-400 font-semibold mt-1">
										<FontAwesomeIcon icon={faCrown} className="w-3 h-3" />
										Admin
									</span>
								)}
							</div>
						</div>
					</div>
					{isOwnProfile && (
						<div className="flex gap-2">
							<button
								onClick={() => openModal()}
								disabled={loading}
								className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 text-orange-400 px-4 py-2 rounded-lg hover:bg-orange-500/30 hover:border-orange-500/50 transition-all cursor-pointer font-medium disabled:opacity-50"
							>
								<FontAwesomeIcon icon="running" className="w-4 h-4" />
								Manage Activities
							</button>
							<button
								onClick={() => {
									logout();
									navigate('/');
								}}
								className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 hover:border-red-500/50 hover:text-red-300 transition-all cursor-pointer font-medium"
							>
								<FontAwesomeIcon icon="sign-out-alt" className="w-4 h-4" />
								Logout
							</button>
						</div>
					)}
				</div>

				{}
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<FontAwesomeIcon icon="spinner" spin className="w-8 h-8 text-orange-500" />
					</div>
				) : stats ? (
					<>
						{/* Main Stats Grid - Hexagonal Numbers */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{/* Total Hexagons */}
							<div className="flex flex-col items-center">
								<div className="relative w-24 h-24 mb-3">
									<svg viewBox="0 0 100 100" className="w-full h-full">
										<defs>
											<linearGradient id="hexGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
												<stop offset="0%" stopColor="rgb(55, 65, 81)" stopOpacity="0.6" />
												<stop offset="100%" stopColor="rgb(17, 24, 39)" stopOpacity="0.8" />
											</linearGradient>
										</defs>
										<polygon
											points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
											fill="url(#hexGrad1)"
											stroke="rgb(156, 163, 175)"
											strokeWidth="2"
											className="transition-all duration-300 hover:stroke-[rgb(209,213,219)]"
										/>
									</svg>
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="text-4xl font-bold text-white">{stats.totalHexagons}</div>
									</div>
								</div>
								<div className="text-center">
									<div className="flex items-center justify-center gap-2 mb-1">
										<FontAwesomeIcon icon={faHexagon} className="w-4 h-4 text-orange-400" />
										<h3 className="text-base font-bold text-white">
											Territory
										</h3>
									</div>
									<div className="text-xs text-gray-400">
										~{stats.approximateArea} km² area
									</div>
								</div>
							</div>

							{/* Total Activities */}
							<div className="flex flex-col items-center">
								<div className="relative w-24 h-24 mb-3">
									<svg viewBox="0 0 100 100" className="w-full h-full">
										<defs>
											<linearGradient id="hexGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
												<stop offset="0%" stopColor="rgb(55, 65, 81)" stopOpacity="0.6" />
												<stop offset="100%" stopColor="rgb(17, 24, 39)" stopOpacity="0.8" />
											</linearGradient>
										</defs>
										<polygon
											points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
											fill="url(#hexGrad2)"
											stroke="rgb(156, 163, 175)"
											strokeWidth="2"
											className="transition-all duration-300 hover:stroke-[rgb(209,213,219)]"
										/>
									</svg>
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="text-4xl font-bold text-white">{stats.totalActivities}</div>
									</div>
								</div>
								<div className="text-center">
									<div className="flex items-center justify-center gap-2 mb-1">
										<FontAwesomeIcon icon={faRoute} className="w-4 h-4 text-blue-400" />
										<h3 className="text-base font-bold text-white">
											Activities
										</h3>
									</div>
									{stats.daysSinceLastActivity !== null ? (
										<div className="text-xs text-gray-400">
											Last: {stats.daysSinceLastActivity === 0 ? 'today' : `${stats.daysSinceLastActivity}d ago`}
										</div>
									) : (
										<div className="text-xs text-gray-400">
											Total runs completed
										</div>
									)}
								</div>
							</div>

							{/* Total Distance */}
							<div className="flex flex-col items-center">
								<div className="relative w-24 h-24 mb-3">
									<svg viewBox="0 0 100 100" className="w-full h-full">
										<defs>
											<linearGradient id="hexGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
												<stop offset="0%" stopColor="rgb(55, 65, 81)" stopOpacity="0.6" />
												<stop offset="100%" stopColor="rgb(17, 24, 39)" stopOpacity="0.8" />
											</linearGradient>
										</defs>
										<polygon
											points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
											fill="url(#hexGrad3)"
											stroke="rgb(156, 163, 175)"
											strokeWidth="2"
											className="transition-all duration-300 hover:stroke-[rgb(209,213,219)]"
										/>
									</svg>
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="text-4xl font-bold text-white">{(stats.totalDistance / 1000).toFixed(0)}</div>
									</div>
								</div>
								<div className="text-center">
									<div className="flex items-center justify-center gap-2 mb-1">
										<FontAwesomeIcon icon={faChartLine} className="w-4 h-4 text-green-400" />
										<h3 className="text-base font-bold text-white">
											Distance
										</h3>
									</div>
									{stats.totalMovingTime > 0 ? (
										<div className="text-xs text-gray-400">
											{formatTime(stats.totalMovingTime)} moving
										</div>
									) : (
										<div className="text-xs text-gray-400">
											Kilometers covered
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Battle Stats - Show for everyone! */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{/* OG Discoveries */}
							<div className="rounded-lg bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-transparent border border-purple-500/40 p-4 shadow-lg hover:border-purple-400/60 transition-all">
								<div className="flex items-center gap-2 mb-2">
									<FontAwesomeIcon icon={faSparkles} className="w-4 h-4 text-purple-400" />
									<h3 className="text-xs font-bold text-purple-400 uppercase tracking-wide">
										OG Discoveries
									</h3>
								</div>
								<div className="text-3xl font-bold text-gray-100 mb-1">{stats.ogHexagons}</div>
								<div className="text-xs text-gray-400">first to discover</div>
								<div className="mt-2 text-xs text-purple-400/70">
									{stats.totalHexagons > 0 ? Math.round((stats.ogHexagons / stats.totalHexagons) * 100) : 0}%
								</div>
							</div>

							{/* Conquered */}
							<div className="rounded-lg bg-gradient-to-br from-red-500/20 via-red-600/10 to-transparent border border-red-500/40 p-4 shadow-lg hover:border-red-400/60 transition-all">
								<div className="flex items-center gap-2 mb-2">
									<FontAwesomeIcon icon={faFire} className="w-4 h-4 text-red-400" />
									<h3 className="text-xs font-bold text-red-400 uppercase tracking-wide">
										Conquered
									</h3>
								</div>
								<div className="text-3xl font-bold text-gray-100 mb-1">{stats.conqueredHexagons}</div>
								<div className="text-xs text-gray-400">taken from others</div>
								<div className="mt-2 text-xs text-red-400/70">
									{stats.totalHexagons > 0 ? Math.round((stats.conqueredHexagons / stats.totalHexagons) * 100) : 0}%
								</div>
							</div>

							{/* Clean Territory */}
							<div className="rounded-lg bg-gradient-to-br from-green-500/20 via-green-600/10 to-transparent border border-green-500/40 p-4 shadow-lg hover:border-green-400/60 transition-all">
								<div className="flex items-center gap-2 mb-2">
									<FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4 text-green-400" />
									<h3 className="text-xs font-bold text-green-400 uppercase tracking-wide">
										Clean Territory
									</h3>
								</div>
								<div className="text-3xl font-bold text-gray-100 mb-1">{stats.cleanTerritory}</div>
								<div className="text-xs text-gray-400">never challenged</div>
								<div className="mt-2 text-xs text-green-400/70">
									{stats.totalHexagons > 0 ? Math.round((stats.cleanTerritory / stats.totalHexagons) * 100) : 0}%
								</div>
							</div>

							{/* Revenge Captures */}
							<div className="rounded-lg bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-transparent border border-orange-500/40 p-4 shadow-lg hover:border-orange-400/60 transition-all">
								<div className="flex items-center gap-2 mb-2">
									<FontAwesomeIcon icon={faTrophy} className="w-4 h-4 text-orange-400" />
									<h3 className="text-xs font-bold text-orange-400 uppercase tracking-wide">
										Revenge
									</h3>
								</div>
								<div className="text-3xl font-bold text-gray-100 mb-1">{stats.revengeCaptures}</div>
								<div className="text-xs text-gray-400">reclaimed</div>
								<div className="mt-2 text-xs text-orange-400/70">
									Won back!
								</div>
							</div>
						</div>

						{/* Top 10 Rivals Leaderboard - Show for everyone! */}
						<div className="rounded-xl bg-white/5 border border-white/10 p-5">
							<div className="flex items-center gap-2 mb-4">
								<FontAwesomeIcon icon={faTrophy} className="w-5 h-5 text-pink-400" />
								<h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">
									Top 10 Rivals
								</h3>
								<span className="text-xs text-gray-500">
									(Users who stole your hexagons)
								</span>
							</div>

							{rivalsWithUserData.length > 0 ? (
								<>
									<div className="space-y-2">
										{rivalsWithUserData.map((rival, index: number) => {
											const getMedalColor = (rank: number) => {
												if (rank === 0) return 'text-yellow-400';
												if (rank === 1) return 'text-gray-300';
												if (rank === 2) return 'text-amber-600';
												return 'text-gray-500';
											};

											const getMedalBg = (rank: number) => {
												if (rank === 0) return 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30';
												if (rank === 1) return 'bg-gradient-to-r from-gray-400/20 to-transparent border border-gray-400/30';
												if (rank === 2) return 'bg-gradient-to-r from-amber-700/20 to-transparent border border-amber-700/30';
												return 'bg-white/5 border border-white/10';
											};

											return (
												<div
													key={rival.userId}
													className={`rounded-lg p-3 flex items-center justify-between transition-all ${getMedalBg(index)}`}
												>
													<div className="flex items-center gap-3 flex-1">
														<div className="flex items-center justify-center w-8">
															{index < 3 ? (
																<FontAwesomeIcon icon={faTrophy} className={`w-5 h-5 ${getMedalColor(index)}`} />
															) : (
																<span className="text-sm font-bold text-gray-500">#{index + 1}</span>
															)}
														</div>
														{renderUserAvatar(rival.user, rival.stravaId)}
													</div>
													<div className="flex items-center gap-2">
														<span className="text-lg font-bold text-gray-200">{rival.count}</span>
														<span className="text-xs text-gray-400">
															{rival.count === 1 ? 'hex' : 'hexes'}
														</span>
													</div>
												</div>
											);
										})}
									</div>

									<div className="mt-4 pt-4 border-t border-white/10 text-center">
										<div className="text-xs text-gray-500">Total hexes stolen by rivals</div>
										<div className="text-2xl font-bold text-pink-400">{stats.totalRivalBattles}</div>
									</div>
								</>
							) : (
								<div className="text-center py-8">
									<FontAwesomeIcon icon={faSparkles} className="w-12 h-12 text-gray-600 mx-auto mb-3" />
									<p className="text-gray-400 mb-1">No rivals yet</p>
									<p className="text-xs text-gray-500">
										Your territory hasn't been challenged. Keep exploring!
									</p>
								</div>
							)}
						</div>

						{/* Records */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{}
							{stats.mostContested && (
								<div className="rounded-xl bg-white/5 border border-white/10 p-5">
									<div className="flex items-center gap-2 mb-3">
										<FontAwesomeIcon icon={faTrophy} className="w-5 h-5 text-yellow-400" />
										<h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">
											Most Contested Hex
										</h3>
									</div>
									<div className="flex items-center justify-between">
										<div>
											<div className="text-xs text-gray-500 mb-1">Capture Count</div>
											<div className="text-3xl font-bold text-yellow-400">
												{stats.mostContested.captureCount}x
											</div>
										</div>
										<div className="text-right">
											<div className="text-xs text-gray-500 mb-1">Hexagon ID</div>
											<div className="text-xs font-mono text-gray-400 max-w-[200px] truncate">
												{stats.mostContested.hexagonId}
											</div>
										</div>
									</div>
								</div>
							)}

							{}
							{stats.longestHeld && (
								<div className="rounded-xl bg-white/5 border border-white/10 p-5">
									<div className="flex items-center gap-2 mb-3">
										<FontAwesomeIcon icon={faClock} className="w-5 h-5 text-cyan-400" />
										<h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">
											Longest Held
										</h3>
									</div>
									<div className="flex items-center justify-between">
										<div>
											<div className="text-xs text-gray-500 mb-1">Days Held</div>
											<div className="text-3xl font-bold text-cyan-400">
												{stats.daysHeld}d
											</div>
										</div>
										<div className="text-right">
											<div className="text-xs text-gray-500 mb-1">Captured On</div>
											<div className="text-xs text-gray-400">
												{new Date(stats.longestHeld.lastCapturedAt as string).toLocaleDateString('en-US', {
													month: 'short',
													day: 'numeric',
													year: 'numeric',
												})}
											</div>
										</div>
									</div>
								</div>
							)}
						</div>

						{}
						{stats.totalActivities > 0 && (
							<div className="rounded-xl bg-white/5 border border-white/10 p-5">
								<div className="flex items-center gap-2 mb-4">
									<FontAwesomeIcon icon={faBolt} className="w-5 h-5 text-gray-400" />
									<h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">
										Averages Per Run
									</h3>
								</div>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="text-center">
										<div className="text-xs text-gray-500 mb-1">Distance</div>
										<div className="text-xl font-bold text-gray-200">
											{formatDistance(stats.totalDistance / stats.totalActivities)}
										</div>
									</div>
									<div className="text-center">
										<div className="text-xs text-gray-500 mb-1">Duration</div>
										<div className="text-xl font-bold text-gray-200">
											{formatTime(stats.totalMovingTime / stats.totalActivities)}
										</div>
									</div>
									<div className="text-center">
										<div className="text-xs text-gray-500 mb-1">Hexes Captured</div>
										<div className="text-xl font-bold text-gray-200">
											{Math.round(stats.totalHexagons / stats.totalActivities)}
										</div>
									</div>
									<div className="text-center">
										<div className="text-xs text-gray-500 mb-1">Pace</div>
										<div className="text-xl font-bold text-gray-200">
											{stats.totalDistance > 0 && stats.totalMovingTime > 0
												? (() => {
													const avgSpeed = stats.totalDistance / stats.totalMovingTime; 
													const minutesPerKm = 1000 / (avgSpeed * 60);
													const minutes = Math.floor(minutesPerKm);
													const seconds = Math.round((minutesPerKm - minutes) * 60);
													return `${minutes}:${seconds.toString().padStart(2, '0')}`;
												})()
												: 'N/A'} <span className="text-xs text-gray-500">min/km</span>
										</div>
									</div>
								</div>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-12 text-gray-400">
						<FontAwesomeIcon icon={faCalendar} className="w-12 h-12 text-gray-600 mx-auto mb-3" />
						<p>No data available yet. Start capturing hexagons!</p>
					</div>
				)}

				{}
				{isOwnProfile && (
				<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-red-500/20 rounded-xl p-6">
					<div className="flex items-start gap-3 mb-4">
						<FontAwesomeIcon icon="exclamation-triangle" className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
						<div className="text-sm text-red-400">
							<p className="font-semibold mb-1">Danger Zone</p>
							<p className="text-xs">Deleting your account permanently removes all activities and hexagons. This cannot be undone.</p>
						</div>
					</div>

					<button
						onClick={handleDeleteAccount}
						disabled={deletingAccount}
						className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
							showDeleteConfirm
								? 'bg-red-600 hover:bg-red-700 text-white'
								: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
						}`}
					>
						<FontAwesomeIcon icon="trash" className="w-4 h-4" />
						{deletingAccount
							? 'Deleting...'
							: showDeleteConfirm
								? 'Click Again to Confirm'
								: 'Delete Account'}
					</button>

					{showDeleteConfirm && (
						<button
							onClick={() => setShowDeleteConfirm(false)}
							className="w-full mt-2 text-sm text-gray-400 hover:text-gray-300 cursor-pointer"
						>
							Cancel
						</button>
					)}
				</div>
				)}
			</div>

			<ActivitiesModal
				isOpen={showModal}
				onClose={closeModal}
				onFetchActivities={loadStravaActivities}
				stravaActivities={activities}
				loadingStrava={loading}
				onProcess={handleSaveActivity}
				onDeleteStrava={handleRemoveActivity}
			/>

			<style>{`
				.hex-clip {
					clip-path: polygon(50% 5%, 95% 27.5%, 95% 72.5%, 50% 95%, 5% 72.5%, 5% 27.5%);
				}
			`}</style>
		</div>
	);
}
