/**
 * Check Strava Webhook Subscription Status
 */
require('dotenv').config();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
  console.error('❌ Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET in .env');
  process.exit(1);
}

async function checkWebhookSubscription() {
  try {
    console.log('🔍 Checking Strava webhook subscriptions...\n');

    const response = await fetch(
      `https://www.strava.com/api/v3/push_subscriptions?client_id=${STRAVA_CLIENT_ID}&client_secret=${STRAVA_CLIENT_SECRET}`
    );

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
    }

    const subscriptions = await response.json();

    if (subscriptions.length === 0) {
      console.log('⚠️  NO WEBHOOK SUBSCRIPTIONS FOUND');
      console.log('\nYou need to create a webhook subscription!');
      console.log('\n📝 To create webhook: node scripts/create-webhook.js');
      return;
    }

    console.log(`✅ Found ${subscriptions.length} webhook subscription(s):\n`);

    subscriptions.forEach((sub, index) => {
      console.log(`Subscription #${index + 1}:`);
      console.log(`  ID: ${sub.id}`);
      console.log(`  Callback URL: ${sub.callback_url}`);
      console.log(`  Created: ${new Date(sub.created_at).toLocaleString()}`);
      console.log('');
    });

    console.log('✅ Webhooks are configured!');

  } catch (error) {
    console.error('❌ Error checking webhook subscription:', error.message);
    process.exit(1);
  }
}

checkWebhookSubscription();
