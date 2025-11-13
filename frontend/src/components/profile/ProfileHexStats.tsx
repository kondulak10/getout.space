import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHexagon, faRoute, faChartLine } from '@fortawesome/pro-solid-svg-icons';
import { formatTime } from '@/utils/dateFormatter';

interface ProfileHexStatsProps {
	totalHexagons: number;
	totalActivities: number;
	totalDistance: number;
	totalMovingTime: number;
	daysSinceLastActivity: number | null;
	approximateArea: string;
	loading?: boolean;
}

export function ProfileHexStats({
	totalHexagons,
	totalActivities,
	totalDistance,
	totalMovingTime,
	daysSinceLastActivity,
	approximateArea,
	loading
}: ProfileHexStatsProps) {

	if (loading) {
		return (
			<div className="grid grid-cols-3 gap-4 md:gap-8">
				{[1, 2, 3].map((i) => (
					<div key={i} className="flex flex-col items-center animate-pulse">
						<div className="relative w-24 h-24 mb-3">
							<svg viewBox="0 0 100 100" className="w-full h-full">
								<polygon
									points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
									fill="rgb(31, 41, 55)"
									stroke="rgb(75, 85, 99)"
									strokeWidth="2"
								/>
							</svg>
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="w-12 h-8 bg-gray-700 rounded"></div>
							</div>
						</div>
						<div className="w-24 h-4 bg-gray-700 rounded mb-2"></div>
						<div className="w-20 h-3 bg-gray-800 rounded"></div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-3 gap-4 md:gap-8">
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
						<div className="text-4xl font-bold text-white">{totalHexagons}</div>
					</div>
				</div>
				<div className="text-center">
					<div className="flex items-center justify-center gap-2 mb-1">
						<FontAwesomeIcon icon={faHexagon} className="w-4 h-4 text-orange-400" />
						<h3 className="text-base font-bold text-white">Territory</h3>
					</div>
					<div className="text-xs text-gray-400">~{approximateArea} km² area</div>
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
						<div className="text-4xl font-bold text-white">{totalActivities}</div>
					</div>
				</div>
				<div className="text-center">
					<div className="flex items-center justify-center gap-2 mb-1">
						<FontAwesomeIcon icon={faRoute} className="w-4 h-4 text-blue-400" />
						<h3 className="text-base font-bold text-white">Activities</h3>
					</div>
					{daysSinceLastActivity !== null ? (
						<div className="text-xs text-gray-400">
							Last: {daysSinceLastActivity === 0 ? 'today' : `${daysSinceLastActivity}d ago`}
						</div>
					) : (
						<div className="text-xs text-gray-400">Total runs completed</div>
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
						<div className="text-4xl font-bold text-white">{(totalDistance / 1000).toFixed(0)}</div>
					</div>
				</div>
				<div className="text-center">
					<div className="flex items-center justify-center gap-2 mb-1">
						<FontAwesomeIcon icon={faChartLine} className="w-4 h-4 text-green-400" />
						<h3 className="text-base font-bold text-white">Distance</h3>
					</div>
					{totalMovingTime > 0 ? (
						<div className="text-xs text-gray-400">{formatTime(totalMovingTime)} moving</div>
					) : (
						<div className="text-xs text-gray-400">Kilometers covered</div>
					)}
				</div>
			</div>
		</div>
	);
}
