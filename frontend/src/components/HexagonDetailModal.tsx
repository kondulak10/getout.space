import { X, ExternalLink, Loader2 } from 'lucide-react';

interface HexagonActivity {
	stravaActivityId: number;
	name: string;
	distance: number;
	averageSpeed: number;
	startDateLocal: string;
	movingTime: number;
}

interface HexagonDetailModalProps {
	activity?: HexagonActivity;
	hexagonId?: string;
	captureCount?: number;
	loading?: boolean;
	onClose: () => void;
}

export function HexagonDetailModal({
	activity,
	hexagonId,
	captureCount,
	loading = false,
	onClose,
}: HexagonDetailModalProps) {
	const formatDistance = (meters: number) => {
		return (meters / 1000).toFixed(2) + ' km';
	};

	const formatSpeed = (metersPerSecond: number) => {
		// Convert m/s to min/km
		const minutesPerKm = 1000 / (metersPerSecond * 60);
		const minutes = Math.floor(minutesPerKm);
		const seconds = Math.round((minutesPerKm - minutes) * 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return 'Invalid date';
		}
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const stravaUrl = activity ? `https://www.strava.com/activities/${activity.stravaActivityId}` : '';

	return (
		<div
			className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
			onClick={onClose}
		>
			<div
				className="bg-[rgba(10,10,10,0.95)] backdrop-blur-md border border-white/10 rounded-xl shadow-2xl max-w-md w-full"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-white/10">
					<h2 className="text-lg font-semibold text-gray-100">Hexagon Details</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-200 transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4 space-y-4">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="w-8 h-8 animate-spin text-orange-500" />
						</div>
					) : activity ? (
						<>
					{/* Activity Name */}
					<div>
						<div className="text-sm font-semibold text-gray-400 mb-1">Activity</div>
						<div className="text-base font-medium text-gray-100">{activity.name}</div>
					</div>

					{/* Stats Grid */}
					<div className="grid grid-cols-2 gap-4">
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
								{activity.startDateLocal ? formatDate(activity.startDateLocal) : 'N/A'}
							</div>
						</div>
						<div>
							<div className="text-xs text-gray-500 mb-1">Captures</div>
							<div className="text-sm font-semibold text-gray-200">{captureCount}x</div>
						</div>
					</div>

					{/* Hexagon ID */}
					<div>
						<div className="text-xs text-gray-500 mb-1">Hexagon ID</div>
						<div className="text-xs font-mono text-gray-300 bg-white/5 border border-white/10 p-2 rounded break-all">
							{hexagonId}
						</div>
					</div>

					{/* View on Strava Link */}
					<div className="pt-2">
						<a
							href={stravaUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-[#FC5200] hover:text-[#E34402] text-sm font-medium underline transition-colors inline-flex items-center gap-1.5"
						>
							<ExternalLink className="w-4 h-4" />
							View on Strava
						</a>
					</div>
						</>
					) : (
						<div className="text-center py-12 text-gray-400">
							No activity data found for this hexagon.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
