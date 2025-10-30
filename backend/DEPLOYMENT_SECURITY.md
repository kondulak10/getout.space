# Deployment Security Configuration

## 🔐 Overview

This guide explains how to securely configure `JWT_SECRET` and `ENCRYPTION_KEY` for production deployment on AWS ECS.

---

## 📋 Quick Setup Checklist

- [ ] Generate production keys (different from development)
- [ ] Add secrets to GitHub repository
- [ ] Store secrets in AWS Secrets Manager
- [ ] Update ECS Task Definition to use secrets
- [ ] Redeploy backend
- [ ] Verify secrets are loaded correctly

---

## Step 1: Generate Production Keys

**⚠️ IMPORTANT:** Use different keys for production than development!

```bash
cd backend
node scripts/generate-keys.js
```

Save the output somewhere secure (password manager, secure notes, etc.)

---

## Step 2: Add Secrets to GitHub

### Option A: Via GitHub Website (Recommended)

1. Go to your repository: `https://github.com/YOUR_USERNAME/getout.space`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets one by one:

| Name | Value |
|------|-------|
| `JWT_SECRET` | Your generated 64-char hex string |
| `ENCRYPTION_KEY` | Your generated 64-char hex string |
| `STRAVA_CLIENT_ID` | From Strava API application |
| `STRAVA_CLIENT_SECRET` | From Strava API application |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` | Random string for webhook verification |
| `MONGODB_URI` | Your MongoDB connection string |

### Option B: Via GitHub CLI

```bash
# Install GitHub CLI: https://cli.github.com/

# Login
gh auth login

# Add secrets
gh secret set JWT_SECRET
# Paste your JWT_SECRET and press Enter

gh secret set ENCRYPTION_KEY
# Paste your ENCRYPTION_KEY and press Enter
```

---

## Step 3: Store Secrets in AWS Secrets Manager

### Why AWS Secrets Manager?

- ✅ Encrypted at rest
- ✅ Automatic rotation capability
- ✅ Audit logging
- ✅ Fine-grained access control
- ✅ No secrets in task definition JSON

### Create Secrets in AWS Console

1. Go to **AWS Secrets Manager** in `eu-north-1` region
2. Click **Store a new secret**
3. Choose **Other type of secret**
4. Add key/value pairs:

```json
{
  "JWT_SECRET": "your-jwt-secret-here",
  "ENCRYPTION_KEY": "your-encryption-key-here",
  "STRAVA_CLIENT_ID": "your-strava-client-id",
  "STRAVA_CLIENT_SECRET": "your-strava-client-secret",
  "STRAVA_WEBHOOK_VERIFY_TOKEN": "your-webhook-token",
  "MONGODB_URI": "your-mongodb-connection-string"
}
```

5. Name the secret: `getout-backend-secrets`
6. Click **Next** → **Next** → **Store**

### Create Secrets via AWS CLI

```bash
# Set your AWS region
export AWS_REGION=eu-north-1

# Create the secret
aws secretsmanager create-secret \
  --name getout-backend-secrets \
  --description "Environment secrets for GetOut backend" \
  --secret-string '{
    "JWT_SECRET": "YOUR_JWT_SECRET_HERE",
    "ENCRYPTION_KEY": "YOUR_ENCRYPTION_KEY_HERE",
    "STRAVA_CLIENT_ID": "YOUR_STRAVA_CLIENT_ID",
    "STRAVA_CLIENT_SECRET": "YOUR_STRAVA_CLIENT_SECRET",
    "STRAVA_WEBHOOK_VERIFY_TOKEN": "YOUR_WEBHOOK_TOKEN",
    "MONGODB_URI": "YOUR_MONGODB_URI"
  }' \
  --region $AWS_REGION
```

---

## Step 4: Update ECS Task Definition

### Option A: AWS Console

1. Go to **ECS** → **Task Definitions**
2. Select `getout-backend` → **Create new revision**
3. Click on the **backend** container
4. Scroll to **Environment variables**
5. For each secret, change from "Value" to "ValueFrom":

```
Name: JWT_SECRET
ValueFrom: arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:getout-backend-secrets:JWT_SECRET::

Name: ENCRYPTION_KEY
ValueFrom: arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:getout-backend-secrets:ENCRYPTION_KEY::

Name: STRAVA_CLIENT_ID
ValueFrom: arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:getout-backend-secrets:STRAVA_CLIENT_ID::

Name: STRAVA_CLIENT_SECRET
ValueFrom: arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:getout-backend-secrets:STRAVA_CLIENT_SECRET::

Name: STRAVA_WEBHOOK_VERIFY_TOKEN
ValueFrom: arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:getout-backend-secrets:STRAVA_WEBHOOK_VERIFY_TOKEN::

Name: MONGODB_URI
ValueFrom: arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:getout-backend-secrets:MONGODB_URI::
```

6. Click **Create**

### Option B: Update via CLI

First, get your secret ARN:

```bash
aws secretsmanager describe-secret \
  --secret-id getout-backend-secrets \
  --region eu-north-1 \
  --query ARN \
  --output text
