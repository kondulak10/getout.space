import { useAuth } from "@/contexts/useAuth";
import { useLazyQuery } from "@apollo/client/react";
import {
	GetUsersDocument,
	GetAllHexagonsDocument,
	GetAllActivitiesDocument,
} from "@/gql/graphql";
import { useState } from "react";

export default function AdminPage() {
	const { user: currentUser } = useAuth();
	const [loadingEntity, setLoadingEntity] = useState<string | null>(null);

	const [fetchUsers] = useLazyQuery(GetUsersDocument, {
		fetchPolicy: 'network-only',
	});

	const [fetchHexagons] = useLazyQuery(GetAllHexagonsDocument, {
		fetchPolicy: 'network-only',
	});

	const [fetchActivities] = useLazyQuery(GetAllActivitiesDocument, {
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

	const handleExportAuth = () => {
		const TOKEN_KEY = 'getout_auth_token';
		const token = localStorage.getItem(TOKEN_KEY);

		console.log('=== AUTH EXPORT ===');
		console.log('To transfer authentication to another browser:');
		console.log('1. Copy the localStorage key and value below');
		console.log('2. In the new browser, open DevTools Console (F12)');
		console.log('3. Run: localStorage.setItem("getout_auth_token", "YOUR_TOKEN_VALUE")');
		console.log('4. Refresh the page');
		console.log('');
		console.log('localStorage Key:', TOKEN_KEY);
		console.log('localStorage Value:', token);
		console.log('');
		console.log('Quick copy command (paste in new browser console):');
		console.log(`localStorage.setItem("${TOKEN_KEY}", "${token}")`);
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
							<h3 className="text-lg font-semibold mb-1">Users</h3>
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
							<h3 className="text-lg font-semibold mb-1">Hexagons</h3>
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
							<h3 className="text-lg font-semibold mb-1">Activities</h3>
							<p className="text-sm text-gray-500 text-center">
								{loadingEntity === 'activities' ? 'Loading...' : 'View all activities in console'}
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
			</div>
		</div>
	);
}
