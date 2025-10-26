# GetOut.space - Setup Guide

Complete guide to set up the Strava location capture game locally and deploy to AWS.

## What is GetOut.space?

A location-based game that captures areas on a map through your Strava activities. Compete with friends to capture more territories by running, cycling, and exploring!

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Apollo Client (GraphQL)
- TailwindCSS (planned)

### Backend
- Node.js + TypeScript
- Express + Apollo Server (GraphQL)
- MongoDB Atlas (geospatial database)
- Strava API + Webhooks

### Infrastructure
- Frontend: AWS S3 + CloudFront (static hosting)
- Backend: AWS ECS Fargate (containers)
- Database: MongoDB Atlas
- CI/CD: GitHub Actions

---

## Local Development Setup

### Prerequisites

1. **Node.js 20+** - https://nodejs.org
2. **MongoDB Atlas Account** - https://www.mongodb.com/cloud/atlas
3. **Strava API Application** - https://www.strava.com/settings/api

---

### Step 1: Clone and Install Dependencies

```bash
cd getout.space

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

---

### Step 2: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster (M0)
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

---

### Step 3: Set Up Strava API

1. Go to https://www.strava.com/settings/api
2. Create a new application
   - **Application Name**: GetOut.space (or any name)
   - **Category**: Training
   - **Website**: http://localhost:5173
   - **Authorization Callback Domain**: localhost
3. Save your:
   - **Client ID**
   - **Client Secret**

---

### Step 4: Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
# Server
NODE_ENV=development
PORT=4000

# MongoDB (paste your Atlas connection string)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/getout?retryWrites=true&w=majority

# Strava API (from Step 3)
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here
STRAVA_WEBHOOK_VERIFY_TOKEN=some_random_string_you_create

# JWT (create a random secret)
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000

# AWS (for production only)
AWS_REGION=eu-north-1
```

**Generate random secrets:**
```bash
# For JWT_SECRET and WEBHOOK_VERIFY_TOKEN
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 5: Configure Frontend Environment

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:4000/graphql
VITE_BACKEND_URL=http://localhost:4000
```

---

### Step 6: Start the Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
╔═══════════════════════════════════════════╗
║   🚀 GetOut Backend Server Running       ║
╠═══════════════════════════════════════════╣
║   GraphQL:  http://localhost:4000/graphql  ║
║   Health:   http://localhost:4000/health   ║
║   Webhook:  http://localhost:4000/webhook/strava
║   OAuth:    http://localhost:4000/auth/strava
╚═══════════════════════════════════════════╝
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

### Step 7: Test the Application

1. Open http://localhost:5173
2. Click "Connect with Strava"
3. Authorize the application
4. You'll be redirected back with your activities!

---

## Features Implemented

### ✅ Core Features
- Strava OAuth authentication
- Fetch and display user activities
- Activity details view
- Geospatial area capture logic
- MongoDB geospatial queries
- Webhook listener for real-time activity updates
- GraphQL API with Apollo Server

### 🎯 Geospatial Capture Logic

When an activity is processed:
1. Decode the polyline from Strava
2. Extract GPS points along the route
3. Filter points (minimum 200m apart)
4. Check if each point is already captured
5. Capture new areas (100m radius circles)
6. Update user's total captured count

### 📊 GraphQL API

**Queries:**
- `me` - Get current user profile
- `myActivities` - Get user's activities (paginated)
- `activity(id)` - Get detailed activity
- `leaderboard(limit)` - Get top users by captures
- `capturedAreasNear(lat, lon)` - Find captured areas nearby

**Mutations:**
- `stravaAuth(code)` - OAuth authentication
- `syncActivities` - Manually sync from Strava
- `processActivity(id)` - Process activity for captures

---

## Strava Webhook Setup (Optional for Local Dev)

For webhooks to work locally, you need to expose your local server to the internet.

### Option 1: Using ngrok

