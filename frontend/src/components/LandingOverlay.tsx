import { useStravaAuth } from '@/hooks/useStravaAuth';
import { Button } from '@/components/ui/button';

export function LandingOverlay() {
	const { loginWithStrava } = useStravaAuth();

	return (
		<div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 md:p-12">
				{/* Hero Section */}
				<div className="text-center mb-12">
					<h1 className="text-5xl font-bold text-gray-900 mb-4">
						GetOut.space
					</h1>
					<p className="text-xl text-gray-600">
						Sync your activities to battle for territory
					</p>
				</div>

				{/* Features Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
					{/* Feature 1 */}
					<div className="text-center">
						<div className="mb-4 mx-auto w-32 h-32 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
							<span className="text-6xl">🏃</span>
						</div>
						<h3 className="font-semibold text-lg text-gray-900 mb-2">
							Track Your Runs
						</h3>
						<p className="text-sm text-gray-600">
							Connect your Strava account and sync all your running activities automatically
						</p>
					</div>

					{/* Feature 2 */}
					<div className="text-center">
						<div className="mb-4 mx-auto w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
							<span className="text-6xl">🗺️</span>
						</div>
						<h3 className="font-semibold text-lg text-gray-900 mb-2">
							Claim Territory
						</h3>
						<p className="text-sm text-gray-600">
							Every route you run claims hexagonal territory on the map for your team
						</p>
					</div>

					{/* Feature 3 */}
					<div className="text-center">
						<div className="mb-4 mx-auto w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
							<span className="text-6xl">⚔️</span>
						</div>
						<h3 className="font-semibold text-lg text-gray-900 mb-2">
							Battle for Control
						</h3>
						<p className="text-sm text-gray-600">
							Compete with other runners to dominate the map and expand your territory
						</p>
					</div>
				</div>

				{/* CTA Button */}
				<div className="text-center">
					<Button
						onClick={loginWithStrava}
						size="lg"
						className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg font-semibold"
					>
						<span className="mr-2">🏃</span>
						Connect with Strava
					</Button>
					<p className="mt-4 text-xs text-gray-500">
						Free to join • Secure OAuth authentication
					</p>
				</div>
			</div>
		</div>
	);
}
