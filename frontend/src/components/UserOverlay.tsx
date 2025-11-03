import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { useUserActivities } from '@/hooks/useUserActivities';
import { User } from 'lucide-react';

export function UserOverlay() {
	const { isAuthenticated, user } = useAuth();
	const { latestActivity } = useUserActivities();
	const navigate = useNavigate();

	if (!isAuthenticated || !user) {
		return null;
	}

	const formatDistance = (meters: number) => {
		return (meters / 1000).toFixed(1) + ' km';
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<div className="absolute top-4 right-4 z-10">
			<div className="bg-white rounded-lg shadow-lg p-4 min-w-[320px]">
				{/* Profile Row */}
				<div className="flex items-center gap-3">
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
						onClick={() => navigate('/profile')}
						className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition-colors"
						title="Profile"
					>
						<User className="w-4 h-4" />
					</button>
				</div>

				{/* Latest Activity Row */}
				{latestActivity && (
					<div className="mt-3 pt-3 border-t border-gray-200">
						<div className="text-xs text-gray-500 mb-1">
							Latest processed: {formatDate(latestActivity.startDate)}
						</div>
						<div className="flex items-center justify-between gap-2">
							<div className="text-sm font-medium text-gray-900 truncate flex-1">
								{latestActivity.name}
							</div>
							<div className="text-sm text-gray-600 whitespace-nowrap">
								{formatDistance(latestActivity.distance)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