1. Install ngrok: https://ngrok.com
2. Start ngrok:
   ```bash
   ngrok http 4000
   ```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update Strava webhook:
   ```bash
   curl -X POST https://www.strava.com/api/v3/push_subscriptions \
     -F client_id=YOUR_CLIENT_ID \
     -F client_secret=YOUR_CLIENT_SECRET \
     -F callback_url=https://abc123.ngrok.io/webhook/strava \
     -F verify_token=YOUR_VERIFY_TOKEN
   ```

Now, when you create a new activity on Strava, it will automatically be captured!

---

## Deployment to AWS

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete AWS deployment instructions.

---

## Troubleshooting

### MongoDB Connection Error

```
❌ Failed to connect to MongoDB
```

**Solution:**
- Check your MONGODB_URI in `.env`
- Verify your IP is whitelisted in MongoDB Atlas
- Ensure database user has correct permissions

### Strava OAuth Fails

```
Failed to authenticate with Strava
```

**Solution:**
- Verify STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in `.env`
- Check authorization callback domain is set to `localhost` in Strava API settings
- Make sure both frontend and backend URLs are correct

### Activities Not Loading

**Solution:**
- Check browser console for GraphQL errors
- Verify JWT token is stored (check localStorage in browser DevTools)
- Ensure backend GraphQL endpoint is responding: http://localhost:4000/graphql

### Webhook Not Working

**Solution:**
- Webhooks only work with public URLs (use ngrok for local dev)
- Verify STRAVA_WEBHOOK_VERIFY_TOKEN matches what you registered
- Check webhook is registered: `GET https://www.strava.com/api/v3/push_subscriptions?client_id=...&client_secret=...`

---

## Development Tips

### Reset Database
```bash
# Connect to MongoDB and drop collections
mongo "your_connection_string"
> use getout
> db.users.drop()
> db.activities.drop()
```

### View GraphQL Playground

While backend is running, visit:
http://localhost:4000/graphql

Test queries:
```graphql
query {
  me {
    username
    totalCapturedCount
  }
}
```

### Check Backend Health

```bash
curl http://localhost:4000/health
```

---

## Project Structure

```
getout.space/
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── lib/              # Apollo client, queries, utils
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # Entry point
│   └── package.json
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── models/           # MongoDB models
│   │   ├── resolvers/        # GraphQL resolvers
│   │   ├── schema/           # GraphQL schema
│   │   ├── services/         # Business logic
│   │   ├── webhooks/         # Strava webhook handlers
│   │   ├── middleware/       # Auth middleware
│   │   └── server.ts         # Express + Apollo server
│   ├── Dockerfile
│   └── package.json
├── infrastructure/             # Terraform for AWS
│   ├── main.tf               # Frontend infrastructure
│   ├── variables.tf
│   └── outputs.tf
├── .github/workflows/          # CI/CD
│   └── deploy.yml            # Auto-deployment
├── DEPLOYMENT.md              # AWS deployment guide
└── README.md                  # Project overview
```

---

## Next Steps

1. ✅ **Test locally** - Make sure everything works
2. ✅ **Create activities on Strava** - See them appear in the app
3. ✅ **View captures** - Check how many areas you've captured
4. 🚀 **Deploy to AWS** - Follow DEPLOYMENT.md
5. 🗺️ **Add map visualization** - Display captured areas on a map
6. 👥 **Add teams/competitions** - Compete with friends
7. 🎯 **Add challenges** - Create achievement badges

---

## API Examples

### Fetch Activities (GraphQL)

```graphql
query GetActivities {
  myActivities(page: 1, limit: 10) {
    id
    name
    distance
    type
    capturedAreasCount
  }
}
```

### Get Leaderboard

```graphql
query Leaderboard {
  leaderboard(limit: 10) {
    rank
    user {
      username
      firstname
      lastname
    }
    capturedCount
  }
}
```

---

## Contributing

This is an MVP for learning fullstack development. Feel free to extend it!

---

## License

MIT

---

**Happy Capturing! 🏃🗺️**
