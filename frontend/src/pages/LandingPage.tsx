import { AuthLoadingOverlay } from "@/components/AuthLoadingOverlay";
import { LandingOverlay } from "@/components/LandingOverlay";
import { useAppLoadingState } from "@/hooks/useAppLoadingState";

export function LandingPage() {
	const { showLoading } = useAppLoadingState();
	console.log(
		"🏠 LandingPage: Rendering at",
		new Date().toISOString(),
		"- showLoading:",
		showLoading
	);

	return (
		<div className="relative w-full h-screen bg-black overflow-hidden">
			<div className="absolute inset-0">
				<div className="absolute inset-0 opacity-10 bg-noise"></div>

				<div className="absolute inset-0 bg-gradient-radial from-orange-900/20 via-black to-black"></div>

				<div className="hex-pattern"></div>
			</div>

			{showLoading ? <AuthLoadingOverlay /> : <LandingOverlay />}

			<style>{`
				@keyframes float {
					0%, 100% { transform: translateY(0px) rotate(0deg); }
					50% { transform: translateY(-20px) rotate(5deg); }
				}

				@keyframes pulse-glow {
					0%, 100% { opacity: 0.3; }
					50% { opacity: 0.6; }
				}

				.bg-noise {
					background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
				}

				.hex-pattern {
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

				.bg-gradient-radial {
					background: radial-gradient(circle at 50% 50%, rgba(234, 88, 12, 0.15), rgba(0, 0, 0, 1) 70%);
				}
			`}</style>
		</div>
	);
}
