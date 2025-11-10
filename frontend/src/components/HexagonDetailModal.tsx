import { X, ExternalLink, Loader2, User as UserIcon } from 'lucide-react';
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
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch (err) {
			console.error('Error formatting date:', dateString, err);
			return 'Invalid date';
		}
	};

	const renderUserAvatar = (user?: {
		stravaProfile?: { firstname?: string; profile?: string };
		stravaId?: number;
	}) => {
		if (!user) {
			return (
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-full bg-gray-500/20 border border-gray-500/40 flex items-center justify-center">
						<UserIcon className="w-4 h-4 text-gray-500" />
					</div>
					<span className="text-sm font-medium text-gray-400">Unknown User</span>
				</div>
			);
		}

		const displayName = user.stravaProfile?.firstname || (user.stravaId ? `User ${user.stravaId}` : 'Unknown User');

		return (
			<div className="flex items-center gap-2">
				{user.stravaProfile?.profile ? (
					<img
						src={user.stravaProfile.profile}
						alt={displayName}
						className="w-8 h-8 rounded-full border border-white/20"
						onError={(e) => {
							// Fallback if image fails to load
							(e.target as HTMLImageElement).style.display = 'none';
							const fallback = (e.target as HTMLImageElement).nextElementSibling;
							if (fallback) (fallback as HTMLElement).style.display = 'flex';
						}}
					/>
				) : null}
				<div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center" style={{ display: user.stravaProfile?.profile ? 'none' : 'flex' }}>
					<UserIcon className="w-4 h-4 text-orange-500" />
				</div>
				<span className="text-sm font-medium text-gray-200">{displayName}</span>
			</div>
		);
	};

	const activity = hexagonData?.activity;
	const stravaUrl = activity ? `https://www.strava.com/activities/${activity.stravaActivityId}` : '';

	return (
		<div
			className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
			onClick={onClose}
		>
			<div
				className="bg-[rgba(10,10,10,0.95)] backdrop-blur-md border border-white/10 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-[rgba(10,10,10,0.95)] z-10">
					<h2 className="text-lg font-semibold text-gray-100">Hexagon Details</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-200 transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-4 space-y-6">
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
								<Loader2 className="w-8 h-8 animate-spin text-orange-500" />
							</div>
						) : hexagonData && activity ? (
						<>
							{/* Current Owner Section */}
							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-orange-500 uppercase tracking-wide">
									Current Owner
								</h3>
								<div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
									{renderUserAvatar(hexagonData.currentOwner)}

									<div className="grid grid-cols-2 gap-3">
										<div>
											<div className="text-xs text-gray-500 mb-1">Distance</div>
											<div className="text-sm font-semibold text-gray-200">
												{formatDistance(activity.distance)}
											</div>
										</div>
										<div>
											<div className="text-xs text-gray-500 mb-1">Pace</div>
											<div className="text-sm font-semibold text-gray-200">
												{formatSpeed(activity.averageSpeed)}
											</div>
										</div>
										<div>
											<div className="text-xs text-gray-500 mb-1">Date</div>
											<div className="text-sm font-semibold text-gray-200">
												{formatDate(activity.startDateLocal)}
											</div>
										</div>
										<div>
											<div className="text-xs text-gray-500 mb-1">Captures</div>
											<div className="text-sm font-semibold text-gray-200">
												{hexagonData.captureCount}x
											</div>
										</div>
									</div>

									<div>
										<a
											href={stravaUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-[#FC5200] hover:text-[#E34402] text-sm font-medium transition-colors inline-flex items-center gap-1.5"
										>
											<ExternalLink className="w-4 h-4" />
											View on Strava
										</a>
									</div>
								</div>
							</div>

							{/* First Discoverer Section */}
							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
									First Discoverer
								</h3>
								<div className="bg-white/5 border border-white/10 rounded-lg p-4">
									{renderUserAvatar(hexagonData.firstCapturedBy)}
									<div className="text-xs text-gray-500 mt-2">
										Captured on {formatDate(hexagonData.firstCapturedAt)}
									</div>
								</div>
							</div>

							{/* Capture History Section */}
							{hexagonData.captureHistory && hexagonData.captureHistory.length > 0 && (
								<div className="space-y-3">
									<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
										Capture History ({hexagonData.captureHistory.length})
									</h3>
									<div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
										<div className="max-h-64 overflow-y-auto">
											<table className="w-full text-sm">
												<thead className="bg-white/5 sticky top-0">
													<tr>
														<th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
															Owner
														</th>
														<th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
															Date
														</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-white/5">
													{hexagonData.captureHistory.map((entry, index) => (
														<tr key={index} className="hover:bg-white/5 transition-colors">
															<td className="p-3">{renderUserAvatar(entry.user)}</td>
															<td className="p-3">
																<div className="text-sm text-gray-300">
																	{formatDate(entry.capturedAt)}
																</div>
																<div className="text-xs text-gray-500">{entry.activityType}</div>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							)}

							{/* Hexagon ID */}
							<div>
								<div className="text-xs text-gray-500 mb-2">Hexagon ID</div>
								<div className="text-xs font-mono text-gray-300 bg-white/5 border border-white/10 p-2 rounded break-all">
									{hexagonData.hexagonId}
								</div>
							</div>
						</>
					) : (
						<div className="text-center py-12 text-gray-400">
							No activity data found for this hexagon.
						</div>
					)}
					</ErrorBoundary>
				</div>
			</div>
		</div>
	);
}
