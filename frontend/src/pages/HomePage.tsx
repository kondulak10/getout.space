import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { StravaSection } from '@/components/StravaSection';

export function HomePage() {
	const [loading, setLoading] = useState(false);

	const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4001';

	const testBackend = async () => {
		setLoading(true);
		try {
			console.log('🔍 Testing backend at:', backendUrl);

			const response = await fetch(`${backendUrl}/api/test`);
			const data = await response.json();

			console.log('✅ Backend response:', data);
		} catch (error) {
			console.error('❌ Backend error:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
			<div className="w-full max-w-6xl space-y-4">
				{/* Navigation */}
				<div className="flex justify-end">
					<a
						href="/map"
						className="bg-white rounded-lg shadow px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
					>
						🗺️ View Hex Map Test
					</a>
				</div>

				{/* Backend Test Card */}
				<Card className="w-full">
					<CardHeader>
						<CardTitle className="text-2xl">Backend API Test</CardTitle>
						<CardDescription>Test your backend connection</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							onClick={testBackend}
							disabled={loading}
							size="lg"
							className="w-full"
							variant="outline"
						>
							{loading ? 'Testing...' : '🧪 Test Backend API'}
						</Button>
					</CardContent>
					<CardFooter className="text-xs text-muted-foreground">
						Check the console (F12) for results
					</CardFooter>
				</Card>

				{/* Strava Section */}
				<StravaSection />
			</div>
		</div>
	);
}
