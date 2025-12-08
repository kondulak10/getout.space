import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faClock } from '@fortawesome/pro-solid-svg-icons';

interface HexagonData {
	hexagonId: string;
	captureCount: number;
	lastCapturedAt: unknown;
}

interface ProfileRecordsProps {
	mostContested: HexagonData | null;
	longestHeld: HexagonData | null;
	daysHeld: number;
	loading?: boolean;
}

export function ProfileRecords({ mostContested, longestHeld, daysHeld, loading }: ProfileRecordsProps) {
	if (loading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{[1, 2].map((i) => (
					<div key={i} className="rounded-xl bg-white/5 border border-white/10 p-5 animate-pulse">
						<div className="flex items-center gap-2 mb-3">
							<div className="w-5 h-5 bg-gray-700 rounded"></div>
							<div className="h-4 w-32 bg-gray-700 rounded"></div>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<div className="w-16 h-3 bg-gray-700 rounded mb-2"></div>
								<div className="w-12 h-8 bg-gray-700 rounded"></div>
							</div>
							<div className="text-right">
								<div className="w-16 h-3 bg-gray-700 rounded mb-2"></div>
								<div className="w-24 h-3 bg-gray-700 rounded"></div>
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{/* Most Contested Hex */}
			{mostContested && (
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
								{mostContested.captureCount}x
							</div>
						</div>
						<div className="text-right">
							<div className="text-xs text-gray-500 mb-1">Hexagon ID</div>
							<div className="text-xs font-mono text-gray-400 max-w-[200px] truncate">
								{mostContested.hexagonId}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Longest Held */}
			{longestHeld && (
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
							<div className="text-3xl font-bold text-cyan-400">{daysHeld}d</div>
						</div>
						<div className="text-right">
							<div className="text-xs text-gray-500 mb-1">Captured On</div>
							<div className="text-xs text-gray-400">
								{new Date(longestHeld.lastCapturedAt as string).toLocaleDateString('en-US', {
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
	);
}
