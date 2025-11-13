import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/pro-solid-svg-icons';

interface ProfileVersusStatsProps {
	// Profile owner (left side)
	profileUserImage?: string | null;
	profileUserName: string;
	profileUserTotalHexagons: number;
	profileUserStolenFromCurrent: number;

	// Current user (right side)
	currentUserImage?: string | null;
	currentUserName: string;
	currentUserTotalHexagons: number;
	currentUserStolenFromProfile: number;

	loading?: boolean;
}

export function ProfileVersusStats({
	profileUserImage,
	profileUserName,
	profileUserTotalHexagons,
	profileUserStolenFromCurrent,
	currentUserImage,
	currentUserName,
	currentUserTotalHexagons,
	currentUserStolenFromProfile,
	loading
}: ProfileVersusStatsProps) {
	// Calculate percentages for the bars
	const totalHexagonsSum = profileUserTotalHexagons + currentUserTotalHexagons;
	const profileTerritoryPercent =
		totalHexagonsSum > 0 ? (profileUserTotalHexagons / totalHexagonsSum) * 100 : 50;
	const currentTerritoryPercent = totalHexagonsSum > 0 ? 100 - profileTerritoryPercent : 50;

	const totalStolenSum = profileUserStolenFromCurrent + currentUserStolenFromProfile;
	const profileStolenPercent =
		totalStolenSum > 0 ? (profileUserStolenFromCurrent / totalStolenSum) * 100 : 50;
	const currentStolenPercent = totalStolenSum > 0 ? 100 - profileStolenPercent : 50;

	const renderAvatar = (imageUrl?: string | null, name?: string) => {
		if (imageUrl) {
			return (
				<img
					src={imageUrl}
					alt={name || 'User'}
					className="w-16 h-16 object-cover shadow-lg"
					onError={(e) => {
						(e.target as HTMLImageElement).style.display = 'none';
						const fallback = (e.target as HTMLImageElement).nextElementSibling;
						if (fallback) (fallback as HTMLElement).style.display = 'flex';
					}}
				/>
			);
		}
		return (
			<div className="w-16 h-16 bg-gradient-to-br from-gray-500/30 to-gray-600/30 border-2 border-gray-500/40 flex items-center justify-center shadow-lg">
				<FontAwesomeIcon icon={faUser} className="w-8 h-8 text-gray-400" />
			</div>
		);
	};

	if (loading) {
		return (
			<div className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
				<div className="h-6 w-48 bg-gray-700 rounded mb-4"></div>
				<div className="space-y-6">
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 bg-gray-700"></div>
						<div className="flex-1 h-12 bg-gray-700 rounded"></div>
						<div className="w-16 h-16 bg-gray-700"></div>
					</div>
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 bg-gray-700"></div>
						<div className="flex-1 h-12 bg-gray-700 rounded"></div>
						<div className="w-16 h-16 bg-gray-700"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white/5 border border-white/10 rounded-xl p-6">
			<h3 className="text-lg font-bold text-gray-200 mb-6 text-center">Head-to-Head Comparison</h3>

			<div className="space-y-6">
				{/* Total Territory */}
				<div>
					<div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 text-center">
						Total Territory
					</div>
					<div className="flex items-center gap-4">
						{/* Profile user avatar */}
						{renderAvatar(profileUserImage, profileUserName)}

						{/* Progress bar container */}
						<div className="flex-1">
							<div className="relative h-12 bg-gray-800 rounded-lg overflow-hidden">
								{/* Profile user side (left) - white/gray */}
								<div
									className="absolute left-0 top-0 h-full bg-gradient-to-r from-gray-300 to-gray-400 transition-all duration-500"
									style={{ width: `${profileTerritoryPercent}%` }}
								></div>
								{/* Current user side (right) - orange */}
								<div
									className="absolute right-0 top-0 h-full bg-gradient-to-l from-orange-500 to-orange-400 transition-all duration-500"
									style={{ width: `${currentTerritoryPercent}%` }}
								></div>

								{/* Numbers overlay */}
								<div className="absolute inset-0 flex items-center justify-between px-4">
									<span className="text-sm font-bold text-gray-900">
										{profileUserTotalHexagons}
									</span>
									<span className="text-sm font-bold text-white">
										{currentUserTotalHexagons}
									</span>
								</div>
							</div>
						</div>

						{/* Current user avatar */}
						{renderAvatar(currentUserImage, currentUserName)}
					</div>
				</div>

				{/* Head-to-Head Battles */}
				<div>
					<div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 text-center">
						Hexes Stolen From Each Other
					</div>
					<div className="flex items-center gap-4">
						{/* Profile user avatar */}
						{renderAvatar(profileUserImage, profileUserName)}

						{/* Progress bar container */}
						<div className="flex-1">
							<div className="relative h-12 bg-gray-800 rounded-lg overflow-hidden">
								{/* Profile user side (left) - white/gray */}
								<div
									className="absolute left-0 top-0 h-full bg-gradient-to-r from-gray-300 to-gray-400 transition-all duration-500"
									style={{ width: `${profileStolenPercent}%` }}
								></div>
								{/* Current user side (right) - orange */}
								<div
									className="absolute right-0 top-0 h-full bg-gradient-to-l from-orange-500 to-orange-400 transition-all duration-500"
									style={{ width: `${currentStolenPercent}%` }}
								></div>

								{/* Numbers overlay */}
								<div className="absolute inset-0 flex items-center justify-between px-4">
									<span className="text-sm font-bold text-gray-900">
										{profileUserStolenFromCurrent}
									</span>
									<span className="text-sm font-bold text-white">
										{currentUserStolenFromProfile}
									</span>
								</div>
							</div>
							{totalStolenSum === 0 && (
								<p className="text-xs text-gray-500 text-center mt-2">
									No battles between you yet
								</p>
							)}
						</div>

						{/* Current user avatar */}
						{renderAvatar(currentUserImage, currentUserName)}
					</div>
				</div>
			</div>

			{/* Legend */}
			<div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded"></div>
					<span>{profileUserName}</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-orange-400 rounded"></div>
					<span>{currentUserName}</span>
				</div>
			</div>
		</div>
	);
}
