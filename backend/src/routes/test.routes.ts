import { Router, Request, Response } from 'express';
import * as version from '../version';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
	res.json({
		status: 'ok',
		message: 'Backend is running!',
		timestamp: new Date().toISOString(),
	});
});

router.get('/version', (req: Request, res: Response) => {
	res.json({
		version: version.APP_VERSION,
		buildTimestamp: version.BUILD_TIMESTAMP,
		versionString: version.getVersionString(),
	});
});

router.get('/api/test', (req: Request, res: Response) => {
	res.json({
		message: 'Hello from GetOut backend!',
		timestamp: new Date().toISOString(),
	});
});

router.post('/api/echo', (req: Request, res: Response) => {
	res.json({
		message: 'Echo received',
		yourData: req.body,
		timestamp: new Date().toISOString(),
	});
});

// SECURITY: Only enable test auth endpoints in development/test environments
if (process.env.NODE_ENV !== 'production') {
	/**
	 * Test endpoint to create a session token without OAuth flow
	 * This allows E2E tests to bypass Strava authentication
	 *
	 * POST /api/test/auth
	 * Body: { userType?: 'regular' | 'admin' | 'premium' }
	 */
	router.post('/api/test/auth', async (req: Request, res: Response) => {
		try {
			const { userType = 'regular' } = req.body;

			// Define test user configurations
			const testUserConfigs = {
				regular: {
					stravaId: 99999001,
					stravaProfile: {
						firstname: 'Test',
						lastname: 'User',
						profile: 'https://via.placeholder.com/150',
					},
					email: 'test@getout.space',
					isAdmin: false,
					isPremium: false,
				},
				admin: {
					stravaId: 99999002,
					stravaProfile: {
						firstname: 'Admin',
						lastname: 'Tester',
						profile: 'https://via.placeholder.com/150',
					},
					email: 'admin@getout.space',
					isAdmin: true,
					isPremium: true,
				},
				premium: {
					stravaId: 99999003,
					stravaProfile: {
						firstname: 'Premium',
						lastname: 'User',
						profile: 'https://via.placeholder.com/150',
					},
					email: 'premium@getout.space',
					isAdmin: false,
					isPremium: true,
				},
			};

			const config =
				testUserConfigs[userType as keyof typeof testUserConfigs] || testUserConfigs.regular;

			// Find or create test user
			let user = await User.findOne({ stravaId: config.stravaId });

			if (!user) {
				user = await User.create({
					...config,
					// No encrypted tokens - tests won't call Strava API
					accessToken: 'test_token_not_real',
					refreshToken: 'test_refresh_not_real',
					tokenExpiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // Far future (Unix timestamp in seconds)
				});
			} else {
				// Update user with latest config (in case role changed)
				user.stravaProfile.firstname = config.stravaProfile.firstname;
				user.stravaProfile.lastname = config.stravaProfile.lastname;
				user.isAdmin = config.isAdmin;
				user.isPremium = config.isPremium;
				await user.save();
			}

			// Generate JWT
			const token = jwt.sign(
				{
					userId: user._id.toString(),
					role: user.isAdmin ? 'admin' : 'user',
				},
				process.env.JWT_SECRET!,
				{ expiresIn: '7d' }
			);

			res.json({
				token,
				user: {
					id: user._id.toString(),
					stravaId: user.stravaId,
					firstName: user.stravaProfile.firstname,
					lastName: user.stravaProfile.lastname,
					profilePicture: user.stravaProfile.profile,
					isAdmin: user.isAdmin,
					isPremium: user.isPremium,
				},
			});
		} catch (error) {
			console.error('Test auth error:', error);
			res.status(500).json({ error: 'Failed to create test session' });
		}
	});

	/**
	 * Test endpoint to clean up test data
	 * DELETE /api/test/cleanup
	 */
	router.delete('/api/test/cleanup', async (req: Request, res: Response) => {
		try {
			// Delete all test users and their data (test users have stravaId starting with 99999)
			const testUsers = await User.find({
				stravaId: { $gte: 99999000, $lte: 99999999 },
			});

			const testUserIds = testUsers.map((u) => u._id);

			// Delete test users' hexagons
			const { Hexagon } = await import('../models/Hexagon');
			await Hexagon.deleteMany({ currentOwnerId: { $in: testUserIds } });

			// Delete test users' activities
			const { Activity } = await import('../models/Activity');
			await Activity.deleteMany({ userId: { $in: testUserIds } });

			// Delete test users
			await User.deleteMany({ _id: { $in: testUserIds } });

			res.json({
				message: 'Test data cleaned up',
				deletedUsers: testUsers.length,
			});
		} catch (error) {
			console.error('Test cleanup error:', error);
			res.status(500).json({ error: 'Failed to cleanup test data' });
		}
	});

	console.log('🧪 Test auth endpoints enabled at /api/test/auth');
}

export default router;
