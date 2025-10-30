# Terraform Deployment Guide - Security Keys

## ✅ What's Already Done

Your Terraform is already configured to:
- ✅ Use AWS Secrets Manager for all secrets
- ✅ Inject secrets into ECS containers at runtime
- ✅ Grant IAM permissions for Secrets Manager access
- ✅ Pull JWT_SECRET from variables

I just added:
- ✅ `ENCRYPTION_KEY` variable
- ✅ `ENCRYPTION_KEY` to Secrets Manager
- ✅ `ENCRYPTION_KEY` to ECS Task Definition

---

## 🚀 Deployment Steps

### Step 1: Generate Keys

```bash
cd ../backend
node scripts/generate-keys.js
```

Save the output:
- `JWT_SECRET`: (64-char hex string)
- `ENCRYPTION_KEY`: (64-char hex string)

---

### Step 2: Set Terraform Variables

Create or update `infrastructure/terraform.tfvars`:

```hcl
# Domain
domain_name = "getout.space"

# AWS
aws_region = "eu-north-1"

# Database
mongodb_uri = "mongodb+srv://username:password@cluster.mongodb.net/getout"

# Strava
strava_client_id              = "your-strava-client-id"
strava_client_secret          = "your-strava-client-secret"
strava_webhook_verify_token   = "your-webhook-token"

# Security Keys (IMPORTANT: Use keys from Step 1)
jwt_secret      = "paste-generated-jwt-secret-here"
encryption_key  = "paste-generated-encryption-key-here"
```

**⚠️ Important:** Add `terraform.tfvars` to `.gitignore` (should already be there)

---

### Step 3: Initialize and Plan

```bash
cd infrastructure

# Initialize Terraform (if not already done)
terraform init

# Preview changes
terraform plan
```

You should see changes to:
- `aws_secretsmanager_secret_version.backend_env` (will be updated)
- `aws_ecs_task_definition.backend` (new revision)

---

### Step 4: Apply Changes

```bash
terraform apply
```

Type `yes` when prompted.

---

### Step 5: Force ECS Service Update

The ECS service needs to pick up the new task definition:

```bash
aws ecs update-service \
  --cluster getout-cluster \
  --service getout-backend-service \
  --force-new-deployment \
  --region eu-north-1
```

Or wait for GitHub Actions to deploy (next push to main).

---

## 🔍 Verify Deployment

### Check Secrets Manager

```bash
aws secretsmanager get-secret-value \
  --secret-id getout-backend-env \
  --region eu-north-1 \
  --query SecretString \
  --output text | jq .
```

You should see `JWT_SECRET` and `ENCRYPTION_KEY` in the output.

---

### Check ECS Task Definition

```bash
aws ecs describe-task-definition \
  --task-definition getout-backend \
  --region eu-north-1 \
  --query 'taskDefinition.containerDefinitions[0].secrets' \
  --output table
```

You should see entries for `JWT_SECRET` and `ENCRYPTION_KEY`.

---

### Check ECS Logs

```bash
aws logs tail /ecs/getout-backend --follow --region eu-north-1
```

**You should NOT see:**
```
❌ CRITICAL: JWT_SECRET environment variable is not set!
❌ CRITICAL: ENCRYPTION_KEY environment variable is not set!
```

**You SHOULD see:**
```
🚀 GetOut Backend
Health:   http://...
GraphQL:  http://...
```

---

## 📊 Current Architecture

```
GitHub Push
    ↓
GitHub Actions
    ├── Builds Docker image
    ├── Pushes to ECR
    └── Updates ECS service
            ↓
ECS Task starts
    ├── Pulls image from ECR
    ├── Reads secrets from Secrets Manager
    │   └── JWT_SECRET, ENCRYPTION_KEY, etc.
    └── Injects as environment variables
            ↓
Backend starts
    ├── Validates JWT_SECRET (exits if missing)
    ├── Validates ENCRYPTION_KEY (exits if missing)
    └── Starts server ✅
```

---

## 🔒 Security Benefits

✅ **Secrets in Secrets Manager** - Encrypted by AWS KMS
✅ **Never in GitHub** - Not committed to repository
✅ **Never in Docker image** - Not baked into container
✅ **Never in task definition JSON** - Referenced by ARN only
✅ **IAM-controlled access** - Only ECS tasks can read
✅ **Audit trail** - CloudTrail logs all secret access
✅ **Easy rotation** - Update Terraform, apply, redeploy

---

## 🔄 Rotating Secrets

### When to Rotate

- Every 90 days (compliance)
- Suspected compromise
- Team member with access leaves

### How to Rotate

1. **Generate new keys:**
   ```bash
   node ../backend/scripts/generate-keys.js
   ```

2. **Update `terraform.tfvars`:**
   ```hcl
   jwt_secret     = "new-jwt-secret"
   encryption_key = "new-encryption-key"
   ```

3. **Apply:**
   ```bash
   terraform apply
   ```

4. **Force ECS redeployment:**
   ```bash
   aws ecs update-service \
     --cluster getout-cluster \
     --service getout-backend-service \
     --force-new-deployment
   ```

5. **Consequences:**
   - All users must re-login (JWT_SECRET changed)
   - All users must re-authenticate with Strava (ENCRYPTION_KEY changed)

---

## 🆘 Troubleshooting

### "Application cannot start without JWT_SECRET"

**Check Secrets Manager has the key:**
```bash
aws secretsmanager get-secret-value --secret-id getout-backend-env
```

**Check Task Definition references it:**
```bash
aws ecs describe-task-definition --task-definition getout-backend \
  | jq '.taskDefinition.containerDefinitions[0].secrets'
```

**Check IAM permissions:**
```bash
aws iam get-role-policy \
  --role-name getout-ecs-task-execution-role \
  --policy-name getout-ecs-secrets-policy
```

---

### "Terraform validation failed"

**Missing variables:**
```bash
# Check what variables are required
terraform validate
```

**Sensitive variables not set:**
- Make sure `terraform.tfvars` exists
- Make sure all secrets are filled in
- Never commit `terraform.tfvars` to git

---

### "Service won't update to new task definition"

**Force update:**
```bash
aws ecs update-service \
  --cluster getout-cluster \
  --service getout-backend-service \
  --task-definition getout-backend \
  --force-new-deployment
```

**Or stop running tasks:**
```bash
# List tasks
aws ecs list-tasks \
  --cluster getout-cluster \
  --service-name getout-backend-service

# Stop task (it will restart with new definition)
aws ecs stop-task \
  --cluster getout-cluster \
  --task <task-arn>
```

---

## 📝 Terraform State

**Important:** Your Terraform state may contain sensitive values!

If using local state:
```bash
# Add to .gitignore (should already be there)
echo "terraform.tfstate*" >> .gitignore
echo "*.tfvars" >> .gitignore
```

If using remote state (S3):
- ✅ State is encrypted at rest in S3
- ✅ Sensitive values marked with `sensitive = true`
- ✅ Won't appear in `terraform plan` output

---

## 🎯 Summary

**You don't need to manually configure ECS** - Terraform does it all!

Just:
1. Generate keys
2. Update `terraform.tfvars`
3. Run `terraform apply`
4. Let GitHub Actions deploy (or force update)

Everything else is automated! 🎉
