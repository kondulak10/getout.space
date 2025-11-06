# GetOut.space

A location-based territorial conquest game that turns your Strava running activities into hexagonal territories on a real-world map. Capture new territories or steal them from other players by running through their areas.

**Live:** https://getout.space
**API:** https://api.getout.space

---

## What It Does

When you complete a run on Strava, your GPS route is automatically converted into hexagonal territories. If someone else owns a hexagon you pass through, you can steal it with a newer activity. Compete to control more territory than other players.

### Game Mechanics

- Run anywhere and automatically capture hexagons (100m diameter)
- Only running activities allowed (Run, TrailRun, VirtualRun)
- Steal hexagons from other players by passing through them with newer activities
- View captured territories on an interactive map
- Track hexagon count and compete on leaderboards

---

## Tech Stack

### Backend
- Node.js 20 + TypeScript + Express
- Apollo Server 4 (GraphQL)
- MongoDB + Mongoose
- H3 hexagonal grid system (resolution 10, ~100m hexagons)
- Strava OAuth 2.0 + webhooks
- JWT authentication
- AES-256-GCM token encryption
- AWS deployment (ECS Fargate)

### Frontend
- React 19 + TypeScript
- Vite 7
- Apollo Client
- Mapbox GL JS
- Tailwind CSS 4
- H3-js for hexagon rendering
- AWS deployment (S3 + CloudFront)

### Infrastructure
- Terraform
- GitHub Actions CI/CD
- AWS: ECS, ECR, ALB, S3, CloudFront, Route 53, Secrets Manager

---

## Project Structure

```
getout.space/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Express + Apollo setup
│   │   ├── models/                # User, Activity, Hexagon
│   │   ├── graphql/
│   │   │   ├── schemas/           # GraphQL type definitions
│   │   │   └── resolvers/         # Query/mutation handlers
│   │   ├── routes/                # REST endpoints (OAuth, webhooks)
│   │   ├── services/              # Business logic (activity processing, Strava API)
│   │   ├── utils/                 # JWT, encryption, hexagons, image processing
│   │   └── middleware/            # Authentication
│   └── scripts/                   # Webhook management, migrations
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Route components
│   │   ├── components/            # UI components
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── contexts/              # AuthProvider
│   │   ├── graphql/               # GraphQL queries/mutations
│   │   └── utils/                 # Hexagon utilities, formatters
│   └── scripts/                   # Version generation
└── infrastructure/                # Terraform configs
```

---

## Local Development

### Prerequisites

- Node.js 20+
- MongoDB Atlas account
- Strava API application
- Mapbox access token

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```bash
NODE_ENV=development
PORT=4000

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/getout
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_WEBHOOK_VERIFY_TOKEN=random_string

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=64_char_hex_string
ENCRYPTION_KEY=64_char_hex_string

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
AWS_REGION=eu-north-1
```