```

Then update the task definition (see terraform example in Step 5).

---

## Step 5: Grant ECS Task Permission to Access Secrets

Your ECS Task Execution Role needs permission to read from Secrets Manager.

### Add IAM Policy

1. Go to **IAM** → **Roles**
2. Find your ECS task execution role (e.g., `ecsTaskExecutionRole`)
3. Click **Add permissions** → **Create inline policy**
4. Add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:eu-north-1:YOUR_ACCOUNT_ID:secret:getout-backend-secrets-*"
      ]
    }
  ]
}
```

5. Name it: `SecretsManagerReadAccess`
6. Click **Create policy**

---

## Step 6: Update Terraform (If Using Infrastructure as Code)

If you're using Terraform to manage your infrastructure, update your task definition:

```hcl
resource "aws_ecs_task_definition" "backend" {
  family = "getout-backend"

  container_definitions = jsonencode([{
    name  = "backend"
    image = "YOUR_ECR_URI:latest"

    secrets = [
      {
        name      = "JWT_SECRET"
        valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:JWT_SECRET::"
      },
      {
        name      = "ENCRYPTION_KEY"
        valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:ENCRYPTION_KEY::"
      },
      {
        name      = "STRAVA_CLIENT_ID"
        valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:STRAVA_CLIENT_ID::"
      },
      {
        name      = "STRAVA_CLIENT_SECRET"
        valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:STRAVA_CLIENT_SECRET::"
      },
      {
        name      = "MONGODB_URI"
        valueFrom = "${aws_secretsmanager_secret.backend_secrets.arn}:MONGODB_URI::"
      }
    ]

    environment = [
      {
        name  = "NODE_ENV"
        value = "production"
      },
      {
        name  = "PORT"
        value = "4000"
      },
      {
        name  = "FRONTEND_URL"
        value = "https://getout.space"
      },
      {
        name  = "BACKEND_URL"
        value = "https://api.getout.space"
      }
    ]
  }])

  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
}

resource "aws_secretsmanager_secret" "backend_secrets" {
  name        = "getout-backend-secrets"
  description = "Secrets for GetOut backend"
}
```

---

## Step 7: Deploy and Verify

### Trigger Deployment

Push a commit to trigger GitHub Actions:

```bash
git add .
git commit -m "Add security configuration"
git push origin main
```

Or manually trigger:
```bash
gh workflow run deploy-backend.yml
```

### Verify Secrets Are Loaded

1. Check ECS logs in CloudWatch
2. Look for startup messages (not errors about missing secrets)
3. Test authentication flow

### Verify in Container

SSH into a running container (if you have access):

```bash
# Get task ID
aws ecs list-tasks --cluster getout-cluster --service-name getout-backend-service

# Describe task to get container details
aws ecs describe-tasks --cluster getout-cluster --tasks TASK_ID

# Check logs
aws logs tail /ecs/getout-backend --follow
```

You should NOT see:
```
❌ CRITICAL: JWT_SECRET environment variable is not set!
```

---

## 🔄 Rotating Secrets

### When to Rotate

- Suspected compromise
- Regular security practice (every 90 days)
- Team member with access leaves
- Compliance requirements

### How to Rotate

1. **Generate new keys:**
   ```bash
   node scripts/generate-keys.js
   ```

2. **Update AWS Secrets Manager:**
   ```bash
   aws secretsmanager update-secret \
     --secret-id getout-backend-secrets \
     --secret-string '{
       "JWT_SECRET": "NEW_JWT_SECRET",
       "ENCRYPTION_KEY": "NEW_ENCRYPTION_KEY",
       ...
     }'
   ```

3. **Redeploy ECS service:**
   ```bash
   aws ecs update-service \
     --cluster getout-cluster \
     --service getout-backend-service \
     --force-new-deployment
   ```

4. **Consequences:**
   - ⚠️ **JWT_SECRET change:** All users must re-login
   - ⚠️ **ENCRYPTION_KEY change:** All users must re-authenticate with Strava (tokens can't be decrypted)

---

## 🚨 Security Incident Response

### If Secrets Are Leaked

1. **Immediately rotate all secrets**
2. **Force ECS service redeployment**
3. **Monitor access logs for suspicious activity**
4. **Notify users if data may be compromised**
5. **Review security practices and fix root cause**

### Emergency Contact

- AWS Support: https://console.aws.amazon.com/support/
- Revoke GitHub token: https://github.com/settings/tokens
- MongoDB Atlas support: https://cloud.mongodb.com/

---

## 📊 Security Checklist

Production deployment:

- [ ] Different keys for dev/prod
- [ ] Secrets in AWS Secrets Manager (not plain text in task definition)
- [ ] GitHub Secrets configured
- [ ] IAM role has SecretsManager read permission
- [ ] Secrets never logged or exposed
- [ ] Regular rotation schedule (90 days)
- [ ] Monitoring and alerting enabled
- [ ] Backup of secret ARNs stored securely
- [ ] Team trained on secret handling
- [ ] Incident response plan documented

---

## 🔗 Useful Links

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [ECS Secrets Configuration](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data-secrets.html)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP Secret Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
