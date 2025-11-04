import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function AuthLoadingOverlay() {
	return (
		<div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
			{/* Same animated background as landing page */}
			<div className="absolute inset-0">
				{/* Noise texture */}
				<div className="absolute inset-0 opacity-10 bg-noise"></div>

				{/* Animated gradient */}
				<div className="absolute inset-0" style={{
					background: 'radial-gradient(circle at 50% 50%, rgba(234, 88, 12, 0.15), rgba(0, 0, 0, 1) 70%)'
				}}></div>

				{/* Hexagonal grid animation */}
				<div className="hex-pattern-auth"></div>
			</div>

			{/* Content */}
			<div className="text-center relative z-10">
				<div className="mb-8">
					<div className="relative inline-block">
						{/* Hexagon spinner */}
						<FontAwesomeIcon
							icon="hexagon"
							className="text-orange-500 animate-spin w-20 h-20"
							style={{ animationDuration: '2s' }}
						/>
						<FontAwesomeIcon
							icon="hexagon"
							className="text-orange-400/30 absolute inset-0 w-20 h-20"
							style={{ transform: 'scale(1.2)' }}
						/>
					</div>
				</div>
				<h2 className="text-5xl md:text-6xl font-black text-white uppercase flex items-center justify-center gap-3 mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
					<span>GetOut</span>
					<FontAwesomeIcon icon="hexagon" className="text-orange-500 w-10 h-10" />
				</h2>
				<p className="text-gray-400 text-lg">Authenticating...</p>
			</div>

			<style>{`
				.bg-noise {
					background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
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
