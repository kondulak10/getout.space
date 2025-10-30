# Security Setup - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Generate Keys

```bash
cd backend
node scripts/generate-keys.js
```

Copy the output and save it securely.

---

### Step 2: Add to GitHub Secrets

Go to: https://github.com/YOUR_USERNAME/getout.space/settings/secrets/actions

Add these secrets:

| Secret Name | Description |
|-------------|-------------|
| `JWT_SECRET` | 64-char hex string from generator |
| `ENCRYPTION_KEY` | 64-char hex string from generator |
| `STRAVA_CLIENT_ID` | From Strava API dashboard |
| `STRAVA_CLIENT_SECRET` | From Strava API dashboard |
| `MONGODB_URI` | MongoDB connection string |

---

### Step 3: Add to AWS Secrets Manager

**Via AWS Console:**

1. Go to **AWS Secrets Manager** → `eu-north-1` region
2. Click **Store a new secret**
3. Choose **Other type of secret**
4. Add all key-value pairs (see Step 2 table)
5. Name: `getout-backend-secrets`
6. Click **Store**

**Via AWS CLI:**

```bash
aws secretsmanager create-secret \
  --name getout-backend-secrets \
  --secret-string '{
    "JWT_SECRET": "paste-your-jwt-secret",
    "ENCRYPTION_KEY": "paste-your-encryption-key",
    "STRAVA_CLIENT_ID": "paste-your-strava-id",
    "STRAVA_CLIENT_SECRET": "paste-your-strava-secret",
    "MONGODB_URI": "paste-your-mongodb-uri"
  }' \
  --region eu-north-1
```

---

### Step 4: Update ECS Task Definition

**Get Secret ARN:**

```bash
aws secretsmanager describe-secret \
  --secret-id getout-backend-secrets \
  --region eu-north-1 \
  --query ARN \
  --output text
```

**Update Task Definition:**

1. Go to **ECS** → **Task Definitions** → `getout-backend`
2. Create new revision
3. Container: `backend`
4. Environment variables → Change each secret to use `ValueFrom`:

```
JWT_SECRET → ValueFrom: arn:aws:secretsmanager:...:getout-backend-secrets:JWT_SECRET::
ENCRYPTION_KEY → ValueFrom: arn:aws:secretsmanager:...:getout-backend-secrets:ENCRYPTION_KEY::
(repeat for all secrets)
```

---

### Step 5: Grant IAM Permissions

**Find ECS Task Execution Role:**

```bash
aws iam list-roles --query 'Roles[?contains(RoleName, `ecsTaskExecution`)].RoleName'
```

**Add Inline Policy:**

```bash
aws iam put-role-policy \
  --role-name YOUR_ECS_TASK_EXECUTION_ROLE \
  --policy-name SecretsManagerReadAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": ["arn:aws:secretsmanager:eu-north-1:*:secret:getout-backend-secrets-*"]
    }]
  }'
```

---

### Step 6: Deploy

```bash
git add .
git commit -m "Configure production secrets"
git push origin main
```

GitHub Actions will automatically deploy with the new secrets.

---

## ✅ Verification

### Check ECS Logs

```bash
aws logs tail /ecs/getout-backend --follow
```

**You should NOT see:**
```
❌ CRITICAL: JWT_SECRET environment variable is not set!
```

**You SHOULD see:**
```
🚀 GetOut Backend
Health:   http://...
GraphQL:  http://...
```

### Test Authentication

1. Go to https://getout.space
2. Click "Login with Strava"
3. Authorize
4. Should see your profile ✅

---

## 🔒 Security Best Practices

✅ **Never commit** `.env` file
✅ **Different keys** for dev/prod
✅ **Rotate secrets** every 90 days
✅ **Monitor** CloudWatch logs
✅ **Use AWS Secrets Manager** (not plain text)

---

## 📚 Full Documentation

- **Security Implementation:** `backend/SECURITY.md`
- **Deployment Security:** `backend/DEPLOYMENT_SECURITY.md`
- **Key Generation:** `backend/scripts/generate-keys.js`

---

## 🆘 Troubleshooting

### "Application cannot start without JWT_SECRET"

- ✅ Secrets added to GitHub
- ✅ Secrets added to AWS Secrets Manager
- ✅ ECS Task Definition uses `secrets` (not `environment`)
- ✅ IAM role has Secrets Manager read permission

### "Failed to decrypt accessToken"

- User authenticated before encryption was enabled
- Solution: User must re-authenticate with Strava

### "All users logged out after deploy"

- JWT_SECRET was changed
- This is expected behavior
- Users must re-login

---

## 🚨 Emergency: Secrets Leaked

```bash
# 1. Generate new keys immediately
node scripts/generate-keys.js

# 2. Update AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id getout-backend-secrets \
  --secret-string '{"JWT_SECRET":"NEW_KEY","ENCRYPTION_KEY":"NEW_KEY",...}'

# 3. Force ECS redeployment
aws ecs update-service \
  --cluster getout-cluster \
  --service getout-backend-service \
  --force-new-deployment

# 4. Update GitHub Secrets
# Go to: https://github.com/YOUR_USERNAME/getout.space/settings/secrets/actions
```

**Consequences:**
- All users must re-login (JWT_SECRET changed)
- All users must re-authenticate with Strava (ENCRYPTION_KEY changed)

---

## 💡 Quick Commands Reference

```bash
# Generate keys
node backend/scripts/generate-keys.js

# Check GitHub Secrets
gh secret list

# List AWS Secrets
aws secretsmanager list-secrets --region eu-north-1

# View secret (masked)
aws secretsmanager get-secret-value --secret-id getout-backend-secrets

# Force ECS redeploy
aws ecs update-service --cluster getout-cluster --service getout-backend-service --force-new-deployment

# Check ECS logs
aws logs tail /ecs/getout-backend --follow

# Trigger GitHub Actions manually
gh workflow run deploy-backend.yml
```
