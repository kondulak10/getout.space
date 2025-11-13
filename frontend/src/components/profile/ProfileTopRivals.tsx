import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faSparkles } from '@fortawesome/pro-solid-svg-icons';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface RivalData {
	count: number;
	userId: string;
	stravaId: number;
	user: {
		id: string;
		stravaId: number;
		stravaProfile: {
			firstname?: string | null;
			lastname?: string | null;
			profile?: string | null;
			imghex?: string | null;
		};
	} | null;
}

interface ProfileTopRivalsProps {
	rivals: RivalData[];
	totalRivalBattles: number;
	loading?: boolean;
}

export function ProfileTopRivals({ rivals, totalRivalBattles, loading }: ProfileTopRivalsProps) {
	const navigate = useNavigate();

	const getMedalColor = (rank: number) => {
		if (rank === 0) return 'text-yellow-400';
		if (rank === 1) return 'text-gray-300';
		if (rank === 2) return 'text-amber-600';
		return 'text-gray-500';
	};

	const getMedalBg = (rank: number) => {
		if (rank === 0)
			return 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30';
		if (rank === 1)
			return 'bg-gradient-to-r from-gray-400/20 to-transparent border border-gray-400/30';
		if (rank === 2)
			return 'bg-gradient-to-r from-amber-700/20 to-transparent border border-amber-700/30';
		return 'bg-white/5 border border-white/10';
	};

	if (loading) {
		return (
			<div className="rounded-xl bg-white/5 border border-white/10 p-5 animate-pulse">
				<div className="flex items-center gap-2 mb-4">
					<div className="w-5 h-5 bg-gray-700 rounded"></div>
					<div className="h-4 w-32 bg-gray-700 rounded"></div>
				</div>
				<div className="space-y-2">
					{[1, 2, 3, 4, 5].map((i) => (
						<div
							key={i}
							className="rounded-lg bg-white/5 border border-white/10 p-3 flex items-center justify-between"
						>
							<div className="flex items-center gap-3">
								<div className="w-8 h-5 bg-gray-700 rounded"></div>
								<div className="w-10 h-10 bg-gray-700 rounded-full"></div>
								<div className="w-24 h-4 bg-gray-700 rounded"></div>
							</div>
							<div className="w-12 h-6 bg-gray-700 rounded"></div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-xl bg-white/5 border border-white/10 p-5">
			<div className="flex items-center gap-2 mb-4">
				<FontAwesomeIcon icon={faTrophy} className="w-5 h-5 text-pink-400" />
				<h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Top 10 Rivals</h3>
				<span className="text-xs text-gray-500">(Users who stole your hexagons)</span>
			</div>

			{rivals.length > 0 ? (
				<>
					<div className="space-y-2">
						{rivals.map((rival, index: number) => (
							<div
								key={rival.userId}
								className={`rounded-lg p-3 flex items-center justify-between transition-all ${getMedalBg(index)}`}
							>
								<div className="flex items-center gap-3 flex-1">
									<div className="flex items-center justify-center w-8">
										{index < 3 ? (
											<FontAwesomeIcon
												icon={faTrophy}
												className={`w-5 h-5 ${getMedalColor(index)}`}
											/>
										) : (
											<span className="text-sm font-bold text-gray-500">#{index + 1}</span>
										)}
									</div>
									<UserAvatar
										user={rival.user}
										stravaId={rival.stravaId}
										size="md"
										showName={true}
										onClick={() => rival.user && navigate(`/profile/${rival.user.id}`)}
									/>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-lg font-bold text-gray-200">{rival.count}</span>
									<span className="text-xs text-gray-400">
										{rival.count === 1 ? 'hex' : 'hexes'}
									</span>
								</div>
							</div>
						))}
					</div>

					<div className="mt-4 pt-4 border-t border-white/10 text-center">
						<div className="text-xs text-gray-500">Total hexes stolen by rivals</div>
						<div className="text-2xl font-bold text-pink-400">{totalRivalBattles}</div>
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
	);
}
