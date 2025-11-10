import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faXmark,
	faExternalLink,
	faSpinner,
	faUser,
	faCrown,
	faTrophy,
	faFire,
	faSparkles,
} from '@fortawesome/pro-solid-svg-icons';
import { SelectedHexagonData } from '@/hooks/useHexagonSelection';
import { ErrorBoundary } from './ErrorBoundary';

interface HexagonDetailModalProps {
	hexagonData?: SelectedHexagonData;
	loading?: boolean;
	onClose: () => void;
}

export function HexagonDetailModal({ hexagonData, loading = false, onClose }: HexagonDetailModalProps) {
	console.log('🎨 HexagonDetailModal rendering with:', { hexagonData, loading });

	const formatDistance = (meters?: number) => {
		if (!meters || isNaN(meters)) return 'N/A';
		return (meters / 1000).toFixed(2) + ' km';
	};

	const formatSpeed = (metersPerSecond?: number) => {
		if (!metersPerSecond || isNaN(metersPerSecond) || metersPerSecond === 0) return 'N/A';
		const minutesPerKm = 1000 / (metersPerSecond * 60);
		if (!isFinite(minutesPerKm)) return 'N/A';
		const minutes = Math.floor(minutesPerKm);
		const seconds = Math.round((minutesPerKm - minutes) * 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
	};

	const formatDate = (dateString?: string | null) => {
		if (!dateString) {
			return 'Unknown date';
		}
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				return 'Invalid date';
			}
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			});
		} catch (err) {
			console.error('Error formatting date:', dateString, err);
			return 'Invalid date';
		}
	};

	const renderUserAvatar = (
		user?: {
			stravaProfile?: { firstname?: string; profile?: string };
			stravaId?: number;
		},
		size: 'sm' | 'md' | 'lg' = 'md',
		showName: boolean = true
	) => {
		if (!user) {
			const sizeClasses = size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-12 h-12' : 'w-10 h-10';
			const iconSize = size === 'lg' ? 'w-8 h-8' : size === 'md' ? 'w-6 h-6' : 'w-5 h-5';
			return (
				<div className="flex items-center gap-3">
					<div
						className={`${sizeClasses} rounded-full bg-gray-500/20 border-2 border-gray-500/40 flex items-center justify-center`}
					>
						<FontAwesomeIcon icon={faUser} className={`${iconSize} text-gray-500`} />
					</div>
					{showName && <span className="text-sm font-medium text-gray-400">Unknown</span>}
				</div>
			);
		}

		const displayName =
			user.stravaProfile?.firstname || (user.stravaId ? `User ${user.stravaId}` : 'Unknown');
		const profileUrl = user.stravaProfile?.profile;
		const sizeClasses = size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-12 h-12' : 'w-10 h-10';
		const iconSize = size === 'lg' ? 'w-8 h-8' : size === 'md' ? 'w-6 h-6' : 'w-5 h-5';

		return (
			<div className="flex items-center gap-3">
				{profileUrl ? (
					<img
						src={profileUrl}
						alt={displayName}
						className={`${sizeClasses} rounded-full border-2 border-white/20 object-cover shadow-lg`}
						onError={(e) => {
							(e.target as HTMLImageElement).style.display = 'none';
							const fallback = (e.target as HTMLImageElement).nextElementSibling;
							if (fallback) (fallback as HTMLElement).style.display = 'flex';
						}}
					/>
				) : (
					<div
						className={`${sizeClasses} rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/30 border-2 border-orange-500/40 flex items-center justify-center shadow-lg`}
					>
						<FontAwesomeIcon icon={faUser} className={`${iconSize} text-orange-400`} />
					</div>
				)}
				{profileUrl && (
					<div
						className={`${sizeClasses} rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/30 border-2 border-orange-500/40 flex items-center justify-center shadow-lg`}
						style={{ display: 'none' }}
					>
						<FontAwesomeIcon icon={faUser} className={`${iconSize} text-orange-400`} />
					</div>
				)}
				{showName && <span className="text-base font-bold text-gray-100">{displayName}</span>}
			</div>
		);
	};

	const activity = hexagonData?.activity;
	const stravaUrl = activity ? `https://www.strava.com/activities/${activity.stravaActivityId}` : '';

	// Count captures per user for leaderboard
	const captureCountByUser = hexagonData?.captureHistory?.reduce(
		(acc, entry) => {
			const userId = entry.userId;
			acc[userId] = (acc[userId] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);

	// Get unique fighters sorted by capture count
	const fighters = hexagonData?.captureHistory
		? Array.from(
				new Map(
					hexagonData.captureHistory.map((entry) => [
						entry.userId,
						{ user: entry.user, count: captureCountByUser?.[entry.userId] || 0 },
					])
				).values()
		  ).sort((a, b) => b.count - a.count)
		: [];

	const getMedalColor = (rank: number) => {
		if (rank === 0) return 'text-yellow-400'; // Gold
		if (rank === 1) return 'text-gray-300'; // Silver
		if (rank === 2) return 'text-amber-600'; // Bronze
		return 'text-gray-500';
	};

	return (
		<div
			className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
			onClick={onClose}
		>
			<div
				className="bg-gradient-to-b from-[rgba(10,10,10,0.98)] to-[rgba(5,5,5,0.98)] backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-[rgba(10,10,10,0.98)] backdrop-blur-md z-10">
					<div className="flex items-center gap-2">
						<FontAwesomeIcon icon={faTrophy} className="w-5 h-5 text-orange-500" />
						<h2 className="text-lg font-bold text-gray-100">Battle Arena</h2>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-lg"
					>
						<FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
					</button>
				</div>

				<div className="p-5 space-y-5">
					<ErrorBoundary
						fallback={
							<div className="text-center py-12 text-red-400">
								<p className="font-semibold mb-2">Failed to render hexagon details</p>
								<p className="text-sm text-gray-400">Check console for details</p>
							</div>
						}
					>
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<FontAwesomeIcon icon={faSpinner} spin className="w-8 h-8 text-orange-500" />
							</div>
						) : hexagonData && activity ? (
							<>
								{/* Current Champion Card */}
								<div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-transparent border-2 border-orange-500/40 p-5 shadow-xl">
									<div className="absolute top-2 right-2">
										<FontAwesomeIcon icon={faCrown} className="w-8 h-8 text-yellow-400 drop-shadow-lg animate-pulse" />
									</div>

									<div className="flex items-center gap-2 mb-4">
										<FontAwesomeIcon icon={faTrophy} className="w-5 h-5 text-orange-400" />
										<h3 className="text-sm font-bold text-orange-400 uppercase tracking-wide">
											Current Champion
										</h3>
									</div>

									<div className="mb-4">{renderUserAvatar(hexagonData.currentOwner, 'lg')}</div>

									<div className="grid grid-cols-3 gap-3 mb-4">
										<div className="bg-black/30 rounded-lg p-3 text-center">
											<div className="text-xs text-gray-400 mb-1">Distance</div>
											<div className="text-sm font-bold text-orange-400">
												{formatDistance(activity.distance)}
											</div>
										</div>
										<div className="bg-black/30 rounded-lg p-3 text-center">
											<div className="text-xs text-gray-400 mb-1">Pace</div>
											<div className="text-sm font-bold text-orange-400">
												{formatSpeed(activity.averageSpeed)}
											</div>
										</div>
										<div className="bg-black/30 rounded-lg p-3 text-center">
											<div className="text-xs text-gray-400 mb-1">Held Since</div>
											<div className="text-xs font-bold text-orange-400">
												{formatDate(activity.startDateLocal)}
											</div>
										</div>
									</div>

									<a
										href={stravaUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 bg-[#FC5200] hover:bg-[#E34402] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-lg"
									>
										<FontAwesomeIcon icon={faExternalLink} className="w-4 h-4" />
										View Activity
									</a>
								</div>

								{/* OG Discoverer Badge */}
								<div className="rounded-xl bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-transparent border-2 border-blue-500/30 p-4 shadow-lg">
									<div className="flex items-center gap-2 mb-3">
										<FontAwesomeIcon icon={faSparkles} className="w-5 h-5 text-blue-400" />
										<h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide">
											OG Discoverer
										</h3>
									</div>

									<div className="flex items-center justify-between">
										{renderUserAvatar(hexagonData.firstCapturedBy, 'md')}
										<div className="text-right">
											<div className="text-xs text-gray-400">Discovered</div>
											<div className="text-sm font-bold text-blue-400">
												{formatDate(hexagonData.firstCapturedAt)}
											</div>
										</div>
									</div>
								</div>

								{/* Battle Stats */}
								<div className="rounded-xl bg-white/5 border border-white/10 p-4">
									<div className="flex items-center gap-2 mb-3">
										<FontAwesomeIcon icon={faFire} className="w-5 h-5 text-red-400" />
										<h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">
											Battle Stats
										</h3>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-gray-400 text-sm">Total Captures</span>
										<span className="text-2xl font-bold text-red-400">
											{hexagonData.captureCount}x
										</span>
									</div>
								</div>

								{/* Fighters Leaderboard */}
								{fighters.length > 0 && (
									<div className="space-y-3">
										<div className="flex items-center gap-2">
											<FontAwesomeIcon icon={faTrophy} className="w-5 h-5 text-yellow-400" />
											<h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">
												Top Fighters
											</h3>
										</div>

										<div className="space-y-2">
											{fighters.slice(0, 5).map((fighter, index) => (
												<div
													key={fighter.user?.id || index}
													className={`rounded-lg p-3 flex items-center justify-between transition-all ${
														index === 0
															? 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30'
															: index === 1
															? 'bg-gradient-to-r from-gray-400/20 to-transparent border border-gray-400/30'
															: index === 2
															? 'bg-gradient-to-r from-amber-700/20 to-transparent border border-amber-700/30'
															: 'bg-white/5 border border-white/10'
													}`}
												>
													<div className="flex items-center gap-3 flex-1">
														<div className="flex items-center justify-center w-8">
															{index < 3 ? (
																<FontAwesomeIcon icon={faTrophy} className={`w-5 h-5 ${getMedalColor(index)}`} />
															) : (
																<span className="text-sm font-bold text-gray-500">
																	#{index + 1}
																</span>
															)}
														</div>
														{renderUserAvatar(fighter.user, 'sm', true)}
													</div>
													<div className="flex items-center gap-2">
														<span className="text-lg font-bold text-gray-200">
															{fighter.count}
														</span>
														<span className="text-xs text-gray-400">
															{fighter.count === 1 ? 'capture' : 'captures'}
														</span>
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Hexagon ID */}
								<div className="pt-3 border-t border-white/10">
									<div className="text-xs text-gray-500 mb-2">Hexagon ID</div>
									<div className="text-xs font-mono text-gray-400 bg-black/30 border border-white/10 p-2 rounded break-all">
										{hexagonData.hexagonId}
									</div>
								</div>
							</>
						) : (
							<div className="text-center py-12 text-gray-400">
								<FontAwesomeIcon icon={faTrophy} className="w-12 h-12 text-gray-600 mx-auto mb-3" />
								<p>No activity data found for this hexagon.</p>
							</div>
						)}
					</ErrorBoundary>
				</div>
			</div>
		</div>
	);
}
