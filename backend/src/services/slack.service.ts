export async function sendSlackNotification(message: string): Promise<void> {
	const webhookUrl = process.env.SLACK_WEBHOOK_URL;

	if (!webhookUrl) {
		console.warn('⚠️ SLACK_WEBHOOK_URL not configured, skipping Slack notification');
		return;
	}

	try {
		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ text: message }),
		});

		if (!response.ok) {
			throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
		}

		console.log('✅ Slack notification sent');
	} catch (error) {
		console.error('❌ Failed to send Slack notification:', error);
	}
}
