# GetOut.space

A location-based game where you capture hexagonal territories on a map through your Strava running and cycling activities. Compete with friends to conquer more areas!

**Live:** https://getout.space
**API:** https://api.getout.space

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Quick Start (Local Development)](#quick-start-local-development)
- [Production Deployment](#production-deployment)
- [Strava Webhook Setup](#strava-webhook-setup)
- [Project Structure](#project-structure)
- [Common Commands](#common-commands)

---

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Apollo Client (GraphQL)
- Mapbox GL + Deck.gl (map visualization)
- Deployed on AWS S3 + CloudFront

### Backend
- Node.js + Express + TypeScript
- Apollo Server (GraphQL)
- MongoDB Atlas (geospatial database with H3 hexagon indexing)
- Strava OAuth + Webhooks
- Deployed on AWS ECS Fargate

### Infrastructure
- Terraform (Infrastructure as Code)
- GitHub Actions (CI/CD)
- AWS: ECS, ECR, ALB, S3, CloudFront, Route 53, ACM, Secrets Manager

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- MongoDB Atlas account (free tier)
- Strava API application

### 1. Clone and Install

```bash
cd getout.space

# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### 2. Set Up MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user
3. Whitelist your IP (or use `0.0.0.0/0` for development)
4. Copy your connection string

### 3. Set Up Strava API

1. Go to https://www.strava.com/settings/api
2. Create a new application:
   - **Website**: http://localhost:5173
   - **Authorization Callback Domain**: localhost
3. Save your **Client ID** and **Client Secret**

### 4. Configure Environment Variables

**Backend `.env`:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
NODE_ENV=development
PORT=4000

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=GetOutCluster

# Strava
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_WEBHOOK_VERIFY_TOKEN=any_random_string

# Security (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=generated_64_char_hex_string
ENCRYPTION_KEY=generated_64_char_hex_string

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
```

**Frontend `.env`:**
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_BACKEND_URL=http://localhost:4000
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Open:** http://localhost:5173

---

## Production Deployment

### Infrastructure Setup (One-Time)

#### 1. Install Tools

- [AWS CLI](https://aws.amazon.com/cli/)
- [Terraform](https://www.terraform.io/downloads)

#### 2. Configure AWS Credentials

```bash
aws configure
# Region: eu-north-1
```

#### 3. Generate Production Security Keys

```bash
cd backend
node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY:', require('crypto').randomBytes(32).toString('hex'))"
```

**Save these securely!**

#### 4. Configure Terraform Variables

```bash
cd infrastructure
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your:
- Domain name
- MongoDB URI
- Strava credentials
- JWT_SECRET and ENCRYPTION_KEY
- Slack webhook URL (optional)

#### 5. Deploy Infrastructure

```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

This creates:
- Frontend: S3 + CloudFront + SSL certificate
- Backend: ECS Fargate + ECR + ALB + SSL certificate
- Secrets Manager for environment variables
- Route 53 DNS records

**Takes ~20 minutes** (CloudFront + certificate validation)

#### 6. Configure GitHub Secrets

Go to: `Settings → Secrets and variables → Actions`

Add:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

#### 7. Push to Deploy

```bash
git push origin main
```

GitHub Actions automatically:
1. Builds frontend → Deploys to S3
2. Builds backend Docker image → Pushes to ECR → Updates ECS

**Deployment time:** ~3-5 minutes

---

## Strava Webhook Setup

Webhooks automatically process activities when created on Strava.

### Check Current Webhook

```bash
cd backend
node scripts/check-webhook.js
```

### Register Webhook (if needed)

```bash
# Update BACKEND_URL in .env to your production URL
node scripts/create-webhook.js
```

### Delete Webhook

```bash
node scripts/delete-webhook.js
```

### What Happens

1. User creates activity on Strava
2. Strava sends webhook to production backend
3. Backend fetches activity details
4. Converts GPS route to hexagons (H3 resolution 9, ~100m)
5. Updates hexagon ownership in MongoDB
6. Sends Slack notification (if configured)

---

## Project Structure

```
getout.space/
├── frontend/                    # React app
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── contexts/           # React contexts (auth, map)
│   │   ├── graphql/            # GraphQL queries/mutations
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API services
│   │   └── types/              # TypeScript types
│   └── Dockerfile
├── backend/                     # Node.js API
│   ├── src/
│   │   ├── models/             # MongoDB models
│   │   ├── routes/             # REST endpoints (webhook, auth)
│   │   ├── schema/             # GraphQL schema
│   │   ├── resolvers/          # GraphQL resolvers
│   │   ├── services/           # Business logic
│   │   └── utils/              # Helpers (JWT, encryption, hexagons)
│   ├── scripts/                # Utility scripts
│   └── Dockerfile
└── infrastructure/              # Terraform
    ├── main.tf                  # AWS resources
    ├── backend.tf               # ECS backend
    ├── variables.tf
    └── outputs.tf
```

---

## Common Commands

### Development

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run typecheck    # Type check

# Backend
npm run dev          # Start with nodemon
npm run build        # Compile TypeScript
npm run typecheck    # Type check
```

### Deployment

```bash
# Check infrastructure changes
cd infrastructure && terraform plan

# Apply infrastructure changes
terraform apply

# Force backend redeployment
aws ecs update-service --cluster getout-cluster --service getout-backend-service --force-new-deployment --region eu-north-1

# View backend logs
aws logs tail /ecs/getout-backend --follow --region eu-north-1

# Check webhook status
cd backend && node scripts/check-webhook.js
```

### Database

```bash
# Connect to MongoDB Atlas
mongo "your_connection_string"

# View hexagon data
db.hexagons.find({ currentOwnerStravaId: YOUR_STRAVA_ID }).count()

# Check activity processing
db.activities.find().sort({ startDate: -1 }).limit(5)
```

---

## Security

### Token Encryption

- Strava OAuth tokens encrypted at rest (AES-256-GCM)
- Unique IV per token
- Automatic encryption via Mongoose middleware

### Authentication

- JWT-based API authentication (7-day expiration)
- Role-based access control (admin/user)
- Fail-fast validation (app won't start without proper keys)

### Secrets Management

- **Development:** `.env` files (never committed)
- **Production:** AWS Secrets Manager + Terraform
- **GitHub Actions:** GitHub Secrets
- **Rotation:** Change keys → Update Secrets Manager → Redeploy ECS

### Key Requirements

```bash
# Generate production keys (different from dev!)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- `JWT_SECRET`: 64-char hex string
- `ENCRYPTION_KEY`: 64-char hex string

**Warning:** Changing `ENCRYPTION_KEY` requires all users to re-authenticate with Strava.

---

## How It Works

### Activity Processing

1. User completes activity on Strava
2. Webhook triggers backend
3. Backend fetches full activity data from Strava API
4. Decodes polyline to GPS coordinates
5. Converts coordinates to H3 hexagons (resolution 9)
6. For each hexagon:
   - If uncaptured → User captures it
   - If captured by someone else → Check timestamp
   - If newer activity → User steals it
   - Previous owner added to capture history
7. Update user's total captured count
8. Send Slack notification

### Geospatial Tech

- **H3 Hexagons:** Uber's hexagonal hierarchical geospatial indexing
- **Resolution 9:** ~100m hexagons (good balance for running routes)
- **MongoDB Geospatial:** 2dsphere indexes for location queries
- **Mapbox + Deck.gl:** Interactive map visualization

---

## Cost Estimate

**Monthly (production):**
- ECS Fargate: ~$15-25 (0.25 vCPU, 0.5 GB RAM)
- ALB: ~$16
- Route 53: $1
- S3 + CloudFront: ~$1-5
- MongoDB Atlas: Free (M0 tier)
- **Total: ~$35-50/month**

**Free tier benefits:**
- CloudFront: 1TB transfer/month (12 months)
- ECS Fargate: 20GB storage + compute hours

---

## Troubleshooting

### "Application cannot start without JWT_SECRET"

**Solution:** Generate keys and add to `.env` or Secrets Manager

### Activities Not Processing

**Solutions:**
- Check webhook is registered: `node scripts/check-webhook.js`
- Check backend logs for errors
- Verify Strava tokens haven't expired

### Frontend Not Connecting to Backend

**Solutions:**
- Check CORS settings in backend
- Verify `VITE_BACKEND_URL` in frontend `.env`
- Check backend health: `curl http://localhost:4000/health`

### Terraform Apply Fails

**Solutions:**
- Check AWS credentials: `aws sts get-caller-identity`
- Verify domain in Route 53
- Wait for certificate validation (can take 30 mins)

---

## License

MIT

---

**Happy conquering! 🏃🗺️**
