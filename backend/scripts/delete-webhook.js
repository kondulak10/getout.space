/**
 * Delete Strava Webhook Subscription
 */
require('dotenv').config();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
  console.error('❌ Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET in .env');
  process.exit(1);
}

async function deleteWebhookSubscriptions() {
  try {
    console.log('🔍 Checking for webhook subscriptions...\n');

    const listResponse = await fetch(
      `https://www.strava.com/api/v3/push_subscriptions?client_id=${STRAVA_CLIENT_ID}&client_secret=${STRAVA_CLIENT_SECRET}`
    );

    if (!listResponse.ok) {
      throw new Error(`Failed to list subscriptions: ${listResponse.status}`);
    }

    const subscriptions = await listResponse.json();

    if (subscriptions.length === 0) {
      console.log('✅ No webhook subscriptions found. Nothing to delete.');
      return;
    }

    console.log(`Found ${subscriptions.length} subscription(s). Deleting...\n`);

    for (const sub of subscriptions) {
      console.log(`Deleting subscription ${sub.id} (${sub.callback_url})...`);

      const deleteResponse = await fetch(
        `https://www.strava.com/api/v3/push_subscriptions/${sub.id}?client_id=${STRAVA_CLIENT_ID}&client_secret=${STRAVA_CLIENT_SECRET}`,
        { method: 'DELETE' }
      );

      if (deleteResponse.ok) {
        console.log(`✅ Deleted subscription ${sub.id}`);
      } else {
        console.error(`❌ Failed to delete subscription ${sub.id}: ${deleteResponse.status}`);
      }
    }

    console.log('\n✅ All webhook subscriptions deleted!');

  } catch (error) {
    console.error('❌ Error deleting webhook subscriptions:', error.message);
    process.exit(1);
  }
}

deleteWebhookSubscriptions();
