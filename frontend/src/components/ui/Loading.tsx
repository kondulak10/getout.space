import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { cn } from '@/lib/utils-cn';

type LoadingVariant = 'fullscreen' | 'auth' | 'inline' | 'map';
type LoadingSize = 'sm' | 'md' | 'lg';

interface LoadingProps {
	variant?: LoadingVariant;
	text?: string;
	size?: LoadingSize;
	className?: string;
}

export function Loading({
	variant = 'fullscreen',
	text = 'Loading...',
	size = 'md',
	className
}: LoadingProps) {
	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-8 h-8',
		lg: 'w-12 h-12'
	};

	// Inline variant - small spinner with text
	if (variant === 'inline') {
		return (
			<div className={cn('flex items-center gap-3', className)}>
				<FontAwesomeIcon
					icon={faSpinner}
					spin
					className={cn(sizeClasses[size], 'text-orange-500')}
				/>
				{text && (
					<span className={cn(
						size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm',
						'text-gray-400 font-medium'
					)}>
						{text}
					</span>
				)}
			</div>
		);
	}

	// Map indicator variant - bottom-left corner (above mobile nav on small screens)
	if (variant === 'map') {
		return (
			<div className="absolute bottom-24 left-4 md:bottom-4 z-10">
				<div className="bg-[rgba(10,10,10,0.95)] backdrop-blur-md border-2 border-orange-500 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
					<FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4 text-orange-500" />
					<span className="text-xs font-medium text-white">{text}</span>
				</div>
			</div>
		);
	}

	// Auth variant - branded full-screen with hex patterns
	if (variant === 'auth') {
		return (
			<div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
				<div className="absolute inset-0">
					<div className="absolute inset-0 opacity-10 bg-noise"></div>
					<div
						className="absolute inset-0"
						style={{
							background:
								"radial-gradient(circle at 50% 50%, rgba(234, 88, 12, 0.15), rgba(0, 0, 0, 1) 70%)",
						}}
					></div>
					<div className="hex-pattern-auth"></div>
				</div>
				<div className="text-center relative z-10">
					<div className="mb-8">
						<div className="relative inline-block">
							<FontAwesomeIcon
								icon="hexagon"
								className="text-orange-500 animate-spin w-20 h-20"
								style={{ animationDuration: "2s" }}
							/>
							<FontAwesomeIcon
								icon="hexagon"
								className="text-orange-400/30 absolute inset-0 w-20 h-20"
								style={{ transform: "scale(1.2)" }}
							/>
						</div>
					</div>
					<h2
						className="text-5xl md:text-6xl font-black text-white uppercase flex items-center justify-center gap-3 mb-2"
						style={{ fontFamily: "Bebas Neue, sans-serif" }}
					>
						<span>GetOut </span>
						<FontAwesomeIcon icon="hexagon" className="text-orange-500 w-10 h-10" />
					</h2>
					<p className="text-gray-400 text-lg">{text}</p>
				</div>
				<style>{`
					.bg-noise {
						background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
					}
					.hex-pattern-auth {
						position: absolute;
						inset: 0;
						background-image:
							linear-gradient(30deg, transparent 48%, rgba(251, 146, 60, 0.05) 49%, rgba(251, 146, 60, 0.05) 51%, transparent 52%),
							linear-gradient(150deg, transparent 48%, rgba(251, 146, 60, 0.05) 49%, rgba(251, 146, 60, 0.05) 51%, transparent 52%),
							linear-gradient(90deg, transparent 48%, rgba(251, 146, 60, 0.05) 49%, rgba(251, 146, 60, 0.05) 51%, transparent 52%);
						background-size: 100px 173px, 100px 173px, 100px 173px;
						background-position: 0 0, 0 0, 50px 86.5px;
						animation: pulse-glow 4s ease-in-out infinite;
					}
					@keyframes pulse-glow {
						0%, 100% { opacity: 0.3; }
						50% { opacity: 0.6; }
					}
				`}</style>
			</div>
		);
	}

	// Default fullscreen variant - simple centered spinner
	return (
		<div className={cn('min-h-screen bg-[#0a0a0a] flex items-center justify-center', className)}>
			<div className="text-center">
				<FontAwesomeIcon
					icon={faSpinner}
					spin
					className="w-12 h-12 text-orange-500 mb-4"
				/>
				<p className="text-gray-400">{text}</p>
			</div>
		</div>
	);
}
