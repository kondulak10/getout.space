import { ActivitiesTable, type StravaActivity } from "@/components/ActivitiesTable";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteHexMapView } from "@/components/RouteHexMapView";
import polyline from "@mapbox/polyline";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/useAuth";

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
	const { isAuthenticated, login, user } = useAuth();
	const [stravaLoading, setStravaLoading] = useState(false);
	const [activities, setActivities] = useState<StravaActivity[]>([]);
	const [selectedActivity, setSelectedActivity] = useState<ActivityDetails | null>(null);
	const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

	// Prevent double OAuth code exchange (React Strict Mode runs effects twice)
	const hasExchangedCode = useRef(false);

	const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

	// Handle OAuth callback
	useEffect(() => {
		// OAuth codes can only be used once!
		// Prevent double execution with ref guard
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get("code");
		const scope = urlParams.get("scope");

		if (code && scope && !isAuthenticated && !hasExchangedCode.current) {
			console.log("📥 Received authorization code, exchanging for tokens...");
			hasExchangedCode.current = true;
			exchangeCodeForTokens(code);
		}
	}, [isAuthenticated]);

	const exchangeCodeForTokens = async (code: string) => {
		try {
			console.log("🔄 Exchanging OAuth code for tokens...");

			const response = await fetch(`${backendUrl}/api/strava/callback`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ code }),
			});

			const data = await response.json();

			console.log("📥 Server response:", data);

			if (response.ok && data.success && data.token && data.user) {
				console.log("✅ Authentication successful!");
				console.log("👤 User:", data.user);

				// Store JWT token and user data in auth context
				login(data.token, data.user);

				// Clean URL
				window.history.replaceState({}, document.title, "/");

				alert(`✅ Successfully logged in as ${data.user.profile.firstname} ${data.user.profile.lastname}!`);
			} else {
				const errorMsg = data.error || data.details || "Unknown error";
				console.error("❌ Authentication failed:", errorMsg);
				alert(`❌ Login failed: ${errorMsg}`);
			}
		} catch (error) {
			console.error("❌ Token exchange failed:", error);
			alert(`❌ Login error: ${error instanceof Error ? error.message : 'Network error'}`);
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

			const token = localStorage.getItem('getout_auth_token');
			const response = await fetch(`${backendUrl}/api/strava/activities`, {
				headers: {
					'Authorization': `Bearer ${token}`,
				},
			});

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

			const token = localStorage.getItem('getout_auth_token');
			const response = await fetch(`${backendUrl}/api/strava/activities/${activityId}`, {
				headers: {
					'Authorization': `Bearer ${token}`,
				},
			});
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
								<div className="p-4 bg-green-50 border border-green-200 rounded-md">
									<div className="flex items-center gap-3">
										<img
											src={user?.profile.profile}
											alt={user?.profile.firstname}
											className="w-12 h-12 rounded-full"
										/>
										<div>
											<p className="font-semibold text-green-800">
												✅ Authenticated as {user?.profile.firstname} {user?.profile.lastname}
											</p>
											<p className="text-sm text-green-600">
												{user?.isAdmin && '👑 Admin • '}Strava ID: {user?.stravaId}
											</p>
										</div>
									</div>
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
										<li>Click on any activity to see the route on the map</li>
										{user?.isAdmin && <li>Access the <a href="/users" className="text-blue-600 hover:underline">Users page</a> (admin only)</li>}
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
