import { Routes, Route } from 'react-router-dom';
import { IndexPage } from '@/pages/IndexPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function App() {
	return (
		<Routes>
			<Route path="/" element={<IndexPage />} />
			<Route
				path="/profile"
				element={
					<ProtectedRoute>
						<ProfilePage />
					</ProtectedRoute>
				}
			/>
		</Routes>
	);
}

export default App;
