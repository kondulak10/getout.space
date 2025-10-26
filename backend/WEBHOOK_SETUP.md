# Strava Webhook Setup Guide

This guide will help you set up Strava webhooks to receive real-time activity updates.

## Prerequisites

1. Your backend must be publicly accessible (use ngrok for local development)
2. You need your Strava Client ID and Client Secret
3. You need to set a webhook verify token in your `.env` file

## Step 1: Configure Environment Variables

Make sure your `backend/.env` file has:

```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_WEBHOOK_VERIFY_TOKEN=any_random_string_you_choose
BACKEND_URL=https://your-public-url.com  # or ngrok URL
```

## Step 2: Make Your Backend Publicly Accessible

### Option A: Using ngrok (for local development)

```bash
# Install ngrok: https://ngrok.com/download

# Start your backend
cd backend
npm run dev

# In another terminal, start ngrok
ngrok http 4000

# Copy the https URL (e.g., https://abc123.ngrok.io)
```

### Option B: Deploy to production
Deploy your backend to a cloud service (AWS, Heroku, Railway, etc.)

## Step 3: Create Webhook Subscription

Use this curl command to subscribe to Strava webhooks:

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_CLIENT_ID \
  -F client_secret=YOUR_CLIENT_SECRET \
  -F 'callback_url=https://YOUR_PUBLIC_URL/api/strava/webhook' \
  -F 'verify_token=YOUR_VERIFY_TOKEN'
```

**Important:**
- Replace `YOUR_CLIENT_ID` with your Strava Client ID
- Replace `YOUR_CLIENT_SECRET` with your Strava Client Secret
- Replace `YOUR_PUBLIC_URL` with your ngrok or production URL
- Replace `YOUR_VERIFY_TOKEN` with the token from your `.env` file

**Example:**
```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=12345 \
  -F client_secret=abcdef123456 \
  -F 'callback_url=https://abc123.ngrok.io/api/strava/webhook' \
  -F 'verify_token=my_secret_verify_token_123'
```

## Step 4: Verify Subscription

If successful, you'll receive a response like:

```json
{
  "id": 123456,
  "application_id": 12345,
  "callback_url": "https://abc123.ngrok.io/api/strava/webhook",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

Check your backend logs - you should see:
```
🔍 Webhook verification request received
✅ Webhook verified
```

## Step 5: Test the Webhook

1. Open your frontend application
2. You should see "Live Activity Feed" with a green dot (connected)
3. Create, update, or delete an activity on Strava
4. The event should appear in your activity feed within seconds!

## Viewing Active Subscriptions

```bash
curl -G https://www.strava.com/api/v3/push_subscriptions \
  -d client_id=YOUR_CLIENT_ID \
  -d client_secret=YOUR_CLIENT_SECRET
```

## Deleting a Subscription

```bash
curl -X DELETE https://www.strava.com/api/v3/push_subscriptions/SUBSCRIPTION_ID \
  -F client_id=YOUR_CLIENT_ID \
  -F client_secret=YOUR_CLIENT_SECRET
```

## Webhook Events

Your backend will receive events for:

- **Activity Created** - New activity uploaded
- **Activity Updated** - Title, type, or privacy changed
- **Activity Deleted** - Activity removed
- **Athlete Deauthorized** - User revoked access

## Event Payload Example

```json
{
  "object_type": "activity",
  "object_id": 123456789,
  "aspect_type": "create",
  "updates": {},
  "owner_id": 987654,
  "subscription_id": 123456,
  "event_time": 1234567890
}
```

## Troubleshooting

### Verification Failed
- Ensure `STRAVA_WEBHOOK_VERIFY_TOKEN` in `.env` matches the token in your curl command
- Check that your backend is publicly accessible
- Verify the callback URL is correct

### No Events Received
- Make sure the subscription was created successfully
- Check that you're authenticated with Strava in your app
- Verify the webhook route is registered in `server.ts`
- Check backend logs for incoming events

### SSE Connection Issues
- Check browser console for connection errors
- Verify CORS is enabled on the backend
- Make sure `/api/strava/events` endpoint is accessible

## Resources

- [Strava Webhooks Documentation](https://developers.strava.com/docs/webhooks/)
- [Strava API Reference](https://developers.strava.com/docs/reference/)
