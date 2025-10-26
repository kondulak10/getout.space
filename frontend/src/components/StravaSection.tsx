import { ActivitiesTable, type StravaActivity } from "@/components/ActivitiesTable";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteHexMapView } from "@/components/RouteHexMapView";
import polyline from "@mapbox/polyline";
import { useEffect, useState } from "react";

interface ActivityDetails {
	id: number;
	name: string;
	type: string;
	distance: number;
	moving_time: number;
	map?: {
		polyline: string;
		summary_polyline: string;
	};
}

export function StravaSection() {
	const [stravaLoading, setStravaLoading] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [activities, setActivities] = useState<StravaActivity[]>([]);
	const [selectedActivity, setSelectedActivity] = useState<ActivityDetails | null>(null);
	const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

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

	const fetchStravaActivities = async () => {
		setStravaLoading(true);
		try {
			console.log("🏃 Fetching Strava activities...");

			const response = await fetch(`${backendUrl}/api/strava/activities`);
			const data = await response.json();

			if (data.success) {
				console.log(`✅ Fetched ${data.count} activities!`);
				console.log("Activities:", data.activities);
				setActivities(data.activities);
			} else {
				console.error("❌ Error:", data.error);
			}
		} catch (error) {
			console.error("❌ Failed to fetch activities:", error);
		} finally {
			setStravaLoading(false);
		}
	};

	const handleActivityClick = async (activityId: number) => {
		try {
			console.log(`🔍 Fetching details for activity ${activityId}...`);

			const response = await fetch(`${backendUrl}/api/strava/activities/${activityId}`);
			const data = await response.json();

			if (data.success) {
				console.log(`✅ Activity ${activityId} details:`);
				console.log(data.activity);

				// Decode polyline if available
				if (data.activity.map?.polyline) {
					const decoded = polyline.decode(data.activity.map.polyline);
					console.log(`📍 Decoded ${decoded.length} GPS points`);
					setRouteCoordinates(decoded);
					setSelectedActivity(data.activity);
				} else {
					console.warn("⚠️ No map data available for this activity");
					setRouteCoordinates([]);
					setSelectedActivity(null);
				}
			} else {
				console.error("❌ Error:", data.error);
			}
		} catch (error) {
			console.error("❌ Failed to fetch activity details:", error);
		}
	};

	return (
		<>
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="text-3xl">GetOut.space</CardTitle>
					<CardDescription>Strava Integration</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
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
										<li>View your activities in the table below</li>
										<li>Click on any activity to see detailed info in console (F12)</li>
									</ol>
								</div>
							</>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Activities Table */}
			{activities.length > 0 && (
				<Card className="w-full">
					<CardHeader>
						<CardTitle>Your Strava Activities</CardTitle>
						<CardDescription>
							Click on any activity to view the route on the map
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ActivitiesTable activities={activities} onActivityClick={handleActivityClick} />
					</CardContent>
				</Card>
			)}

			{/* Hexagon Map View */}
			{selectedActivity && routeCoordinates.length > 0 && (
				<Card className="w-full">
					<CardHeader>
						<CardTitle>{selectedActivity.name}</CardTitle>
						<CardDescription>
							{selectedActivity.type} • {(selectedActivity.distance / 1000).toFixed(2)} km •{' '}
							{Math.floor(selectedActivity.moving_time / 60)} minutes
						</CardDescription>
					</CardHeader>
					<CardContent>
						<RouteHexMapView coordinates={routeCoordinates} className="w-full h-[500px] rounded-lg" showBackgroundHexagons={true} />
					</CardContent>
				</Card>
			)}

			{/* Live Activity Feed */}
			<ActivityFeed onActivityClick={handleActivityClick} />
		</>
	);
}
