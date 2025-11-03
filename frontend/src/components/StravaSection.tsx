import { ActivitiesTable } from "@/components/ActivitiesTable";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteHexMapView } from "@/components/RouteHexMapView";
import { useStravaAuth } from "@/hooks/useStravaAuth";
import { useStravaActivities } from "@/hooks/useStravaActivities";

export function StravaSection() {
	const { isAuthenticated, user, loginWithStrava } = useStravaAuth();
	const {
		activities,
		selectedActivity,
		routeCoordinates,
		currentPage,
		hasMoreActivities,
		totalRunCount,
		loading,
		perPage,
		loadActivities,
		loadActivityDetails,
		saveActivity,
		removeActivity,
	} = useStravaActivities();

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
									onClick={() => loadActivities(1)}
									disabled={loading}
									size="lg"
									className="w-full"
								>
									{loading ? "Loading..." : "🏃 Fetch Strava Activities"}
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
							{totalRunCount !== null && ` • Total runs: ${totalRunCount}`} • Page {currentPage}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<ActivitiesTable
							activities={activities}
							onActivityClick={loadActivityDetails}
							onProcessActivity={saveActivity}
							onDeleteActivity={removeActivity}
						/>

						{/* Pagination Controls */}
						<div className="flex items-center justify-between pt-4">
							<Button
								onClick={() => loadActivities(currentPage - 1)}
								disabled={currentPage === 1 || loading}
								variant="outline"
							>
								← Previous Page
							</Button>
							<span className="text-sm text-muted-foreground">
								Page {currentPage}
								{totalRunCount !== null && ` of ~${Math.ceil(totalRunCount / perPage)}`}
							</span>
							<Button
								onClick={() => loadActivities(currentPage + 1)}
								disabled={!hasMoreActivities || loading}
								variant="outline"
							>
								Next Page →
							</Button>
						</div>
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
			<ActivityFeed onActivityClick={loadActivityDetails} />
		</>
	);
}