Start backend:
```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```bash
VITE_API_URL=http://localhost:4000/graphql
VITE_BACKEND_URL=http://localhost:4000
VITE_MAPBOX_TOKEN=your_mapbox_token
```

Start frontend:
```bash
npm run dev
```

Open http://localhost:5173

### Strava API Setup

1. Go to https://www.strava.com/settings/api
2. Create application:
   - Website: http://localhost:5173
   - Authorization Callback Domain: localhost
3. Copy Client ID and Client Secret to backend `.env`

---

## How It Works

### Activity Processing Pipeline

1. **Webhook Event**: Strava sends notification when activity is created
2. **Data Fetch**: Backend fetches activity details using OAuth token (auto-refreshes if expired)
3. **Route Processing**:
   - Decode polyline to GPS coordinates
   - Convert each coordinate to H3 hexagon (resolution 10)
   - Detect route type:
     - **Closed loops** (start/end < 100m): Fill interior with `polygonToCells`
     - **Linear routes**: Use `gridPathCells` to fill gaps between GPS points
4. **Hexagon Capture**:
   - New hexagon: User captures it
   - Already owned by same user: Skip
   - Owned by another user: Compare timestamps, newer activity wins
5. **Database Update**: Batch operations (`insertMany`, `bulkWrite`) with MongoDB transactions
6. **Notifications**: Optional Slack notification, SSE updates to clients

### Hexagon System

- **H3 Grid**: Uber's hexagonal grid system
- **Resolution 10**: ~100m hexagon diameter
- **Parent Hexagons**: Resolution 6 (~22km) for efficient viewport queries
- **Capture History**: Full history of previous owners stored for analytics

### Map Rendering

- **Mapbox GL**: Base map tiles
- **GeoJSON Layer**: Custom hexagon rendering
- **View Modes**:
  - Only You: Shows only your hexagons
  - Battle Mode: Shows all players with color coding
- **Viewport Loading**: Only loads hexagons for visible area
- **Parent Queries**: Fetches 7 parent hexagons (center + ring) per viewport

---

## Database Schema

### Users
- Strava ID, display name, profile image URL
- Access/refresh tokens (encrypted with AES-256-GCM)
- Total captured hexagons count
- Role (user/admin)

### Activities
- Strava activity ID, user ID
- Name, type, distance, time
- Polyline, hexagons captured count
- Processed timestamp

### Hexagons
- Hexagon ID (H3 index), parent hexagon ID
- Current owner ID, Strava ID, display name, profile image (denormalized)
- Current activity ID, capture timestamp
- Capture history array (previous owners)

---

## API

### GraphQL (`/graphql`)

**Queries:**
- `me` - Current user profile
- `myActivities(limit, offset)` - User's activities
- `myHexagons(bbox)` - User's hexagons in viewport
- `hexagonsByParent(parentIds)` - Batch fetch by parent IDs
- `leaderboard(limit)` - Top users by hexagon count

**Mutations:**
- `updateProfile(displayName, profileImageUrl)` - Update profile
- `deleteActivity(activityId)` - Delete activity and restore hexagons

### REST

- `GET/POST /api/strava/webhook` - Webhook verification and events
- `GET /api/strava/authorize` - Initiate OAuth
- `GET /api/strava/callback` - OAuth callback
- `GET /api/strava/events` - Server-Sent Events stream
- `POST /api/strava/activities/:id/process` - Manual processing

---

## Production Deployment

### Infrastructure Setup

1. Install AWS CLI and Terraform
2. Configure AWS credentials (`aws configure`)
3. Generate security keys:
   ```bash
   cd backend
   node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('ENCRYPTION_KEY:', require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Configure Terraform:
   ```bash
   cd infrastructure
   cp terraform.tfvars.example terraform.tfvars
   # Edit with your domain, MongoDB URI, Strava creds, security keys
   ```
5. Deploy infrastructure:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```
   Creates: Frontend (S3 + CloudFront), Backend (ECS + ALB), DNS, SSL certificates (~20 min)

### CI/CD Setup

Add GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Push to main branch triggers automatic deployment:
- Frontend: Build → Deploy to S3 → Invalidate CloudFront (~2 min)
- Backend: Build Docker image → Push to ECR → Update ECS (~5 min)

### Webhook Setup

```bash
cd backend
node scripts/check-webhook.js    # Check current status
node scripts/create-webhook.js   # Register webhook
node scripts/delete-webhook.js   # Remove webhook
```

---

## Scripts

### Backend
- `npm run dev` - Start with nodemon
- `npm run build` - Compile TypeScript
- `npm run start` - Run compiled code
- `npm run lint` / `npm run format` - Code quality

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run codegen` - Generate GraphQL types
- `npm run generate:testdata` - Create mock hexagon data

### Utility Scripts
- `backend/scripts/generate-keys.js` - Generate encryption keys
- `backend/scripts/check-webhook.js` - Verify webhook status
- `backend/scripts/create-webhook.js` - Register webhook
- `backend/scripts/delete-webhook.js` - Remove webhook

---

## Security

### Authentication & Authorization
- JWT tokens (7-day expiration) with user ID and role
- Strava OAuth 2.0 (no passwords stored)
- GraphQL context-based authentication (`requireAuth()`, `requireAdmin()`)
- First registered user automatically becomes admin

### Token Encryption
- All Strava access/refresh tokens encrypted before database storage
- AES-256-GCM (authenticated encryption)
- Unique IV per encryption operation
- Mongoose pre-save hook encrypts, post-init/findOne hooks decrypt

### Security Measures
- Fail-fast validation (app exits if JWT_SECRET or ENCRYPTION_KEY missing)
- CORS whitelist (localhost + production domains only)
- HTTPS enforced via ALB redirect
- TLS 1.2+ only
- Webhook verification token
- IAM least privilege for ECS tasks
- ECR image scanning enabled

### Key Requirements
- `JWT_SECRET`: 64 hex chars (32 bytes)
- `ENCRYPTION_KEY`: 64 hex chars (32 bytes)
- Must be different values
- Production keys must differ from development
- Changing ENCRYPTION_KEY invalidates all stored tokens

---

## Performance Considerations

### Backend
- Batch database operations (`insertMany`, `bulkWrite`)
- MongoDB transactions for atomicity
- In-memory token refresh locks (prevents concurrent refreshes per user)
- Compound indexes on common query patterns

### Frontend
- Debounced map moves (300ms)
- Parent hexagon strategy reduces payload size
- Apollo Client normalized cache
- useCallback/useMemo to prevent re-renders

### Known Bottlenecks
- N+1 queries in hexagon resolvers (needs DataLoader)
- Bbox filtering in memory (needs 2dsphere index)
- Token refresh locks are per-process (needs distributed lock for scaling)

---

## Cost Estimate

Monthly production costs:
- ECS Fargate (0.25 vCPU, 0.5 GB): $15-25
- Application Load Balancer: $16
- Route 53: $1
- S3 + CloudFront: $1-5
- MongoDB Atlas M0: Free

**Total: ~$35-50/month**

---

## Troubleshooting

### "Application cannot start without JWT_SECRET"
Generate keys and add to `.env`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Activities not processing
- Check webhook: `node scripts/check-webhook.js`
- Check backend logs
- Verify Strava tokens haven't expired

### Frontend not connecting to backend
- Check `VITE_BACKEND_URL` in `.env`
- Verify CORS settings in backend
- Test backend health: `curl http://localhost:4000/health`

### Terraform apply fails
- Check AWS credentials: `aws sts get-caller-identity`
- Verify domain in Route 53
- Wait for certificate validation (up to 30 min)

---

## License

MIT
