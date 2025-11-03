import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { StravaSection } from '@/components/StravaSection';
import { useAuth } from '@/contexts/useAuth';

interface TestUser {
	_id: string;
	name: string;
	img: string;
	createdAt: string;
}

export function HomePage() {
	const { isAuthenticated, logout, user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [usersLoading, setUsersLoading] = useState(false);
	const [users, setUsers] = useState<TestUser[]>([]);

	const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

	const testBackend = async () => {
		setLoading(true);
		try {
			console.log('🔍 Testing backend at:', backendUrl);

			const response = await fetch(`${backendUrl}/api/test`);
			const data = await response.json();

			console.log('✅ Backend response:', data);
		} catch (error) {
			console.error('❌ Backend error:', error);
		} finally {
			setLoading(false);
		}
	};

	const testBackendUsers = async () => {
		setUsersLoading(true);
		try {
			console.log('🔍 Fetching users from:', backendUrl);

			const response = await fetch(`${backendUrl}/api/users`);
			const data = await response.json();

			console.log('✅ Users response:', data);
			setUsers(data.users || []);
		} catch (error) {
			console.error('❌ Backend users error:', error);
			setUsers([]);
		} finally {
			setUsersLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
			<div className="w-full max-w-6xl space-y-4">
				{/* Navigation */}
				<div className="flex justify-between items-center">
					<div className="flex gap-2">
						<a
							href="/map"
							className="bg-white rounded-lg shadow px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
						>
							🗺️ View Hex Map
						</a>
						{isAuthenticated && user?.isAdmin && (
							<a
								href="/users"
								className="bg-white rounded-lg shadow px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
							>
								👥 Users (Admin)
							</a>
						)}
					</div>
					{isAuthenticated && (
						<button
							onClick={logout}
							className="bg-red-500 text-white rounded-lg shadow px-4 py-2 text-sm font-medium hover:bg-red-600 transition-colors"
						>
							🚪 Logout
						</button>
					)}
				</div>

				{/* Backend Test Card */}
				<Card className="w-full">
					<CardHeader>
						<CardTitle className="text-2xl">Backend API Test</CardTitle>
						<CardDescription>Test your backend connection</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<Button
								onClick={testBackend}
								disabled={loading}
								size="lg"
								className="w-full"
								variant="outline"
							>
								{loading ? 'Testing...' : '🧪 Test Backend API'}
							</Button>
							<Button
								onClick={testBackendUsers}
								disabled={usersLoading}
								size="lg"
								className="w-full"
								variant="outline"
							>
								{usersLoading ? 'Loading...' : '👥 Test Backend Users'}
							</Button>
						</div>

						{/* Users List */}
						{users.length > 0 && (
							<div className="mt-4 p-4 bg-slate-50 rounded-lg border">
								<h3 className="font-semibold mb-3 text-sm text-slate-700">
									Users ({users.length})
								</h3>
								<div className="space-y-2">
									{users.map((user) => (
										<div
											key={user._id}
											className="flex items-center gap-3 p-3 bg-white rounded border"
										>
											<img
												src={user.img}
												alt={user.name}
												className="w-10 h-10 rounded-full object-cover"
											/>
											<div>
												<p className="font-medium text-sm">{user.name}</p>
												<p className="text-xs text-slate-500">
													Created: {new Date(user.createdAt).toLocaleString()}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</CardContent>
					<CardFooter className="text-xs text-muted-foreground">
						Check the console (F12) for results
					</CardFooter>
				</Card>

				{/* Strava Section */}
				<StravaSection />
			</div>
		</div>
	);
}
