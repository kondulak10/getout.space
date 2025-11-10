import { useAuth } from "@/contexts/useAuth";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import {
	GetUsersDocument,
	GetAllHexagonsDocument,
	GetAllActivitiesDocument,
	GetUsersCountDocument,
	GetHexagonsCountDocument,
	GetActivitiesCountDocument,
	AllNotificationsDocument,
	NotificationsCountDocument,
} from "@/gql/graphql";
import { useState } from "react";
import { HEXAGON_COLORS } from "@/constants/hexagonColors";

export default function AdminPage() {
	const { user: currentUser } = useAuth();
	const [loadingEntity, setLoadingEntity] = useState<string | null>(null);

	// Fetch counts on mount
	const { data: usersCountData } = useQuery(GetUsersCountDocument);
	const { data: hexagonsCountData } = useQuery(GetHexagonsCountDocument);
	const { data: activitiesCountData } = useQuery(GetActivitiesCountDocument);
	const { data: notificationsCountData } = useQuery(NotificationsCountDocument);

	const [fetchUsers] = useLazyQuery(GetUsersDocument, {
		fetchPolicy: 'network-only',
	});

	const [fetchHexagons] = useLazyQuery(GetAllHexagonsDocument, {
		fetchPolicy: 'network-only',
	});

	const [fetchActivities] = useLazyQuery(GetAllActivitiesDocument, {
		fetchPolicy: 'network-only',
	});

	const [fetchNotifications] = useLazyQuery(AllNotificationsDocument, {
		fetchPolicy: 'network-only',
	});

	const handleFetchUsers = async () => {
		setLoadingEntity('users');
		try {
			const result = await fetchUsers();
			if (result.data) {
				console.log('=== USERS ===');
				const usersWithStravaLinks = result.data.users.map(user => ({
					...user,
					stravaUrl: `https://www.strava.com/athletes/${user.stravaId}`
				}));
				console.log(usersWithStravaLinks);
			}
		} catch (error) {
			console.error('Error fetching users:', error);
		} finally {
			setLoadingEntity(null);
		}
	};

	const handleFetchHexagons = async () => {
		setLoadingEntity('hexagons');
		try {
			const result = await fetchHexagons({ variables: { limit: 1000 } });
			if (result.data) {
				console.log('=== HEXAGONS ===');
				console.log(result.data.hexagons);
			}
		} catch (error) {
			console.error('Error fetching hexagons:', error);
		} finally {
			setLoadingEntity(null);
		}
	};

	const handleFetchActivities = async () => {
		setLoadingEntity('activities');
		try {
			const result = await fetchActivities({ variables: { limit: 1000 } });
			if (result.data) {
				console.log('=== ACTIVITIES ===');
				const activitiesWithStravaLinks = result.data.activities.map(activity => ({
					...activity,
					stravaUrl: `https://www.strava.com/activities/${activity.stravaActivityId}`
				}));
				console.log(activitiesWithStravaLinks);
			}
		} catch (error) {
			console.error('Error fetching activities:', error);
		} finally {
			setLoadingEntity(null);
		}
	};

	const handleFetchNotifications = async () => {
		setLoadingEntity('notifications');
		try {
			const result = await fetchNotifications({ variables: { limit: 1000 } });
			if (result.data) {
				console.log('=== NOTIFICATIONS ===');
				console.log(result.data.notifications);
			}
		} catch (error) {
			console.error('Error fetching notifications:', error);
		} finally {
			setLoadingEntity(null);
		}
	};

	const handleExportAuth = () => {
		const TOKEN_KEY = 'getout_auth_token';
		const token = localStorage.getItem(TOKEN_KEY);

		console.log('=== AUTH EXPORT ===');
		if (currentUser) {
			console.log('Current User:', `${currentUser.profile.firstname} ${currentUser.profile.lastname}`);
			console.log('Strava ID:', currentUser.stravaId);
			console.log('Is Admin:', currentUser.isAdmin);
			const expiryDate = new Date(currentUser.tokenExpiresAt * 1000);
			console.log('Token Expires:', expiryDate.toLocaleString());
			console.log('Token Expired:', currentUser.tokenIsExpired);
			console.log('');
		}
		console.log('To transfer authentication to localhost:');
		console.log('');
		console.log('STEP 1: Copy the token to localStorage');
		console.log('  - Open DevTools Console (F12) in localhost');
		console.log('  - Paste and run this command:');
		console.log(`  localStorage.setItem("${TOKEN_KEY}", "${token}")`);
		console.log('');
		console.log('STEP 2: Ensure JWT_SECRET matches');
		console.log('  - For the token to work on localhost backend,');
		console.log('  - Your localhost JWT_SECRET must match production');
		console.log('  - Set in backend/.env: JWT_SECRET=<same_as_production>');
		console.log('');
		console.log('STEP 3: Refresh the page');
		console.log('');
		console.log('NOTE: Token and backend must use the same JWT_SECRET to work.');
	};

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-4xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<div>
						<div className="flex items-center gap-3 mb-2">
							<h1 className="text-3xl font-bold">Admin Dashboard</h1>
							{currentUser?.isAdmin && (
								<span className="px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
									Admin Access
								</span>
							)}
						</div>
						<p className="text-gray-600">
							View MongoDB entities in the browser console
						</p>
					</div>
					<a
						href="/"
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Back to Home
					</a>
				</div>

				<div className="bg-white rounded-lg shadow-lg p-8">
					<h2 className="text-xl font-semibold mb-4">Database Entities</h2>
					<p className="text-sm text-gray-600 mb-6">
						Click a button below to fetch and log all entities to the console.
						<br />
						Open your browser's Developer Tools (F12) to view the console output.
					</p>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<button
							onClick={handleFetchUsers}
							disabled={loadingEntity !== null}
							className={`
								flex flex-col items-center justify-center
								p-6 rounded-lg border-2 transition-all
								${loadingEntity === 'users'
									? 'border-blue-500 bg-blue-50'
									: loadingEntity !== null
										? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
										: 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
								}
							`}
						>
							<div className="text-4xl mb-3">
								{loadingEntity === 'users' ? '⏳' : '👥'}
							</div>
							<h3 className="text-lg font-semibold mb-1">
								Users {usersCountData?.usersCount !== undefined && `(${usersCountData.usersCount})`}
							</h3>
							<p className="text-sm text-gray-500 text-center">
								{loadingEntity === 'users' ? 'Loading...' : 'View all users in console'}
							</p>
						</button>

						<button
							onClick={handleFetchHexagons}
							disabled={loadingEntity !== null}
							className={`
								flex flex-col items-center justify-center
								p-6 rounded-lg border-2 transition-all
								${loadingEntity === 'hexagons'
									? 'border-green-500 bg-green-50'
									: loadingEntity !== null
										? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
										: 'border-gray-300 bg-white hover:border-green-500 hover:bg-green-50 cursor-pointer'
								}
							`}
						>
							<div className="text-4xl mb-3">
								{loadingEntity === 'hexagons' ? '⏳' : '⬡'}
							</div>
							<h3 className="text-lg font-semibold mb-1">
								Hexagons {hexagonsCountData?.hexagonsCount !== undefined && `(${hexagonsCountData.hexagonsCount})`}
							</h3>
							<p className="text-sm text-gray-500 text-center">
								{loadingEntity === 'hexagons' ? 'Loading...' : 'View all hexagons in console'}
							</p>
						</button>

						<button
							onClick={handleFetchActivities}
							disabled={loadingEntity !== null}
							className={`
								flex flex-col items-center justify-center
								p-6 rounded-lg border-2 transition-all
								${loadingEntity === 'activities'
									? 'border-purple-500 bg-purple-50'
									: loadingEntity !== null
										? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
										: 'border-gray-300 bg-white hover:border-purple-500 hover:bg-purple-50 cursor-pointer'
								}
							`}
						>
							<div className="text-4xl mb-3">
								{loadingEntity === 'activities' ? '⏳' : '🏃'}
							</div>
							<h3 className="text-lg font-semibold mb-1">
								Activities {activitiesCountData?.activitiesCount !== undefined && `(${activitiesCountData.activitiesCount})`}
							</h3>
							<p className="text-sm text-gray-500 text-center">
								{loadingEntity === 'activities' ? 'Loading...' : 'View all activities in console'}
							</p>
						</button>

						<button
							onClick={handleFetchNotifications}
							disabled={loadingEntity !== null}
							className={`
								flex flex-col items-center justify-center
								p-6 rounded-lg border-2 transition-all
								${loadingEntity === 'notifications'
									? 'border-yellow-500 bg-yellow-50'
									: loadingEntity !== null
										? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
										: 'border-gray-300 bg-white hover:border-yellow-500 hover:bg-yellow-50 cursor-pointer'
								}
							`}
						>
							<div className="text-4xl mb-3">
								{loadingEntity === 'notifications' ? '⏳' : '🔔'}
							</div>
							<h3 className="text-lg font-semibold mb-1">
								Notifications {notificationsCountData?.notificationsCount !== undefined && `(${notificationsCountData.notificationsCount})`}
							</h3>
							<p className="text-sm text-gray-500 text-center">
								{loadingEntity === 'notifications' ? 'Loading...' : 'View all notifications in console'}
							</p>
						</button>

						<button
							onClick={handleExportAuth}
							disabled={loadingEntity !== null}
							className={`
								flex flex-col items-center justify-center
								p-6 rounded-lg border-2 transition-all
								${loadingEntity !== null
									? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
									: 'border-gray-300 bg-white hover:border-orange-500 hover:bg-orange-50 cursor-pointer'
								}
							`}
						>
							<div className="text-4xl mb-3">🔑</div>
							<h3 className="text-lg font-semibold mb-1">Export Auth</h3>
							<p className="text-sm text-gray-500 text-center">
								Export JWT token to console
							</p>
						</button>
					</div>

					<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-sm text-blue-800">
							<strong>Note:</strong> Data will be logged to the browser console with all properties.
						</p>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-lg p-8 mt-6">
					<h2 className="text-xl font-semibold mb-4">Player Colors Preview</h2>
					<p className="text-sm text-gray-600 mb-6">
						These are the colors used for different players on the map, shown with the same opacity (50%) as on the map.
					</p>

					<div
						className="p-6 rounded-lg"
						style={{ backgroundColor: '#0a0a0a' }}
					>
						<div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 gap-4">
							{HEXAGON_COLORS.map((color, index) => (
								<div key={color} className="flex flex-col items-center gap-2">
									<div
										className="w-16 h-16 rounded-lg border border-white/20"
										style={{
											backgroundColor: color,
											opacity: 0.5,
										}}
									/>
									<div
										className="w-16 h-16 rounded-lg border border-white/20 -mt-2"
										style={{
											backgroundColor: color,
										}}
									/>
									<span className="text-xs text-gray-400 font-mono text-center">
										{index + 1}
									</span>
									<span className="text-xs text-gray-500 font-mono text-center">
										{color}
									</span>
								</div>
							))}
						</div>
						<div className="mt-4 text-sm text-gray-400 text-center">
							Top: Map opacity (50%) | Bottom: Full opacity
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
