import { Request, Response, Router } from 'express';

const router = Router();

// Temporary in-memory storage for tokens (will move to DB later)
let userTokens: {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
} | null = null;

// Step 1: Redirect to Strava OAuth
router.get('/api/strava/auth', (req: Request, res: Response) => {
	const clientId = process.env.STRAVA_CLIENT_ID;
	const redirectUri = process.env.FRONTEND_URL; // Redirect to home page where StravaSection handles callback
	const scope = 'read,activity:read_all';

	const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=auto&scope=${scope}`;

	res.json({ authUrl });
});

// Step 2: Exchange code for tokens
router.post('/api/strava/callback', async (req: Request, res: Response) => {
	try {
		const { code } = req.body;

		if (!code) {
			return res.status(400).json({ error: 'Authorization code is required' });
		}

		console.log('🔐 Exchanging authorization code for tokens...');

		const response = await fetch('https://www.strava.com/oauth/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				client_id: process.env.STRAVA_CLIENT_ID,
				client_secret: process.env.STRAVA_CLIENT_SECRET,
				code,
				grant_type: 'authorization_code',
			}),
		});

		if (!response.ok) {
			throw new Error(`Strava token exchange failed: ${response.status}`);
		}

		const data = (await response.json()) as any;

		// Store tokens in memory (later: save to DB)
		userTokens = {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresAt: data.expires_at,
		};

		console.log('✅ Tokens received and stored');

		res.json({
			success: true,
			message: 'Authentication successful',
		});
	} catch (error: any) {
		console.error('❌ Token exchange error:', error.message);
		res.status(500).json({
			error: 'Failed to exchange authorization code',
			details: error.message,
		});
	}
});

// Helper: Refresh access token if expired
async function getValidAccessToken(): Promise<string> {
	if (!userTokens) {
		throw new Error('No tokens available. Please login first.');
	}

	const now = Math.floor(Date.now() / 1000);

	// If token expires in less than 5 minutes, refresh it
	if (userTokens.expiresAt - now < 300) {
		console.log('🔄 Access token expired, refreshing...');

		const response = await fetch('https://www.strava.com/oauth/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				client_id: process.env.STRAVA_CLIENT_ID,
				client_secret: process.env.STRAVA_CLIENT_SECRET,
				refresh_token: userTokens.refreshToken,
				grant_type: 'refresh_token',
			}),
		});

		if (!response.ok) {
			throw new Error(`Token refresh failed: ${response.status}`);
		}

		const data = (await response.json()) as any;

		userTokens = {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresAt: data.expires_at,
		};

		console.log('✅ Token refreshed');
	}

	return userTokens.accessToken;
}

// Step 3: Get Strava activities (with auto token refresh)
router.get('/api/strava/activities', async (req: Request, res: Response) => {
	try {
		if (!userTokens) {
			return res.status(401).json({ error: 'Not authenticated. Please login with Strava first.' });
		}

		console.log('🏃 Fetching Strava activities...');

		// Get valid access token (auto-refreshes if needed)
		const accessToken = await getValidAccessToken();

		// Fetch activities from Strava
		const response = await fetch('https://www.strava.com/api/v3/athlete/activities', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Strava API error: ${response.status}`);
		}

		const activities = (await response.json()) as any[];

		console.log(`✅ Fetched ${activities.length} activities`);
		console.log('First activity:', activities[0]);

		res.json({
			success: true,
			count: activities.length,
			activities: activities,
		});
	} catch (error: any) {
		console.error('❌ Strava API error:', error.message);
		res.status(500).json({
			error: 'Failed to fetch activities',
			details: error.message,
		});
	}
});

// Step 4: Get single activity details
router.get('/api/strava/activities/:id', async (req: Request, res: Response) => {
	try {
		if (!userTokens) {
			return res.status(401).json({ error: 'Not authenticated. Please login with Strava first.' });
		}

		const activityId = req.params.id;
		console.log(`🏃 Fetching Strava activity ${activityId}...`);

		// Get valid access token (auto-refreshes if needed)
		const accessToken = await getValidAccessToken();

		// Fetch single activity from Strava
		const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			if (response.status === 404) {
				return res.status(404).json({ error: 'Activity not found' });
			}
			throw new Error(`Strava API error: ${response.status}`);
		}

		const activity = (await response.json()) as any;

		console.log(`✅ Fetched activity ${activityId}`);
		console.log('Activity details:', activity);

		res.json({
			success: true,
			activity: activity,
		});
	} catch (error: any) {
		console.error('❌ Strava API error:', error.message);
		res.status(500).json({
			error: 'Failed to fetch activity details',
			details: error.message,
		});
	}
});

export default router;
