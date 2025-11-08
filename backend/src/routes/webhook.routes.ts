import { Request, Response, Router } from 'express';
import { User } from '../models/User';
import { processActivity } from '../services/activityProcessing.service';
import { sendSlackNotification } from '../services/slack.service';

const router = Router();

const sseClients: Response[] = [];

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

	res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to activity feed' })}\n\n`);

	req.on('close', () => {
		console.log('🔌 SSE client disconnected');
		const index = sseClients.indexOf(res);
		if (index !== -1) {
			sseClients.splice(index, 1);
		}
	});
});

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

async function handleNewActivity(stravaOwnerId: number, stravaActivityId: number) {
	try {
		console.log(`🏃 Processing new activity ${stravaActivityId} for Strava user ${stravaOwnerId}`);

		const user = await User.findOne({ stravaId: stravaOwnerId });
		if (!user) {
			console.error(`❌ User not found for Strava ID: ${stravaOwnerId}`);
			return;
		}

		const result = await processActivity(stravaActivityId, user, user._id.toString());

		const message = [
			`🎉 *New Activity Processed!*`,
			`👤 User: ${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`,
			`🏃 Activity: ${result.activity.name}`,
			`📏 Distance: ${(result.activity.distance / 1000).toFixed(2)} km`,
			`🔷 Hexagons: ${result.hexagons.created} created, ${result.hexagons.updated} updated`,
		].join('\n');

		await sendSlackNotification(message);

		console.log(`✅ Successfully processed activity ${stravaActivityId}`);
	} catch (error) {
		console.error(`❌ Failed to process activity ${stravaActivityId}:`, error);
		await sendSlackNotification(
			`❌ *Failed to process activity ${stravaActivityId}*\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

export default router;
