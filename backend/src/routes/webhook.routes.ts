import { Request, Response, Router } from 'express';

const router = Router();

// Store SSE clients for broadcasting events
const sseClients: Response[] = [];

// Webhook verification endpoint (GET)
// Strava sends this to verify your webhook endpoint
router.get('/api/strava/webhook', (req: Request, res: Response) => {
	const mode = req.query['hub.mode'];
	const token = req.query['hub.verify_token'];
	const challenge = req.query['hub.challenge'];

	console.log('🔍 Webhook verification request received');
	console.log('Mode:', mode);
	console.log('Token:', token);
	console.log('Challenge:', challenge);

	// Verify the token matches your STRAVA_WEBHOOK_VERIFY_TOKEN
	const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

	if (mode === 'subscribe' && token === verifyToken) {
		console.log('✅ Webhook verified');
		// Respond with the challenge to complete verification
		res.json({ 'hub.challenge': challenge });
	} else {
		console.error('❌ Webhook verification failed');
		res.status(403).json({ error: 'Verification failed' });
	}
});

// Webhook event handler (POST)
// Strava sends activity events here
router.post('/api/strava/webhook', (req: Request, res: Response) => {
	const event = req.body;

	console.log('📥 Webhook event received:');
	console.log(JSON.stringify(event, null, 2));

	// Event structure:
	// {
	//   object_type: 'activity' | 'athlete',
	//   object_id: number,
	//   aspect_type: 'create' | 'update' | 'delete',
	//   updates: { ... },
	//   owner_id: number,
	//   subscription_id: number,
	//   event_time: number
	// }

	// Acknowledge receipt immediately (must respond within 2 seconds)
	res.status(200).json({ success: true });

	// Broadcast event to all connected SSE clients
	broadcastToClients(event);
});

// SSE endpoint for real-time updates to frontend
router.get('/api/strava/events', (req: Request, res: Response) => {
	console.log('🔌 New SSE client connected');

	// Set headers for SSE
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.setHeader('Access-Control-Allow-Origin', '*');

	// Add client to the list
	sseClients.push(res);

	// Send initial connection message
	res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to activity feed' })}\n\n`);

	// Remove client when connection closes
	req.on('close', () => {
		console.log('🔌 SSE client disconnected');
		const index = sseClients.indexOf(res);
		if (index !== -1) {
			sseClients.splice(index, 1);
		}
	});
});

// Helper function to broadcast events to all SSE clients
function broadcastToClients(event: any) {
	const message = `data: ${JSON.stringify(event)}\n\n`;

	console.log(`📡 Broadcasting to ${sseClients.length} connected clients`);

	sseClients.forEach((client) => {
		try {
			client.write(message);
		} catch (error) {
			console.error('Error broadcasting to client:', error);
		}
	});
}

export default router;
