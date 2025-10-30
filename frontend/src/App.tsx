import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { MapPage } from '@/pages/MapPage';
import UsersPage from '@/pages/UsersPage';

function App() {
	return (
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/map" element={<MapPage />} />
			<Route path="/users" element={<UsersPage />} />
		</Routes>
	);
}

export default App;
