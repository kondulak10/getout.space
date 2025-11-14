/**
 * Test script to send sample Slack notifications
 * Run with: node scripts/test-slack-messages.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

if (!SLACK_WEBHOOK_URL) {
	console.error('❌ SLACK_WEBHOOK_URL not configured in .env');
	process.exit(1);
}

async function sendSlackMessage(message) {
	try {
		const response = await fetch(SLACK_WEBHOOK_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ text: message }),
		});

		if (!response.ok) {
			throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
		}

		console.log('✅ Message sent successfully');
	} catch (error) {
		console.error('❌ Failed to send message:', error);
	}
}

async function testAllMessages() {
	console.log('📨 Sending test Slack messages...\n');

	// Sample data
	const sampleUserId = '507f1f77bcf86cd799439011';
	const sampleStravaId = 12345678;
	const sampleUserName = 'John Doe';
	const sampleActivityId = 87654321;

	// Test 1: New User Signup
	console.log('1️⃣ Testing New User Signup notification...');
	const signupMessage = `👋 *New User Signup!*
👤 <https://getout.space/profile/${sampleUserId}|${sampleUserName}>
🔗 <https://www.strava.com/athletes/${sampleStravaId}|Strava Profile>`;
	await sendSlackMessage(signupMessage);
	await sleep(1000);

	// Test 2: Activity Processed from Webhook
	console.log('\n2️⃣ Testing Activity Processed (Webhook) notification...');
	const webhookMessage = `🔔 *Activity Processed*
👤 <https://getout.space/profile/${sampleUserId}|${sampleUserName}>
🔗 <https://www.strava.com/athletes/${sampleStravaId}|Strava Profile> | <https://www.strava.com/activities/${sampleActivityId}|Activity>`;
	await sendSlackMessage(webhookMessage);
	await sleep(1000);

	// Test 3: Activity Processed after Signup
	console.log('\n3️⃣ Testing Activity Processed (After Signup) notification...');
	const afterSignupMessage = `🎯 *Activity Processed*
👤 <https://getout.space/profile/${sampleUserId}|${sampleUserName}>
🔗 <https://www.strava.com/athletes/${sampleStravaId}|Strava Profile> | <https://www.strava.com/activities/${sampleActivityId}|Activity>`;
	await sendSlackMessage(afterSignupMessage);
	await sleep(1000);

	// Test 4: Activity Processed Manually
	console.log('\n4️⃣ Testing Activity Processed (Manual) notification...');
	const manualMessage = `🔧 *Activity Processed*
👤 <https://getout.space/profile/${sampleUserId}|${sampleUserName}>
🔗 <https://www.strava.com/athletes/${sampleStravaId}|Strava Profile> | <https://www.strava.com/activities/${sampleActivityId}|Activity>`;
	await sendSlackMessage(manualMessage);
	await sleep(1000);

	console.log('\n--- ERROR NOTIFICATIONS ---\n');

	// Test 5: Error from Webhook
	console.log('5️⃣ Testing Activity Processing Error (Webhook)...');
	const webhookErrorMessage = `🔔 ❌ *Activity Processing Failed*
👤 <https://getout.space/profile/${sampleUserId}|${sampleUserName}>
🔗 <https://www.strava.com/athletes/${sampleStravaId}|Strava Profile> | <https://www.strava.com/activities/${sampleActivityId}|Activity>
⚠️ Error: Activity has no GPS data available`;
	await sendSlackMessage(webhookErrorMessage);
	await sleep(1000);

	// Test 6: Error after Signup
	console.log('\n6️⃣ Testing Activity Processing Error (After Signup)...');
	const afterSignupErrorMessage = `🎯 ❌ *Activity Processing Failed*
👤 <https://getout.space/profile/${sampleUserId}|${sampleUserName}>
🔗 <https://www.strava.com/athletes/${sampleStravaId}|Strava Profile> | <https://www.strava.com/activities/${sampleActivityId}|Activity>
⚠️ Error: Strava API error: 429 Rate limit exceeded`;
	await sendSlackMessage(afterSignupErrorMessage);
	await sleep(1000);

	// Test 7: Error from Manual Processing
	console.log('\n7️⃣ Testing Activity Processing Error (Manual)...');
	const manualErrorMessage = `🔧 ❌ *Activity Processing Failed*
👤 <https://getout.space/profile/${sampleUserId}|${sampleUserName}>
🔗 <https://www.strava.com/athletes/${sampleStravaId}|Strava Profile> | <https://www.strava.com/activities/${sampleActivityId}|Activity>
⚠️ Error: Database connection timeout`;
	await sendSlackMessage(manualErrorMessage);

	console.log('\n✅ All test messages sent!');
	console.log('\n📱 Check your Slack channel to see how they look.');
	console.log('\n📊 Total messages sent: 7 (4 success + 3 error scenarios)');
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the tests
testAllMessages().catch((error) => {
	console.error('❌ Error running tests:', error);
	process.exit(1);
});
