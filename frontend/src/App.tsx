import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { IndexPage } from '@/pages/IndexPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { HexTestPage } from '@/pages/HexTestPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function App() {
	// Clear cached profile image positions on app mount
	// This ensures fresh hexagons show up correctly
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
			<Route path="/hex-test" element={<HexTestPage />} />
		</Routes>
	);
}

export default App;
