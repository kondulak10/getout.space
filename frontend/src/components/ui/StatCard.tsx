import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconProp } from '@fortawesome/fontawesome-svg-core';
import { cn } from '@/lib/utils-cn';

type StatCardColor = 'purple' | 'red' | 'green' | 'orange' | 'blue' | 'yellow' | 'cyan' | 'pink';

interface StatCardProps {
	icon: IconProp;
	title: string;
	value: string | number;
	description: string;
	footer?: string;
	color: StatCardColor;
	className?: string;
}

const colorClasses: Record<StatCardColor, { gradient: string; border: string; icon: string; footer: string }> = {
	purple: {
		gradient: 'from-purple-500/20 via-purple-600/10 to-transparent',
		border: 'border-purple-500/40 hover:border-purple-400/60',
		icon: 'text-purple-400',
		footer: 'text-purple-400/70'
	},
	red: {
		gradient: 'from-red-500/20 via-red-600/10 to-transparent',
		border: 'border-red-500/40 hover:border-red-400/60',
		icon: 'text-red-400',
		footer: 'text-red-400/70'
	},
	green: {
		gradient: 'from-green-500/20 via-green-600/10 to-transparent',
		border: 'border-green-500/40 hover:border-green-400/60',
		icon: 'text-green-400',
		footer: 'text-green-400/70'
	},
	orange: {
		gradient: 'from-orange-500/20 via-orange-600/10 to-transparent',
		border: 'border-orange-500/40 hover:border-orange-400/60',
		icon: 'text-orange-400',
		footer: 'text-orange-400/70'
	},
	blue: {
		gradient: 'from-blue-500/20 via-blue-600/10 to-transparent',
		border: 'border-blue-500/40 hover:border-blue-400/60',
		icon: 'text-blue-400',
		footer: 'text-blue-400/70'
	},
	yellow: {
		gradient: 'from-yellow-500/20 via-yellow-600/10 to-transparent',
		border: 'border-yellow-500/40 hover:border-yellow-400/60',
		icon: 'text-yellow-400',
		footer: 'text-yellow-400/70'
	},
	cyan: {
		gradient: 'from-cyan-500/20 via-cyan-600/10 to-transparent',
		border: 'border-cyan-500/40 hover:border-cyan-400/60',
		icon: 'text-cyan-400',
		footer: 'text-cyan-400/70'
	},
	pink: {
		gradient: 'from-pink-500/20 via-pink-600/10 to-transparent',
		border: 'border-pink-500/40 hover:border-pink-400/60',
		icon: 'text-pink-400',
		footer: 'text-pink-400/70'
	}
};

export function StatCard({
	icon,
	title,
	value,
	description,
	footer,
	color,
	className
}: StatCardProps) {
	const colors = colorClasses[color];

	return (
		<div
			className={cn(
				'rounded-lg bg-gradient-to-br p-4 shadow-lg transition-all border',
				colors.gradient,
				colors.border,
				className
			)}
		>
			<div className="flex items-center gap-2 mb-2">
				<FontAwesomeIcon icon={icon} className={cn('w-4 h-4', colors.icon)} />
				<h3 className={cn('text-xs font-bold uppercase tracking-wide', colors.icon)}>{title}</h3>
			</div>
			<div className="text-3xl font-bold text-gray-100 mb-1">{value}</div>
			<div className="text-xs text-gray-400">{description}</div>
			{footer && <div className={cn('mt-2 text-xs', colors.footer)}>{footer}</div>}
		</div>
	);
}
