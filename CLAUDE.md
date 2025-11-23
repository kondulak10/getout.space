# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GetOut.space is a location-based territorial conquest game that converts Strava running activities into hexagonal territories on a real-world map. Users capture hexagons by running through them, and can steal hexagons from other players with newer activities.

**Live:** https://getout.space
**API:** https://api.getout.space

## Commands

### Backend Development
```bash
cd backend
npm run dev              # Start backend with nodemon + ts-node
npm run build           # Compile TypeScript to dist/
npm run start           # Run compiled production build
npm run lint            # Check code quality
npm run lint:fix        # Fix linting issues
npm run format          # Format with Prettier
```

### Frontend Development
```bash
cd frontend
npm run dev             # Start Vite dev server (port 5173)
npm run build           # Production build (runs typecheck + vite build)
npm run typecheck       # Check TypeScript types without building
npm run codegen         # Generate TypeScript types from GraphQL schema
npm run lint            # Check code quality
npm run lint:fix        # Fix linting issues
npm run generate:testdata  # Generate mock hexagon GeoJSON data
```

### Webhook Management
```bash
cd backend
node scripts/check-webhook.js    # Check current webhook status
node scripts/create-webhook.js   # Register webhook with Strava
node scripts/delete-webhook.js   # Remove webhook
```

### Database Migrations
```bash
cd backend
node scripts/migrate-populate-last-previous-owner.js  # Populate lastPreviousOwnerId from captureHistory
```

### Infrastructure
```bash
cd infrastructure
terraform init
terraform plan          # Preview infrastructure changes
terraform apply         # Deploy to AWS
```

