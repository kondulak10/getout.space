import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/pro-solid-svg-icons';
import { formatDistance, formatTime, formatPace } from '@/utils/dateFormatter';

interface ProfileAveragesProps {
	totalActivities: number;
	totalDistance: number;
	totalMovingTime: number;
	totalHexagons: number;
}

export function ProfileAverages({
	totalActivities,
	totalDistance,
	totalMovingTime,
	totalHexagons
}: ProfileAveragesProps) {

	if (totalActivities === 0) {
		return null;
	}

	return (
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
						{formatDistance(totalDistance / totalActivities)}
					</div>
				</div>
				<div className="text-center">
					<div className="text-xs text-gray-500 mb-1">Duration</div>
					<div className="text-xl font-bold text-gray-200">
						{formatTime(totalMovingTime / totalActivities)}
					</div>
				</div>
				<div className="text-center">
					<div className="text-xs text-gray-500 mb-1">Hexes Captured</div>
					<div className="text-xl font-bold text-gray-200">
						{Math.round(totalHexagons / totalActivities)}
					</div>
				</div>
				<div className="text-center">
					<div className="text-xs text-gray-500 mb-1">Pace</div>
					<div className="text-xl font-bold text-gray-200">
						{formatPace(totalDistance / totalActivities, totalMovingTime / totalActivities)}
					</div>
				</div>
			</div>
		</div>
	);
}
