import {
	useCreateUserMutation,
	useDeleteUserMutation,
	useGetUsersQuery,
	User,
} from "@/gql/graphql";

export default function UsersPage() {
	const { data, loading, error, refetch } = useGetUsersQuery();
	const [createUser] = useCreateUserMutation({
		onCompleted: () => refetch(),
	});
	const [deleteUser] = useDeleteUserMutation({
		onCompleted: () => refetch(),
	});

	const handleCreateUser = async () => {
		const name = prompt("Enter user name:");
		const img = prompt("Enter image URL:");
		if (name && img) {
			await createUser({ variables: { name, img } });
		}
	};

	const handleDeleteUser = async (id: string) => {
		if (confirm("Are you sure you want to delete this user?")) {
			await deleteUser({ variables: { id } });
		}
	};

	if (loading) return <div className="p-8">Loading users...</div>;
	if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-6xl mx-auto">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-3xl font-bold">Users</h1>
					<button
						onClick={handleCreateUser}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Add User
					</button>
				</div>

				<div className="bg-white rounded-lg shadow overflow-hidden">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Image
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Name
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Created At
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Updated At
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
											src={user.img}
											alt={user.name}
											className="h-10 w-10 rounded-full object-cover"
										/>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm font-medium text-gray-900">{user.name}</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-500">
											{new Date(user.createdAt).toLocaleString()}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="text-sm text-gray-500">
											{new Date(user.updatedAt).toLocaleString()}
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm">
										<button
											onClick={() => handleDeleteUser(user.id)}
											className="text-red-600 hover:text-red-900"
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
							No users found. Click "Add User" to create one.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
