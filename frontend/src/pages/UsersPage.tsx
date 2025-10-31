import { useQuery, useMutation } from "@apollo/client/react";
import {
	GetUsersDocument,
	DeleteUserDocument,
	User,
} from "@/gql/graphql";
import { useAuth } from "@/contexts/useAuth";
import { useState } from "react";

export default function UsersPage() {
	const { user: currentUser } = useAuth();
	const { data, loading, error, refetch } = useQuery(GetUsersDocument);
	const [deleteUser] = useMutation(DeleteUserDocument, {
		onCompleted: () => {
			refetch();
			alert("✅ User deleted successfully!");
		},
		onError: (error) => {
			alert(`❌ Failed to delete user: ${error.message}`);
		},
	});
	const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

	const handleDeleteUser = async (id: string, userName: string) => {
		if (!currentUser?.isAdmin) {
			alert("❌ You must be an admin to delete users.");
			return;
		}

		const isDeletingSelf = id === currentUser?.id;
		const confirmMessage = isDeletingSelf
			? `⚠️ WARNING: You are about to delete YOUR OWN ACCOUNT!\n\nUser: ${userName}\n\nThis will:\n- Log you out immediately\n- Delete your account permanently\n- Delete all your data\n\nThis cannot be undone!\n\nAre you absolutely sure?`
			: `⚠️ Are you sure you want to delete ${userName}?\n\nThis will permanently delete:\n- Their user account\n- All their data\n\nThis cannot be undone!`;

		if (!confirm(confirmMessage)) {
			return;
		}

		try {
			setDeletingUserId(id);
			await deleteUser({ variables: { id } });

			// If deleting self, log out
			if (isDeletingSelf) {
				localStorage.removeItem('getout_auth_token');
				localStorage.removeItem('getout_user');
				window.location.href = '/';
			}
		} catch (error) {
			console.error("Delete error:", error);
		} finally {
			setDeletingUserId(null);
		}
	};

	if (loading) return <div className="p-8">Loading users...</div>;
	if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-6xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<div>
						<div className="flex items-center gap-3 mb-2">
							<h1 className="text-3xl font-bold">Users Management</h1>
							{currentUser?.isAdmin && (
								<span className="px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
									👑 Admin Access
								</span>
							)}
						</div>
						<p className="text-gray-600">
							{currentUser?.isAdmin
								? "Manage authenticated Strava users and delete accounts"
								: "View authenticated Strava users"}
						</p>
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
											onClick={() => handleDeleteUser(user.id, `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`)}
											disabled={deletingUserId === user.id}
											className={`px-3 py-1 rounded transition-colors ${
												deletingUserId === user.id
													? "text-gray-400 cursor-not-allowed bg-gray-100"
													: user.id === currentUser?.id
													? "text-white bg-orange-600 hover:bg-orange-700"
													: "text-white bg-red-600 hover:bg-red-700"
											}`}
											title={user.id === currentUser?.id ? "Delete your own account (will log you out)" : "Delete user"}
										>
											{deletingUserId === user.id ? "Deleting..." : user.id === currentUser?.id ? "Delete Self" : "Delete"}
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
