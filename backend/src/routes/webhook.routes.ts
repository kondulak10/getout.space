import { Request, Response, Router } from 'express';
import { randomUUID } from 'crypto';
import { User } from '../models/User';
import { processActivity } from '../services/activityProcessing.service';
import {
	sendActivityProcessedNotification,
	sendActivityProcessingErrorNotification,
	buildActivityNotificationParams,
} from '../services/slack.service';
import { webhookLimiter, sseLimiter } from '../middleware/rateLimiter';

const router = Router();

// Use Map instead of array for better connection management
// Key: connection ID, Value: Response object
const sseClients = new Map<string, Response>();

interface StravaWebhookEvent {
	object_type: string;
	object_id: number;
	aspect_type: string;
	owner_id: number;
	subscription_id: number;
	event_time: number;
	updates?: Record<string, unknown>;
}

router.get('/api/strava/webhook', webhookLimiter, (req: Request, res: Response) => {
	const mode = req.query['hub.mode'];
	const token = req.query['hub.verify_token'];
	const challenge = req.query['hub.challenge'];

	console.log('🔍 Webhook verification request received');
	console.log('Mode:', mode);
	console.log('Token:', token);
	console.log('Challenge:', challenge);

	const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

	if (mode === 'subscribe' && token === verifyToken) {
		console.log('✅ Webhook verified');
		res.json({ 'hub.challenge': challenge });
	} else {
		console.error('❌ Webhook verification failed');
		res.status(403).json({ error: 'Verification failed' });
	}
});

router.post('/api/strava/webhook', webhookLimiter, (req: Request, res: Response) => {
	const event = req.body;

	console.log('📥 Webhook event received:');
	console.log(JSON.stringify(event, null, 2));

	res.status(200).json({ success: true });

	broadcastToClients(event);

	if (event.object_type === 'activity' && event.aspect_type === 'create') {
		handleNewActivity(event.owner_id, event.object_id).catch((error) => {
			console.error('❌ Error handling new activity:', error);
		});
	}
});

router.get('/api/strava/events', sseLimiter, (req: Request, res: Response) => {
	const connectionId = randomUUID();
	console.log(`🔌 New SSE client connected (ID: ${connectionId})`);

	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.setHeader('Access-Control-Allow-Origin', '*');

	sseClients.set(connectionId, res);

	res.write(
		`data: ${JSON.stringify({ type: 'connected', message: 'Connected to activity feed' })}\n\n`
	);

	req.on('close', () => {
		console.log(`🔌 SSE client disconnected (ID: ${connectionId})`);
		sseClients.delete(connectionId);
	});
});

function broadcastToClients(event: StravaWebhookEvent) {
	const message = `data: ${JSON.stringify(event)}\n\n`;

	console.log(`📡 Broadcasting to ${sseClients.size} connected clients`);

	// Iterate through Map entries
	sseClients.forEach((client, connectionId) => {
		try {
			client.write(message);
		} catch (error) {
			console.error(`❌ Error broadcasting to client ${connectionId}:`, error);
			// Remove failed connection
			sseClients.delete(connectionId);
		}
	});
}

async function handleNewActivity(stravaOwnerId: number, stravaActivityId: number) {
	let user;

	try {
		console.log(`🏃 Processing new activity ${stravaActivityId} for Strava user ${stravaOwnerId}`);

		user = await User.findOne({ stravaId: stravaOwnerId });
		if (!user) {
			console.error(`❌ User not found for Strava ID: ${stravaOwnerId}`);
			return;
		}

		await processActivity(stravaActivityId, user, user._id.toString());

		// Send success notification
		await sendActivityProcessedNotification(
			buildActivityNotificationParams(user, stravaActivityId, 'webhook')
		);

		console.log(`✅ Successfully processed activity ${stravaActivityId}`);
	} catch (error) {
		console.error(`❌ Failed to process activity ${stravaActivityId}:`, error);

		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		const isNonRunningActivity = errorMessage.includes('Only running activities');
		const hasNoGPS = errorMessage.includes('summary_polyline missing');

		// Silently skip non-running activities and activities without GPS (treadmill runs, manual entries, etc.)
		if (isNonRunningActivity || hasNoGPS) {
			console.log(`ℹ️ Skipping activity: ${errorMessage}`);
			return;
		}

		// For real errors, send Slack notification if user is available
		if (user) {
			await sendActivityProcessingErrorNotification({
				...buildActivityNotificationParams(user, stravaActivityId, 'webhook'),
				error: errorMessage,
			});
		}
	}
}

export default router;
