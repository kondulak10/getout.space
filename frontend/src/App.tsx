import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { IndexPage } from '@/pages/IndexPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Loading } from '@/components/ui/Loading';

const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const HexTestPage = lazy(() => import('@/pages/HexTestPage').then(m => ({ default: m.HexTestPage })));
const TestPage = lazy(() => import('@/pages/TestPage').then(m => ({ default: m.TestPage })));

// Wrapper to force remount when userId changes
function ProfilePageWrapper() {
	const { userId } = useParams<{ userId?: string }>();
	return <ProfilePage key={userId || 'own-profile'} />;
}

function App() {
	useEffect(() => {
		localStorage.removeItem('activity_profile_image_positions');
	}, []);

	return (
		<Suspense fallback={<Loading />}>
			<Routes>
				<Route path="/" element={<IndexPage />} />
				<Route
					path="/profile/:userId"
					element={
						<ProtectedRoute>
							<ProfilePageWrapper />
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
