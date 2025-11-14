# Add Frontend Sentry DSN to GitHub Secrets

Your React Sentry DSN is already configured for local development.

To enable Sentry in production, add it to GitHub secrets:

## Steps (2 minutes):

1. **Go to your GitHub repo:** https://github.com/[your-username]/getout.space

2. **Click:** Settings → Secrets and variables → Actions

3. **Click:** "New repository secret"

4. **Add the secret:**
   - **Name:** `SENTRY_DSN_FRONTEND`
   - **Value:** `https://3f6cdf5919a6070b24730243c8f97193@o4510362816806912.ingest.de.sentry.io/4510362819362896`
   - **Click:** "Add secret"

5. **Done!** Next time you push to main, the frontend build will include Sentry.

## Verify It Worked

After your next deployment:

1. Visit https://getout.space
2. Open browser console (F12)
3. Look for: `✅ Sentry initialized`
4. Trigger a test error (throw new Error in console)
5. Check Sentry dashboard: https://sentry.io/organizations/[your-org]/issues/

You should see the error appear!

## Backend Sentry (When Ready)

When you get your backend DSN:

1. Add to `infrastructure/terraform.tfvars`:
   ```hcl
   sentry_dsn_backend = "https://[your-backend-dsn]"
   ```

2. Deploy:
   ```bash
   cd infrastructure
   terraform apply
   ```

3. Check ECS logs:
   ```bash
   aws logs tail /ecs/getout-backend --follow
   ```

4. Look for: `✅ Sentry initialized`
