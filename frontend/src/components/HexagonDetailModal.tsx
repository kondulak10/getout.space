import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faExternalLink,
	faSpinner,
	faCrown,
	faTrophy,
	faFire,
	faSparkles,
} from '@fortawesome/pro-solid-svg-icons';
import { SelectedHexagonData } from '@/hooks/useHexagonSelection';
import { ErrorBoundary } from './ErrorBoundary';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useNavigate } from 'react-router-dom';
interface HexagonDetailModalProps {
	hexagonData?: SelectedHexagonData;
	loading?: boolean;
	onClose: () => void;
}
export function HexagonDetailModal({ hexagonData, loading = false, onClose }: HexagonDetailModalProps) {
	const navigate = useNavigate();

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
		} catch {
			return 'Invalid date';
		}
	};

	const activity = hexagonData?.activity;
	const stravaUrl = activity ? `https://www.strava.com/activities/${activity.stravaActivityId}` : '';
	const captureCountByUser = hexagonData?.captureHistory?.reduce(
		(acc, entry) => {
			const userId = entry.userId;
			acc[userId] = (acc[userId] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);
	// Only include fighters who have captured this hex more than once (actual battles)
	const fighters = hexagonData?.captureHistory
		? Array.from(
				new Map(
					hexagonData.captureHistory.map((entry) => [
						entry.userId,
						{ user: entry.user, count: captureCountByUser?.[entry.userId] || 0 },
					])
				).values()
		  )
				.filter((fighter) => fighter.count > 1) // Only show users with multiple captures
				.sort((a, b) => b.count - a.count)
		: [];
	const getMedalColor = (rank: number) => {
		if (rank === 0) return 'text-yellow-400'; 
		if (rank === 1) return 'text-gray-300'; 
		if (rank === 2) return 'text-amber-600'; 
		return 'text-gray-500';
	};
	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose()}>
			<DialogContent data-testid="hexagon-modal">
				<DialogHeader>
					<DialogTitle>
						<FontAwesomeIcon icon={faTrophy} className="w-5 h-5 text-orange-500" />
						Battle Arena
					</DialogTitle>
				</DialogHeader>
				<DialogBody className="space-y-5">
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
								{}
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
									<div className="mb-4">
										<UserAvatar
											user={hexagonData.currentOwner}
											size="lg"
											showName={true}
											onClick={() => hexagonData.currentOwner?.id && navigate(`/profile/${hexagonData.currentOwner.id}`)}
										/>
									</div>
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
								{}
								<div className="rounded-xl bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-transparent border-2 border-blue-500/30 p-4 shadow-lg">
									<div className="flex items-center gap-2 mb-3">
										<FontAwesomeIcon icon={faSparkles} className="w-5 h-5 text-blue-400" />
										<h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide">
											OG Discoverer
										</h3>
									</div>
									<div className="flex items-center justify-between">
										<UserAvatar
											user={hexagonData.firstCapturedBy}
											size="md"
											showName={true}
											onClick={() => hexagonData.firstCapturedBy?.id && navigate(`/profile/${hexagonData.firstCapturedBy.id}`)}
										/>
										<div className="text-right">
											<div className="text-xs text-gray-400">Discovered</div>
											<div className="text-sm font-bold text-blue-400">
												{formatDate(hexagonData.firstCapturedAt)}
											</div>
										</div>
									</div>
								</div>
								{}
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
								{}
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<FontAwesomeIcon icon={faTrophy} className="w-5 h-5 text-yellow-400" />
										<h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">
											Top Fighters
										</h3>
									</div>
									{fighters.length > 0 ? (
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
														<UserAvatar
															user={fighter.user}
															size="sm"
															showName={true}
															onClick={() => fighter.user?.id && navigate(`/profile/${fighter.user.id}`)}
														/>
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
									) : (
										<div className="text-center py-6 bg-white/5 border border-white/10 rounded-lg">
											<FontAwesomeIcon icon={faSparkles} className="w-8 h-8 text-gray-600 mx-auto mb-2" />
											<p className="text-sm text-gray-400">No epic battles yet</p>
											<p className="text-xs text-gray-500 mt-1">
												This hex hasn't changed hands multiple times
											</p>
										</div>
									)}
								</div>
								{}
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
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
}
