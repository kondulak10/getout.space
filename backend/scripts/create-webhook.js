/**
 * Create Strava Webhook Subscription
 */
require('dotenv').config();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_WEBHOOK_VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.getout.space';

if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_WEBHOOK_VERIFY_TOKEN) {
  console.error('❌ Missing required environment variables:');
  console.error('   - STRAVA_CLIENT_ID');
  console.error('   - STRAVA_CLIENT_SECRET');
  console.error('   - STRAVA_WEBHOOK_VERIFY_TOKEN');
  process.exit(1);
}

const CALLBACK_URL = `${BACKEND_URL}/api/strava/webhook`;

async function createWebhookSubscription() {
  try {
    console.log('🔧 Creating Strava webhook subscription...\n');
    console.log(`Callback URL: ${CALLBACK_URL}`);
    console.log(`Verify Token: ${STRAVA_WEBHOOK_VERIFY_TOKEN}\n`);

    const response = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        callback_url: CALLBACK_URL,
        verify_token: STRAVA_WEBHOOK_VERIFY_TOKEN,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to create webhook subscription:');
      console.error(JSON.stringify(data, null, 2));

      if (data.errors) {
        data.errors.forEach((error) => {
          console.error(`\n❌ Error: ${error.field} - ${error.code}`);
          if (error.code === 'invalid') {
            console.error('   → Make sure your backend is publicly accessible at:', CALLBACK_URL);
            console.error('   → The callback URL must respond to Strava verification request');
          }
        });
      }

      process.exit(1);
    }

    console.log('✅ Webhook subscription created successfully!\n');
    console.log('Subscription details:');
    console.log(`  ID: ${data.id}`);
    console.log(`  Callback URL: ${data.callback_url}`);
    console.log(`  Created: ${new Date(data.created_at).toLocaleString()}`);
    console.log('\n📝 Next steps:');
    console.log('1. Create a new activity on Strava');
    console.log('2. Check your backend logs for webhook events');
    console.log('3. Events should appear in the frontend Activity Feed');

  } catch (error) {
    console.error('❌ Error creating webhook subscription:', error.message);
    process.exit(1);
  }
}

createWebhookSubscription();
