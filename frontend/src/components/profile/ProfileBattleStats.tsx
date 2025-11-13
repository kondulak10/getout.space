import { faSparkles, faFire, faShieldAlt, faTrophy } from '@fortawesome/pro-solid-svg-icons';
import { StatCard } from '@/components/ui/StatCard';

interface ProfileBattleStatsProps {
	ogHexagons: number;
	conqueredHexagons: number;
	cleanTerritory: number;
	revengeCaptures: number;
	totalHexagons: number;
	loading?: boolean;
}

export function ProfileBattleStats({
	ogHexagons,
	conqueredHexagons,
	cleanTerritory,
	revengeCaptures,
	totalHexagons,
	loading
}: ProfileBattleStatsProps) {
	if (loading) {
		return (
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="rounded-lg bg-white/5 border border-white/10 p-4 animate-pulse">
						<div className="h-4 w-24 bg-gray-700 rounded mb-3"></div>
						<div className="h-10 w-16 bg-gray-700 rounded mb-2"></div>
						<div className="h-3 w-32 bg-gray-800 rounded mb-2"></div>
						<div className="h-3 w-12 bg-gray-800 rounded"></div>
					</div>
				))}
			</div>
		);
	}

	const percentage = (value: number) =>
		totalHexagons > 0 ? `${Math.round((value / totalHexagons) * 100)}%` : '0%';

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<StatCard
				icon={faSparkles}
				title="OG Discoveries"
				value={ogHexagons}
				description="first to discover"
				footer={percentage(ogHexagons)}
				color="purple"
			/>

			<StatCard
				icon={faFire}
				title="Conquered"
				value={conqueredHexagons}
				description="taken from others"
				footer={percentage(conqueredHexagons)}
				color="red"
			/>

			<StatCard
				icon={faShieldAlt}
				title="Clean Territory"
				value={cleanTerritory}
				description="never challenged"
				footer={percentage(cleanTerritory)}
				color="green"
			/>

			<StatCard
				icon={faTrophy}
				title="Revenge"
				value={revengeCaptures}
				description="reclaimed"
				footer="Won back!"
				color="orange"
			/>
		</div>
	);
}
