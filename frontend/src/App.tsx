import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { IndexPage } from '@/pages/IndexPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { HexTestPage } from '@/pages/HexTestPage';
import { TestPage } from '@/pages/TestPage';
import AdminPage from '@/pages/AdminPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function App() {
	useEffect(() => {
		localStorage.removeItem('activity_profile_image_positions');
	}, []);

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
			<Route
				path="/admin"
				element={
					<ProtectedRoute requireAdmin={true}>
						<AdminPage />
					</ProtectedRoute>
				}
			/>
			<Route path="/hex-test" element={<HexTestPage />} />
			<Route path="/test" element={<TestPage />} />
		</Routes>
	);
}

export default App;
