import { useAuth } from '@/contexts/useAuth';

export function UserOverlay() {
	const { isAuthenticated, user, logout } = useAuth();

	if (!isAuthenticated || !user) {
		return null;
	}

	return (
		<div className="absolute top-4 right-4 z-10">
			<div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[280px]">
				<img
					src={user.profile.profile}
					alt={`${user.profile.firstname} ${user.profile.lastname}`}
					className="w-12 h-12 rounded-full object-cover"
				/>
				<div className="flex-1">
					<div className="font-semibold text-sm text-gray-900">
						{user.profile.firstname} {user.profile.lastname}
					</div>
					<div className="text-xs text-gray-500">Strava ID: {user.stravaId}</div>
				</div>
				<button
					onClick={logout}
					className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
				>
					Logout
				</button>
			</div>
		</div>
	);
}
