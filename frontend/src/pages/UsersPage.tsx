import {
	useDeleteUserMutation,
	useGetUsersQuery,
	User,
} from "@/gql/graphql";
import { useAuth } from "@/contexts/AuthContext";

export default function UsersPage() {
	const { user: currentUser } = useAuth();
	const { data, loading, error, refetch } = useGetUsersQuery();
	const [deleteUser] = useDeleteUserMutation({
		onCompleted: () => refetch(),
	});

	const handleDeleteUser = async (id: string) => {
		if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
			await deleteUser({ variables: { id } });
		}
	};

	if (loading) return <div className="p-8">Loading users...</div>;
	if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-6xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-3xl font-bold">Users Management</h1>
						<p className="text-gray-600 mt-1">Admin Only - Manage authenticated Strava users</p>
					</div>
					<a
						href="/"
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						← Back to Home
					</a>
				</div>

				<div className="bg-white rounded-lg shadow overflow-hidden">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Profile
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Name
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Strava ID
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Role
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Location
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Created At
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{data?.users?.map((user: User) => (
								<tr key={user.id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap">
										<img
											src={user.stravaProfile.profile}
											alt={`${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`}
											className="h-10 w-10 rounded-full object-cover"
										/>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm font-medium text-gray-900">
											{user.stravaProfile.firstname} {user.stravaProfile.lastname}
										</div>
										{user.stravaProfile.username && (
											<div className="text-xs text-gray-500">@{user.stravaProfile.username}</div>
										)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-500">{user.stravaId}</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{user.isAdmin ? (
											<span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
												👑 Admin
											</span>
										) : (
											<span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
												User
											</span>
										)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-500">
											{[user.stravaProfile.city, user.stravaProfile.state, user.stravaProfile.country]
												.filter(Boolean)
												.join(", ") || "—"}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-500">
											{new Date(user.createdAt).toLocaleString()}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										<button
											onClick={() => handleDeleteUser(user.id)}
											disabled={user.id === currentUser?.id}
											className={`${
												user.id === currentUser?.id
													? "text-gray-400 cursor-not-allowed"
													: "text-red-600 hover:text-red-900"
											}`}
											title={user.id === currentUser?.id ? "Cannot delete yourself" : "Delete user"}
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>

					{data?.users?.length === 0 && (
						<div className="text-center py-12 text-gray-500">
							No users found. Users are created automatically when they login with Strava.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
