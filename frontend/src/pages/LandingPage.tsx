import { AuthLoadingOverlay } from "@/components/AuthLoadingOverlay";
import { LandingOverlay } from "@/components/LandingOverlay";
import { useAppLoadingState } from "@/hooks/useAppLoadingState";

export function LandingPage() {
	const { showLoading } = useAppLoadingState();

	return (
		<div className="relative w-full h-screen bg-black overflow-hidden">
			<div className="absolute inset-0">
				<div className="absolute inset-0 opacity-10 bg-noise"></div>

				<div className="absolute inset-0 bg-gradient-radial from-orange-900/20 via-black to-black"></div>

				{/* Hexagonal grid pattern */}
				<div className="hex-pattern"></div>

				{/* Floating animated hexagons */}
				<div className="floating-hex hex-1"></div>
				<div className="floating-hex hex-2"></div>
				<div className="floating-hex hex-3"></div>
				<div className="floating-hex hex-4"></div>
				<div className="floating-hex hex-5"></div>
				<div className="floating-hex hex-6"></div>
			</div>

			{showLoading ? <AuthLoadingOverlay /> : <LandingOverlay />}

			<style>{`
				@keyframes float {
					0%, 100% { transform: translateY(0px) rotate(0deg); }
					50% { transform: translateY(-20px) rotate(5deg); }
				}

				@keyframes float-reverse {
					0%, 100% { transform: translateY(0px) rotate(0deg); }
					50% { transform: translateY(20px) rotate(-5deg); }
				}

				@keyframes pulse-glow {
					0%, 100% { opacity: 0.15; }
					50% { opacity: 0.3; }
				}

				@keyframes drift {
					0% { transform: translate(0, 0) rotate(0deg); }
					25% { transform: translate(10px, -10px) rotate(90deg); }
					50% { transform: translate(0, -20px) rotate(180deg); }
					75% { transform: translate(-10px, -10px) rotate(270deg); }
					100% { transform: translate(0, 0) rotate(360deg); }
				}

				.bg-noise {
					background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E");
				}

				.hex-pattern {
					position: absolute;
					inset: 0;
					background-image:
						linear-gradient(30deg, transparent 48%, rgba(251, 146, 60, 0.12) 49%, rgba(251, 146, 60, 0.12) 51%, transparent 52%),
						linear-gradient(150deg, transparent 48%, rgba(251, 146, 60, 0.12) 49%, rgba(251, 146, 60, 0.12) 51%, transparent 52%),
						linear-gradient(90deg, transparent 48%, rgba(251, 146, 60, 0.12) 49%, rgba(251, 146, 60, 0.12) 51%, transparent 52%);
					background-size: 120px 208px, 120px 208px, 120px 208px;
					background-position: 0 0, 0 0, 60px 104px;
					animation: pulse-glow 6s ease-in-out infinite;
				}

				.bg-gradient-radial {
					background: radial-gradient(circle at 50% 50%, rgba(234, 88, 12, 0.15), rgba(0, 0, 0, 1) 70%);
				}

				.floating-hex {
					position: absolute;
					width: 80px;
					height: 92px;
					opacity: 0.15;
					background: linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(249, 115, 22, 0.2));
					clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
					filter: blur(1px);
				}

				.hex-1 {
					top: 10%;
					left: 15%;
					animation: drift 25s ease-in-out infinite;
				}

				.hex-2 {
					top: 60%;
					left: 80%;
					width: 120px;
					height: 138px;
					animation: drift 30s ease-in-out infinite reverse;
					animation-delay: -5s;
				}

				.hex-3 {
					top: 75%;
					left: 10%;
					width: 60px;
					height: 69px;
					animation: drift 20s ease-in-out infinite;
					animation-delay: -10s;
				}

				.hex-4 {
					top: 20%;
					left: 75%;
					width: 100px;
					height: 115px;
					animation: drift 28s ease-in-out infinite reverse;
					animation-delay: -15s;
				}

				.hex-5 {
					top: 45%;
					left: 25%;
					width: 90px;
					height: 104px;
					animation: drift 22s ease-in-out infinite;
					animation-delay: -8s;
				}

				.hex-6 {
					top: 85%;
					left: 60%;
					width: 70px;
					height: 81px;
					animation: drift 26s ease-in-out infinite reverse;
					animation-delay: -12s;
				}
			`}</style>
		</div>
	);
}
