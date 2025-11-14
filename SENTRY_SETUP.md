# Sentry Setup Guide

This guide shows how to configure Sentry error tracking for GetOut.space.

## Overview

**What's Already Done:**
- ✅ Sentry code integrated in backend & frontend
- ✅ Terraform variables added
- ✅ GitHub Actions workflow updated
- ✅ All configuration points ready

**What You Need to Do:** Get Sentry DSNs and add them to your secrets (one-time, 10 minutes)

---

## Step 1: Create Sentry Account (2 minutes)

1. Go to https://sentry.io/signup/
2. Sign up (free tier: 5,000 events/month)
3. Choose organization name (e.g., "getout-space")

---

## Step 2: Create Backend Project (2 minutes)

1. Click **"Create Project"**
2. Select platform: **Node.js**
3. Project name: **getout-backend**
4. Click **"Create Project"**
5. **Copy the DSN** shown on the next screen
   - Looks like: `https://abc123@o456.ingest.sentry.io/789`
   - Save this, you'll need it in Step 4

---

## Step 3: Create Frontend Project (2 minutes)

1. Click **"Projects"** → **"Create Project"**
2. Select platform: **React**
3. Project name: **getout-frontend**
4. Click **"Create Project"**
5. **Copy the DSN**
   - Looks like: `https://xyz789@o456.ingest.sentry.io/321`
   - Save this for Step 5

---

## Step 4: Add Backend DSN to Terraform (3 minutes)

### Option A: Add to terraform.tfvars (if you have one)

Edit `infrastructure/terraform.tfvars`:
```hcl
sentry_dsn_backend = "https://abc123@o456.ingest.sentry.io/789"
```

### Option B: Set as environment variable

```bash
export TF_VAR_sentry_dsn_backend="https://abc123@o456.ingest.sentry.io/789"
```

### Deploy to AWS

```bash
cd infrastructure
terraform plan   # Verify changes
terraform apply  # Deploy

# This updates AWS Secrets Manager with the Sentry DSN
# ECS will automatically use it on next deployment
```

---

## Step 5: Add Frontend DSN to GitHub Secrets (2 minutes)

1. Go to your GitHub repo: `https://github.com/[your-username]/getout.space`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `SENTRY_DSN_FRONTEND`
5. Value: `https://xyz789@o456.ingest.sentry.io/321` (your frontend DSN)
6. Click **"Add secret"**

**Done!** Next frontend deployment will include Sentry.

---

## Step 6: Verify It Works

### Backend (After Terraform Apply)

1. Trigger a backend deployment (push to main or redeploy ECS)
2. Check ECS logs:
   ```bash
   aws logs tail /ecs/getout-backend --follow
   ```
3. Look for: `✅ Sentry initialized: https://abc123...`

### Frontend (After GitHub Deploy)

1. Push to main to trigger deployment
2. Visit https://getout.space
3. Open browser console
4. Look for: `✅ Sentry initialized`

### Test Error Tracking

**Create a test error:**
1. Visit https://api.getout.space/api/test/sentry (backend error)
2. Check Sentry dashboard: https://sentry.io/organizations/[your-org]/issues/
3. Should see error appear within 10 seconds!

---

## Step 7: Configure Alerts (Optional, 5 minutes)

### Email Alerts

1. Sentry → **Alerts** → **Create Alert Rule**
2. **When:** A new issue is created
3. **Then:** Send notification to → Email
4. **Environment:** Production
5. Click **"Save Rule"**

### Slack Integration

1. Sentry → **Settings** → **Integrations**
2. Find **Slack** → Click **"Add Integration"**
3. Authorize Slack workspace
4. Choose channel (e.g., `#alerts`)
5. Configure which projects to send to Slack

**You'll now get instant notifications when errors occur!**

---

## Local Development

### Backend `.env`
```bash
# Optional - add if you want Sentry in development
SENTRY_DSN_BACKEND=https://abc123@o456.ingest.sentry.io/789
```

By default, Sentry is **disabled in development** (NODE_ENV=development).

### Frontend `.env`
```bash
# Optional - add if you want Sentry in development
VITE_SENTRY_DSN_FRONTEND=https://xyz789@o456.ingest.sentry.io/321
```

By default, Sentry is **disabled in development** (import.meta.env.DEV).

---

## Monitoring Dashboard

### View Errors

**URL:** https://sentry.io/organizations/[your-org]/issues/

**What You'll See:**
- List of all errors
- Frequency graphs
- Affected users
- Stack traces
- Session replays (frontend)

### Performance Monitoring

**URL:** https://sentry.io/organizations/[your-org]/performance/

**What You'll See:**
- Slow API endpoints
- Slow database queries
- Frontend page load times
- Transaction traces

---

## Cost Management

### Free Tier Limits
- 5,000 errors/month
- 500 performance events/month
- 50 replays/month

### Tips to Stay Under Limit
1. ✅ Already filtered noisy errors in code (non-running activities, auth errors)
2. ✅ 10% sampling rate for performance (not every request tracked)
3. ✅ Session replay only on 10% of sessions, 100% of error sessions

**You should easily stay under free tier limits.**

---

## Troubleshooting

### "Sentry not initialized" in logs

**Backend:**
- Check Terraform applied successfully: `terraform output`
- Check ECS task environment variables: `aws ecs describe-task-definition --task-definition getout-backend`
- Verify DSN in Secrets Manager: `aws secretsmanager get-secret-value --secret-id getout-backend-env`

**Frontend:**
- Check GitHub secret exists: Repo → Settings → Secrets
- Check build logs for VITE_SENTRY_DSN_FRONTEND
- Check browser console for initialization message

### Errors not appearing in Sentry

1. Verify DSN is correct (copy from Sentry project settings)
2. Check if error is filtered (see `beforeSend` in config)
3. Check free tier quota not exceeded
4. Test with: `throw new Error('Test error')`

### Multiple Projects vs Single Project

**Current Setup: 2 Projects** (Recommended)
- Separate backend/frontend errors
- Easier to debug
- Separate alerts/rules

**Alternative: 1 Project** (Not Recommended)
- Use same DSN for both
- Mixed error types
- Harder to filter

---

## Summary

**Manual Steps Required:**
1. Create Sentry account (2 min)
2. Create 2 projects (4 min)
3. Copy DSNs (1 min)
4. Add to Terraform (1 min)
5. Add to GitHub (1 min)
6. Deploy (2 min)

**Total Time:** ~10 minutes

**Result:**
- ✅ Real-time error tracking
- ✅ Email/Slack alerts
- ✅ User context on all errors
- ✅ Session replay (see what users did)
- ✅ Performance monitoring

**Can You Terraform It?**
- ❌ Account/project creation: No (manual UI only)
- ✅ DSN storage: Yes (already done)
- ✅ Secret injection: Yes (already done)

**Worth the 10 minutes?** Absolutely! 🚀
