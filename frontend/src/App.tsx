import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { IndexPage } from '@/pages/IndexPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const HexTestPage = lazy(() => import('@/pages/HexTestPage').then(m => ({ default: m.HexTestPage })));
const TestPage = lazy(() => import('@/pages/TestPage').then(m => ({ default: m.TestPage })));

function App() {
	useEffect(() => {
		localStorage.removeItem('activity_profile_image_positions');
	}, []);

	return (
		<Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black text-white">Loading...</div>}>
			<Routes>
				<Route path="/" element={<IndexPage />} />
				<Route
					path="/profile/:userId"
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
		</Suspense>
	);
}

export default App;
