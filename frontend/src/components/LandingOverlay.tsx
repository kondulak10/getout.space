import { StravaSyncBadge } from "@/components/StravaSyncBadge";
import { useStravaAuth } from "@/hooks/useStravaAuth";

export function LandingOverlay() {
	const { loginWithStrava } = useStravaAuth();

	return (
		<div className="absolute inset-0 z-20 flex items-center justify-center p-4">
			<StravaSyncBadge />
			<div className="max-w-6xl w-full space-y-12 text-center">
				<div className="space-y-6">
					<h1
						className="text-7xl md:text-9xl font-black text-white tracking-tight uppercase flex items-center justify-center gap-2"
						style={{ fontFamily: "Bebas Neue, sans-serif" }}
					>
						<span>GetOut␣</span>
					</h1>
					<p
						className="text-xl md:text-3xl font-bold text-gray-300 max-w-3xl mx-auto uppercase"
						style={{ fontFamily: "Bebas Neue, sans-serif", letterSpacing: "0.05em" }}
					>
						Turn every run into conquered territory
					</p>
					<p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
						Battle your friends or fellow runners
					</p>
				</div>

				<div className="space-y-4">
					<img
						src="/btn_strava_connect_with_orange.svg"
						alt="Connect with Strava"
						onClick={loginWithStrava}
						data-testid="login-button"
						className="inline-block cursor-pointer hover:opacity-90 transition-opacity h-12 md:h-14"
					/>
					<p className="text-sm text-gray-500">Made by Mapheim & Powered by Strava</p>
				</div>
			</div>
		</div>
	);
}