### Security Key Generation
```bash
# Generate JWT_SECRET and ENCRYPTION_KEY (must be 64 hex chars each)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Architecture

### Core Concepts

**H3 Hexagonal Grid System:**
- Resolution 10 hexagons (~100m diameter) for gameplay
- Resolution 6 parent hexagons (~22km) for efficient viewport queries
- Each resolution 10 hex stores its parent hex ID for fast lookups
- Viewport queries fetch 7 parent hexagons (center + ring) instead of bounding box

**Activity Processing Pipeline:**
1. Strava webhook → `POST /api/strava/webhook` (backend/src/routes/webhook.routes.ts)
2. Token validation/refresh → `getValidAccessToken()` (backend/src/services/strava.service.ts)
3. Fetch activity → `fetchStravaActivity()` validates it's a running activity (Run, TrailRun only)
4. Route analysis → `analyzeRouteAndConvertToHexagons()` (backend/src/utils/routeToHexagons.ts):
   - Closed loops (start/end < 500m): Fill interior with `polygonToCells`
   - Linear routes: Use `gridPathCells` to fill gaps between GPS points
5. Hexagon capture → `processActivity()` (backend/src/services/activityProcessing.service.ts):
   - MongoDB transaction for atomicity
   - Bulk operations for new hexagons and updates
   - Compare timestamps for hexagon ownership battles
   - Store capture history with previous owners
6. Notifications → SSE updates to connected clients + optional Slack

**Authentication Flow:**
- Strava OAuth 2.0 (no passwords stored)
- JWT tokens (7-day expiration) with user ID and role
- GraphQL context injects authenticated user from `Authorization: Bearer <token>` header
- Helper functions: `requireAuth()`, `requireAdmin()` in backend/src/graphql/resolvers/auth.helpers.ts

**Token Encryption:**
- All Strava access/refresh tokens encrypted with AES-256-GCM before database storage
- Mongoose hooks in User model: pre-save (encrypt) + post-init/findOne (decrypt)
- `ENCRYPTION_KEY` must be 64 hex chars (32 bytes), different from `JWT_SECRET`
- Changing `ENCRYPTION_KEY` invalidates all stored tokens

### Backend Structure

**Entry Point:** backend/src/server.ts
- Express app with Apollo Server 4 (GraphQL)
- CORS whitelist for localhost + production domains
- Routes: `/graphql`, `/api/strava/*`, `/api/strava/webhook`

**Models:** backend/src/models/
- **User:** Strava ID, encrypted tokens, profile, admin/premium flags, lastHex
- **Activity:** Strava activity data, polyline, hexagons captured
- **Hexagon:** Current owner (denormalized: ID, Strava ID, imghex), capture history array, parent hex ID
- **Notification:** User notifications with type/metadata

**GraphQL:** backend/src/graphql/
- Schemas: Type definitions in schemas/*.graphql
- Resolvers: Query/mutation handlers in resolvers/*.ts
- Key queries: `me`, `myActivities`, `hexagonsByParent(parentIds)`, `versusStats(userId1, userId2)`
- Key mutations: `updateProfile`, `deleteActivity`
- Plugins: Rate limiting for query complexity protection (backend/src/graphql/plugins/)

**Middleware:** backend/src/middleware/
- **rateLimiter.ts:** Global and GraphQL-specific rate limiting

**Services:** backend/src/services/
- **strava.service.ts:** Token refresh, activity fetching, validation
- **activityProcessing.service.ts:** Main processing logic with MongoDB transactions
- **notification.service.ts:** SSE connection management

**Utils:** backend/src/utils/
- **routeToHexagons.ts:** Route analysis and H3 conversion logic
- **encryption.ts:** AES-256-GCM encrypt/decrypt for tokens
- **jwt.ts:** JWT sign/verify
- **s3Upload.ts:** Profile image upload to S3
- **strava.ts:** Strava API token refresh

### Frontend Structure

**Entry Point:** frontend/src/main.tsx → frontend/src/App.tsx
- React Router v7 with routes
- Apollo Client with authentication headers
- AuthProvider context wraps entire app

**Pages:** frontend/src/pages/
- **HomePage:** Main map interface (requires auth)
- **ProfilePage:** User profile and activity list
- **AdminPage:** Admin dashboard for managing users/activities
- **LandingPage:** Public homepage for unauthenticated users

**Map Architecture:**
- **MapProvider** (frontend/src/contexts/MapProvider.tsx): Stores mapbox-gl Map instance in context
- **MapView** (frontend/src/components/MapView.tsx): Initializes Mapbox, creates GeoJSON sources/layers
- **MapContent** (frontend/src/components/MapContent.tsx): Handles viewport changes, GraphQL queries, GeoJSON updates
- **useMapbox** (frontend/src/hooks/useMapbox.ts): Custom hook for Mapbox initialization

**Map Rendering Flow:**
1. `useMapbox` creates Mapbox GL instance
2. `MapView` adds GeoJSON sources (`hexagons`, `parent-hexagons`) and layers
3. `MapContent` watches viewport changes (debounced 300ms)
4. Calculate visible parent hexagons (7 parent hexes = center + ring)
5. Query `hexagonsByParent` with parent IDs
6. Update GeoJSON sources with returned hexagons
7. Layer styles apply colors based on view mode (Only You vs Battle Mode)

**Components:** frontend/src/components/
- **HexagonDetailModal:** Shows hexagon info + user leaderboard for that hex
- **ActivityFeed:** Real-time SSE updates from backend
- **UserAvatar:** Profile images with hex patterns
- **Navbar:** Navigation with user menu

**GraphQL:** frontend/src/graphql/
- **queries/:** Apollo queries (useQuery hooks)
- **mutations/:** Apollo mutations (useMutation hooks)
- **schema.ts:** Generated TypeScript types from codegen

**Styling Standards:**
- **USE TAILWIND CSS** for all component styling
- **DO NOT create CSS modules** (*.module.css files) - use Tailwind utility classes directly in JSX
- Use Tailwind's arbitrary values `[property:value]` for custom styles (e.g., `[text-shadow:0_2px_4px_rgba(0,0,0,0.8)]`)
- Use inline `style` prop only for dynamic values that can't be expressed in Tailwind classes
- Leverage Tailwind's responsive prefixes (`md:`, `lg:`) for mobile-first design
- Use `tailwind-merge` (via `clsx` or `cn` helper) when combining conditional classes
- Reference tailwind.config.js for custom theme colors, animations, and design tokens

### Database Schema Details

**Hexagon Document Fields:**
- `hexagonId`: H3 index string (unique)
- `parentHexagonId`: Resolution 6 parent hex (indexed)
- `currentOwnerId`, `currentOwnerStravaId`, `currentOwnerImghex`: Denormalized for fast queries
- `currentActivityId`, `currentStravaActivityId`: Which activity captured it
- `firstCapturedAt`, `firstCapturedBy`: Original capture data
- `lastCapturedAt`: Timestamp for ownership battles (newer wins)
- `lastPreviousOwnerId`: Immediate previous owner (denormalized from captureHistory, indexed for performance)
- `captureCount`: Total times this hex has been captured
- `captureHistory[]`: Array of previous owners with timestamps (excluded from profile queries for performance)
- `routeType`: 'line' or 'area' (closed loop)

**Important Indexes:**
- `hexagonId`: Unique index
- `parentHexagonId`: For viewport queries
- `currentOwnerId`: For user's hexagon queries
- `currentOwnerId + lastCapturedAt`: Compound for sorted queries
- `lastPreviousOwnerId`: For efficient "stolen from" queries (100x faster than aggregations)

### Environment Variables

**Backend (.env):**
```bash
NODE_ENV=development|production
PORT=4000
MONGODB_URI=mongodb+srv://...
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=
JWT_SECRET=64_hex_chars
ENCRYPTION_KEY=64_hex_chars  # MUST differ from JWT_SECRET
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=  # For S3 uploads
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=getout-profile-images
SLACK_WEBHOOK_URL=  # Optional
SENTRY_DSN_BACKEND=  # Optional - Sentry error tracking DSN for backend
AMPLITUDE_API_KEY=  # Optional - Amplitude analytics for backend event tracking
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:4000/graphql
VITE_BACKEND_URL=http://localhost:4000
VITE_MAPBOX_TOKEN=pk....
VITE_SENTRY_DSN_FRONTEND=  # Optional - Sentry error tracking DSN for frontend
VITE_AMPLITUDE_API_KEY=  # Optional - Amplitude analytics for frontend event tracking
```

## Development Workflow

### When Making Changes to GraphQL Schema:

1. Update schema in `backend/src/graphql/schemas/*.graphql`
2. Update resolvers in `backend/src/graphql/resolvers/*.ts`
3. Restart backend to load new schema
4. Run `npm run codegen` in frontend to regenerate types
5. Update frontend queries/mutations to use new types

### When Adding New Hexagon Fields:

1. Update `IHexagon` interface in backend/src/models/Hexagon.ts
2. Update Mongoose schema in same file (add index if needed for queries)
3. Consider adding to hexagon processing logic in backend/src/services/activityProcessing.service.ts
4. Update GraphQL schema in backend/src/graphql/schemas/hexagon.graphql
5. Update resolver in backend/src/graphql/resolvers/hexagon.resolvers.ts
6. Create migration script if needed to populate existing data
7. Run codegen in frontend and update UI components

**Example:** The `lastPreviousOwnerId` field was added with:
- Optional field in model (backward compatible)
- Indexed for fast queries
- Population logic in activityProcessing.service.ts (line 343)
- Migration script to populate historical data
- New `versusStats` query utilizing the indexed field

### When Debugging Activity Processing:

1. Check backend console logs (emoji indicators: 🎯 🎬 📍 ✅ ❌)
2. Use `POST /api/strava/activities/:id/process` endpoint to manually process activity
3. Check MongoDB directly for hexagon documents
4. Verify Strava token hasn't expired: `getValidAccessToken()` auto-refreshes
5. Use `node scripts/check-webhook.js` to verify webhook subscription

### When Adding or Modifying UI Components:

1. **Always use Tailwind CSS utility classes** - never create CSS modules
2. Use Tailwind's arbitrary values for custom properties: `className="[text-shadow:0_2px_4px_rgba(0,0,0,0.8)]"`
3. For responsive design, use Tailwind's breakpoint prefixes: `md:text-lg`, `lg:gap-4`
4. For conditional classes, use template literals: `` className={`base-class ${condition ? 'true-class' : 'false-class'}`} ``
5. Only use inline `style` prop for dynamic values (colors from API, calculated positions, etc.)
6. Check tailwind.config.js for available custom colors, animations, and theme values

### Testing Locally with Strava Webhooks:

1. Use ngrok or similar to expose localhost:4000
2. Update `BACKEND_URL` to public URL
3. Run `node scripts/create-webhook.js`
4. Complete an activity on Strava
5. Watch backend logs for webhook event

## Recent Performance Optimizations

**Profile Page Optimization (75% data reduction):**
- Added `lastPreviousOwnerId` indexed field to Hexagon model for O(1) "stolen from" queries
- Removed `captureHistory` from profile queries (was transferring 200KB → now 50KB)
- Server-side `versusStats` calculation (1000x faster than client-side array operations)
- Migration script to populate historical data: `scripts/migrate-populate-last-previous-owner.js`

**Security & Monitoring:**
- Sentry error tracking (backend + frontend) with user context and breadcrumbs
- Rate limiting middleware (global 100 req/15min + GraphQL-specific 50 req/15min)
- GraphQL query complexity plugin to prevent abuse

## Known Limitations & Technical Debt

**Performance Bottlenecks:**
- No DataLoader for hexagon resolvers (N+1 queries when loading user data)
- Bbox filtering happens in-memory after DB query (needs 2dsphere geospatial index)
- Token refresh locks are in-memory per process (distributed locks needed for horizontal scaling)

**Frontend Limitations:**
- Parent hexagon strategy trades accuracy for performance (some edge hexagons may not load)
- No pagination on activities list (loads all at once)

**Security Considerations:**
- First registered user auto-becomes admin (consider adding admin approval flow)
- SSE connections don't authenticate per-message

## Deployment

**CI/CD:** GitHub Actions on push to main
- Backend: Build Docker → Push to ECR → Update ECS service (~5 min)
- Frontend: Build Vite → Deploy to S3 → Invalidate CloudFront (~2 min)

**Infrastructure:** Terraform manages:
- Frontend: S3 bucket + CloudFront distribution
- Backend: ECS Fargate + Application Load Balancer + ECR
- DNS: Route 53 records + ACM certificates
- Secrets: AWS Secrets Manager for env vars

**Manual Deployment:**
```bash
cd infrastructure
terraform apply
# Wait for DNS propagation and certificate validation (~30 min first time)
cd ../backend
node scripts/create-webhook.js  # Register webhook with production URL
```

## Troubleshooting

**"Application cannot start without JWT_SECRET":**
- Generate keys with crypto and add to .env (must be 64 hex chars)

**Activities not processing:**
- Check webhook status: `node scripts/check-webhook.js`
- Verify tokens haven't expired (auto-refreshes but logs show attempts)
- Check backend logs for errors during processing

**Map not loading hexagons:**
- Check browser console for GraphQL errors
- Verify user has completed at least one activity
- Check that `lastHex` is set on user document

**Hexagons appearing in wrong location:**
- H3 uses [lat, lng] but GeoJSON uses [lng, lat] - verify conversion
- Check that polyline decoding returns correct coordinate order

**Token encryption errors:**
- Verify ENCRYPTION_KEY is 64 hex chars and matches production
- If key changed, all users need to re-authenticate via Strava OAuth
