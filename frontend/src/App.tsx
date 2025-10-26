import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./components/ui/card";

function App() {
	const [loading, setLoading] = useState(false);
	const [stravaLoading, setStravaLoading] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4001";

	// Handle OAuth callback
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get("code");
		const scope = urlParams.get("scope");

		if (code && scope) {
			console.log("📥 Received authorization code, exchanging for tokens...");
			exchangeCodeForTokens(code);
		}
	}, []);

	const exchangeCodeForTokens = async (code: string) => {
		try {
			const response = await fetch(`${backendUrl}/api/strava/callback`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ code }),
			});

			const data = await response.json();

			if (data.success) {
				console.log("✅ Authentication successful!");
				setIsAuthenticated(true);
				// Clean URL
				window.history.replaceState({}, document.title, "/");
			} else {
				console.error("❌ Authentication failed:", data.error);
			}
		} catch (error) {
			console.error("❌ Token exchange failed:", error);
		}
	};

	const loginWithStrava = async () => {
		try {
			console.log("🔐 Initiating Strava login...");

			const response = await fetch(`${backendUrl}/api/strava/auth`);
			const data = await response.json();

			// Redirect to Strava authorization
			window.location.href = data.authUrl;
		} catch (error) {
			console.error("❌ Failed to get auth URL:", error);
		}
	};

	const testBackend = async () => {
		setLoading(true);
		try {
			console.log("🔍 Testing backend at:", backendUrl);

			const response = await fetch(`${backendUrl}/api/test`);
			const data = await response.json();

			console.log("✅ Backend response:", data);
		} catch (error) {
			console.error("❌ Backend error:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchStravaActivities = async () => {
		setStravaLoading(true);
		try {
			console.log("🏃 Fetching Strava activities...");

			const response = await fetch(`${backendUrl}/api/strava/activities`);
			const data = await response.json();

			if (data.success) {
				console.log(`✅ Fetched ${data.count} activities!`);
				console.log("Activities:", data.activities);
			} else {
				console.error("❌ Error:", data.error);
			}
		} catch (error) {
			console.error("❌ Failed to fetch activities:", error);
		} finally {
			setStravaLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-3xl">GetOut.space</CardTitle>
					<CardDescription>Testing Backend Connection</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Backend Test */}
					<div className="space-y-2">
						<Button
							onClick={testBackend}
							disabled={loading}
							size="lg"
							className="w-full"
							variant="outline"
						>
							{loading ? "Testing..." : "🧪 Test Backend API"}
						</Button>
					</div>

					{/* Divider */}
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-card px-2 text-muted-foreground">Strava API</span>
						</div>
					</div>

					{/* Strava Login/Activities */}
					<div className="space-y-3">
						{!isAuthenticated ? (
							<>
								<Button onClick={loginWithStrava} size="lg" className="w-full">
									🏃 Login with Strava
								</Button>
								<div className="space-y-2 text-sm text-muted-foreground bg-muted p-4 rounded-md">
									<p className="font-semibold">Instructions:</p>
									<ol className="list-decimal list-inside space-y-1">
										<li>Update backend .env with your Strava credentials</li>
										<li>Click "Login with Strava"</li>
										<li>Authorize the application</li>
										<li>You'll be redirected back here</li>
									</ol>
								</div>
							</>
						) : (
							<>
								<div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
									✅ Authenticated with Strava!
								</div>
								<Button
									onClick={fetchStravaActivities}
									disabled={stravaLoading}
									size="lg"
									className="w-full"
								>
									{stravaLoading ? "Loading..." : "🏃 Fetch Strava Activities"}
								</Button>
								<div className="space-y-2 text-sm text-muted-foreground bg-muted p-4 rounded-md">
									<p className="font-semibold">Next steps:</p>
									<ol className="list-decimal list-inside space-y-1">
										<li>Click "Fetch Strava Activities"</li>
										<li>Open console (F12) to see the results</li>
										<li>Your activities will be logged to console</li>
									</ol>
								</div>
							</>
						)}
					</div>
				</CardContent>
				<CardFooter className="text-xs text-muted-foreground">
					Built with Tailwind CSS + shadcn/ui
				</CardFooter>
			</Card>
		</div>
	);
}

export default App;
