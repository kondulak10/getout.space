import { useAuth } from "@/contexts/useAuth";
import {
	DeleteUserDocument,
	GetUsersDocument,
	RefreshUserTokenDocument,
} from "@/gql/graphql";
import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UsersPage() {
	const { user: currentUser } = useAuth();
	const { data, loading, error, refetch } = useQuery(GetUsersDocument);
	const [deleteUser] = useMutation(DeleteUserDocument, {
		onCompleted: () => {
			refetch();
		},
		onError: () => {
		},
	});
	const [refreshToken] = useMutation(RefreshUserTokenDocument, {
		onCompleted: () => {
		},
		onError: () => {
		},
	});
	const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
	const [refreshingUserId, setRefreshingUserId] = useState<string | null>(null);
	const [showRefreshDialog, setShowRefreshDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [userToRefresh, setUserToRefresh] = useState<{ id: string; name: string } | null>(null);
	const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; isSelf: boolean } | null>(null);

	const handleRefreshToken = async (id: string, userName: string) => {
		if (!currentUser?.isAdmin) {
			return;
		}

		setUserToRefresh({ id, name: userName });
		setShowRefreshDialog(true);
	};

	const confirmRefreshToken = async () => {
		if (!userToRefresh) return;
		
		setShowRefreshDialog(false);
		try {
			setRefreshingUserId(userToRefresh.id);
			await refreshToken({
				variables: { id: userToRefresh.id },
				optimisticResponse: {
					refreshUserToken: {
						__typename: "User",
						id: userToRefresh.id,
						tokenExpiresAt: Math.floor(Date.now() / 1000) + 6 * 60 * 60,
						tokenIsExpired: false,
					},
				},
			});
		} catch (error) {
		} finally {
			setRefreshingUserId(null);
			setUserToRefresh(null);
		}
	};

	const handleDeleteUser = async (id: string, userName: string) => {
		if (!currentUser?.isAdmin) {
			return;
		}

		const isDeletingSelf = id === currentUser?.id;
		setUserToDelete({ id, name: userName, isSelf: isDeletingSelf });
		setShowDeleteDialog(true);
	};

	const confirmDeleteUser = async () => {
		if (!userToDelete) return;
		
		setShowDeleteDialog(false);
		try {
			setDeletingUserId(userToDelete.id);
			await deleteUser({ variables: { id: userToDelete.id } });

			if (userToDelete.isSelf) {
				localStorage.removeItem("getout_auth_token");
				localStorage.removeItem("getout_user");
				window.location.href = "/";
			}
		} catch (error) {
		} finally {
			setDeletingUserId(null);
			setUserToDelete(null);
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
									User
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Webhook Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Joined
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{data?.users?.map((user) => (
								<tr key={user.id} className="hover:bg-gray-50">
									<td className="px-6 py-4">
										<div className="flex items-center gap-3">
											<img
												src={user.stravaProfile.imghex ?? user.stravaProfile.profile ?? ''}
												alt={`${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`}
												className="h-12 w-12 object-cover flex-shrink-0"
												style={{ clipPath: user.stravaProfile.imghex ? 'none' : 'circle(50%)' }}
											/>
											<div className="min-w-0">
												<div className="flex items-center gap-2">
													<div className="text-sm font-medium text-gray-900 truncate">
														{user.stravaProfile.firstname} {user.stravaProfile.lastname}
													</div>
													{user.isAdmin && (
														<span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 flex-shrink-0">
															👑 Admin
														</span>
													)}
												</div>
												<div className="text-xs text-gray-500">
													{user.stravaProfile.username && `@${user.stravaProfile.username} • `}
													ID: {user.stravaId}
												</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4">
										<div className="text-xs">
											{user.tokenIsExpired ? (
												<span className="px-2 py-1 rounded-full bg-red-100 text-red-800 font-semibold inline-block">
													⚠️ Inactive
												</span>
											) : (
												<span className="px-2 py-1 rounded-full bg-green-100 text-green-800 font-semibold inline-block">
													✓ Active
												</span>
											)}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-500">
											{new Date(user.createdAt as string).toLocaleDateString()}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										<div className="flex gap-2">
											{currentUser?.isAdmin && (
												<button
													onClick={() =>
														handleRefreshToken(
															user.id,
															`${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`
														)
													}
													disabled={refreshingUserId === user.id}
													className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
														refreshingUserId === user.id
															? "text-gray-400 cursor-not-allowed bg-gray-100"
															: "text-white bg-blue-600 hover:bg-blue-700"
													}`}
													title="Refresh Strava access token"
												>
													{refreshingUserId === user.id ? "Refreshing..." : "🔄"}
												</button>
											)}
											<button
												onClick={() =>
													handleDeleteUser(
														user.id,
														`${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`
													)
												}
												disabled={deletingUserId === user.id}
												className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
													deletingUserId === user.id
														? "text-gray-400 cursor-not-allowed bg-gray-100"
														: user.id === currentUser?.id
															? "text-white bg-orange-600 hover:bg-orange-700"
															: "text-white bg-red-600 hover:bg-red-700"
												}`}
												title={
													user.id === currentUser?.id
														? "Delete your own account (will log you out)"
														: "Delete user"
												}
											>
												{deletingUserId === user.id ? "..." : "🗑️"}
											</button>
										</div>
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

				<AlertDialog open={showRefreshDialog} onOpenChange={setShowRefreshDialog}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Refresh Strava Token</AlertDialogTitle>
							<AlertDialogDescription>
								Refresh Strava token for {userToRefresh?.name}?
								<br /><br />
								This will request a new access token from Strava.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={confirmRefreshToken}>
								Refresh
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{userToDelete?.isSelf ? "Delete Your Own Account" : "Delete User"}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{userToDelete?.isSelf ? (
									<>
										<strong>WARNING: You are about to delete YOUR OWN ACCOUNT!</strong>
										<br /><br />
										User: {userToDelete?.name}
										<br /><br />
										This will:
										<br />• Log you out immediately
										<br />• Delete your account permanently
										<br />• Delete all your data
										<br /><br />
										This cannot be undone!
										<br /><br />
										Are you absolutely sure?
									</>
								) : (
									<>
										Are you sure you want to delete {userToDelete?.name}?
										<br /><br />
										This will permanently delete:
										<br />• Their user account
										<br />• All their data
										<br /><br />
										This cannot be undone!
									</>
								)}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={confirmDeleteUser} className={userToDelete?.isSelf ? "bg-orange-600 hover:bg-orange-700" : "bg-red-600 hover:bg-red-700"}>
								{userToDelete?.isSelf ? "Delete My Account" : "Delete User"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
