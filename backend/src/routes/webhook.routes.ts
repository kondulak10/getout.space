import { Request, Response, Router } from 'express';
import { User } from '../models/User';
import { processActivity } from '../services/activityProcessing.service';
import {
	sendActivityProcessedNotification,
	sendActivityProcessingErrorNotification,
} from '../services/slack.service';

const router = Router();

const sseClients: Response[] = [];

interface StravaWebhookEvent {
	object_type: string;
	object_id: number;
	aspect_type: string;
	owner_id: number;
	subscription_id: number;
	event_time: number;
	updates?: Record<string, unknown>;
}

router.get('/api/strava/webhook', (req: Request, res: Response) => {
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

router.post('/api/strava/webhook', (req: Request, res: Response) => {
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

router.get('/api/strava/events', (req: Request, res: Response) => {
	console.log('🔌 New SSE client connected');

	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.setHeader('Access-Control-Allow-Origin', '*');

	sseClients.push(res);

	res.write(
		`data: ${JSON.stringify({ type: 'connected', message: 'Connected to activity feed' })}\n\n`
	);

	req.on('close', () => {
		console.log('🔌 SSE client disconnected');
		const index = sseClients.indexOf(res);
		if (index !== -1) {
			sseClients.splice(index, 1);
		}
	});
});

function broadcastToClients(event: StravaWebhookEvent) {
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

async function handleNewActivity(stravaOwnerId: number, stravaActivityId: number) {
	let user;

	try {
		console.log(`🏃 Processing new activity ${stravaActivityId} for Strava user ${stravaOwnerId}`);

		user = await User.findOne({ stravaId: stravaOwnerId });
		if (!user) {
			console.error(`❌ User not found for Strava ID: ${stravaOwnerId}`);
			return;
		}

		// Helper to build notification params
		const buildNotificationParams = () => ({
			userName: `${user!.stravaProfile.firstname} ${user!.stravaProfile.lastname}`,
			userStravaId: user!.stravaId,
			userId: user!._id.toString(),
			stravaActivityId,
			source: 'webhook' as const,
		});

		await processActivity(stravaActivityId, user, user._id.toString());

		await sendActivityProcessedNotification(buildNotificationParams());

		console.log(`✅ Successfully processed activity ${stravaActivityId}`);
	} catch (error) {
		console.error(`❌ Failed to process activity ${stravaActivityId}:`, error);

		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		const isNonRunningActivity = errorMessage.includes('Only running activities');

		// Silently fail for non-running activities
		if (isNonRunningActivity) {
			console.log('ℹ️ Skipping non-running activity');
			return;
		}

		// For real errors, send Slack notification if user is available
		if (user) {
			await sendActivityProcessingErrorNotification({
				userName: `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`,
				userStravaId: user.stravaId,
				userId: user._id.toString(),
				stravaActivityId,
				source: 'webhook',
				error: errorMessage,
			});
		}
	}
}

export default router;
