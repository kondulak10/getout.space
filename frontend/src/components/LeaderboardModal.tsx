import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faSpinner, faUser, faCrown, faSparkles } from '@fortawesome/pro-solid-svg-icons';
import { useQuery } from '@apollo/client/react';
import { RegionalActiveLeadersDocument, RegionalOgDiscoverersDocument } from '@/gql/graphql';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';

interface LeaderboardModalProps {
	parentHexagonIds: string[];
	onClose: () => void;
}

type TabType = 'active' | 'og';

export function LeaderboardModal({ parentHexagonIds, onClose }: LeaderboardModalProps) {
	const [activeTab, setActiveTab] = useState<TabType>('active');

	const safeParentHexagonIds = Array.isArray(parentHexagonIds) ? parentHexagonIds.filter(Boolean) : [];
	const shouldSkip = safeParentHexagonIds.length === 0;

	const {
		data: activeLeadersData,
		loading: activeLoading,
		error: activeError,
	} = useQuery(RegionalActiveLeadersDocument, {
		variables: { parentHexagonIds: safeParentHexagonIds, limit: 10 },
		skip: shouldSkip,
		errorPolicy: 'all',
		fetchPolicy: 'no-cache',
	});

	const {
		data: ogDiscoverersData,
		loading: ogLoading,
		error: ogError,
	} = useQuery(RegionalOgDiscoverersDocument, {
		variables: { parentHexagonIds: safeParentHexagonIds, limit: 10 },
		skip: shouldSkip,
		errorPolicy: 'all',
		fetchPolicy: 'no-cache',
	});

	const renderUserAvatar = (
		user?: {
			stravaProfile?: { firstname?: string | null; lastname?: string | null; profile?: string | null; imghex?: string | null };
			stravaId?: number;
		} | null,
		size: 'sm' | 'md' = 'md'
	) => {
		if (!user) {
			const sizeClasses = size === 'md' ? 'w-12 h-12' : 'w-10 h-10';
			const iconSize = size === 'md' ? 'w-6 h-6' : 'w-5 h-5';
			return (
				<div
					className={`${sizeClasses} rounded-full bg-gray-500/20 border-2 border-gray-500/40 flex items-center justify-center`}
				>
					<FontAwesomeIcon icon={faUser} className={`${iconSize} text-gray-500`} />
				</div>
			);
		}

		const displayName = user.stravaProfile?.firstname || `User ${user.stravaId}`;
		const imghexUrl = user.stravaProfile?.imghex;
		const profileUrl = user.stravaProfile?.profile;
		const imageUrl = imghexUrl || profileUrl;
		const sizeClasses = size === 'md' ? 'w-12 h-12' : 'w-10 h-10';
		const iconSize = size === 'md' ? 'w-6 h-6' : 'w-5 h-5';

		return (
			<div className="flex items-center gap-3">
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={displayName}
						className={`${sizeClasses} ${imghexUrl ? '' : 'rounded-full'} object-cover shadow-lg`}
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
				{imageUrl && (
					<div
						className={`${sizeClasses} rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/30 border-2 border-orange-500/40 flex items-center justify-center shadow-lg`}
						style={{ display: 'none' }}
					>
						<FontAwesomeIcon icon={faUser} className={`${iconSize} text-orange-400`} />
					</div>
				)}
				<span className="text-base font-bold text-gray-100">{displayName}</span>
			</div>
		);
	};

	const getMedalColor = (rank: number) => {
		if (rank === 0) return 'text-yellow-400'; // Gold
		if (rank === 1) return 'text-gray-300'; // Silver
		if (rank === 2) return 'text-amber-600'; // Bronze
		return 'text-gray-500';
	};

	const getMedalBg = (rank: number) => {
		if (rank === 0) return 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30';
		if (rank === 1) return 'bg-gradient-to-r from-gray-400/20 to-transparent border border-gray-400/30';
		if (rank === 2) return 'bg-gradient-to-r from-amber-700/20 to-transparent border border-amber-700/30';
		return 'bg-white/5 border border-white/10';
	};

	const renderLeaderboard = () => {
		const isActive = activeTab === 'active';
		const data = isActive ? activeLeadersData?.regionalActiveLeaders : ogDiscoverersData?.regionalOGDiscoverers;
		const loading = isActive ? activeLoading : ogLoading;
		const error = isActive ? activeError : ogError;

		if (loading) {
			return (
				<div className="flex items-center justify-center py-12">
					<FontAwesomeIcon icon={faSpinner} spin className="w-8 h-8 text-orange-500" />
				</div>
			);
		}

		if (error) {
			return (
				<div className="text-center py-12 text-red-400">
					<p className="font-semibold mb-2">Failed to load leaderboard</p>
					<p className="text-sm text-gray-400">{error.message}</p>
				</div>
			);
		}

		if (!data || data.length === 0) {
			return (
				<div className="text-center py-12 text-gray-400">
					<FontAwesomeIcon icon={faTrophy} className="w-12 h-12 text-gray-600 mx-auto mb-3" />
					<p>No data found for this region.</p>
				</div>
			);
		}

		return (
			<div className="space-y-2">
				{data.map((entry: NonNullable<typeof data>[number], index: number) => (
					<div
						key={entry.user?.id || index}
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
							{renderUserAvatar(entry.user, 'sm')}
						</div>
						<div className="flex items-center gap-2">
							<span className="text-lg font-bold text-gray-200">{entry.hexCount}</span>
							<span className="text-xs text-gray-400">
								{entry.hexCount === 1 ? 'hex' : 'hexes'}
							</span>
						</div>
					</div>
				))}
			</div>
		);
	};

	const handleClose = () => {
		try {
			onClose();
		} catch (error) {
			console.error('Error closing leaderboard modal:', error);
		}
	};

	return (
		<Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<FontAwesomeIcon icon={faTrophy} className="w-5 h-5 text-orange-500" />
						Regional Leaderboard
					</DialogTitle>
				</DialogHeader>

				<DialogBody className="space-y-5 p-5">
					{/* Tabs */}
					<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setActiveTab('active')}
						className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
							activeTab === 'active'
								? 'bg-gradient-to-r from-orange-500/30 to-orange-600/20 border-2 border-orange-500/50 text-orange-400'
								: 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
						}`}
					>
						<div className="flex items-center justify-center gap-2">
							<FontAwesomeIcon icon={faCrown} className="w-4 h-4" />
							<span>Active Leaders</span>
						</div>
						<div className="text-xs mt-1 opacity-80">Most hexes currently owned</div>
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('og')}
						className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
							activeTab === 'og'
								? 'bg-gradient-to-r from-blue-500/30 to-blue-600/20 border-2 border-blue-500/50 text-blue-400'
								: 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
						}`}
					>
						<div className="flex items-center justify-center gap-2">
							<FontAwesomeIcon icon={faSparkles} className="w-4 h-4" />
							<span>OG Discoverers</span>
						</div>
						<div className="text-xs mt-1 opacity-80">First to discover hexes</div>
					</button>
					</div>

					{/* Content */}
					{renderLeaderboard()}
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
}
