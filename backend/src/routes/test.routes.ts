import { Router, Request, Response } from 'express';
import { User } from '../models/User';

const router = Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
	res.json({
		status: 'ok',
		message: 'Backend is running!',
		timestamp: new Date().toISOString(),
	});
});

// Test route
router.get('/api/test', (req: Request, res: Response) => {
	res.json({
		message: 'Hello from GetOut backend!',
		data: {
			users: 0,
			activities: 0,
		},
	});
});

// Echo route - test POST requests
router.post('/api/echo', (req: Request, res: Response) => {
	res.json({
		message: 'Echo received',
		yourData: req.body,
	});
});

// Create a test user
router.post('/api/users', async (req: Request, res: Response) => {
	try {
		const { name, img } = req.body;

		if (!name || !img) {
			return res.status(400).json({ error: 'Name and img are required' });
		}

		const user = new User({
			name,
			img,
		});

		await user.save();

		res.status(201).json({
			success: true,
			message: 'User created successfully',
			user,
		});
	} catch (error: any) {
		console.error('Error creating user:', error);
		res.status(500).json({ error: 'Failed to create user', details: error.message });
	}
});

// Get all users
router.get('/api/users', async (req: Request, res: Response) => {
	try {
		const users = await User.find();

		res.json({
			success: true,
			count: users.length,
			users,
		});
	} catch (error: any) {
		console.error('Error fetching users:', error);
		res.status(500).json({ error: 'Failed to fetch users', details: error.message });
	}
});

export default router;
