# Deployment Guide for getout.space

This guide will help you deploy your React frontend to AWS with automatic deployments on every push to the main branch.

## Architecture

- **Frontend Hosting**: S3 + CloudFront (CDN)
- **Domain**: Route 53
- **SSL Certificate**: ACM (AWS Certificate Manager)
- **CI/CD**: GitHub Actions
- **Infrastructure**: Terraform
- **Region**: EU North 1 (Stockholm)

## Prerequisites

1. AWS Account
2. Domain name (will be registered via Route 53)
3. GitHub repository
4. Terraform installed locally
5. AWS CLI installed locally

---

## Step 1: Install Required Tools

### Install AWS CLI (Windows)

Download and install:
```
https://awscli.amazonaws.com/AWSCLIV2.msi
```

After installation, restart your terminal and verify:
```bash
aws --version
```

### Install Terraform (Windows)

Download from: https://www.terraform.io/downloads

Or use Chocolatey:
```bash
choco install terraform
```

Verify:
```bash
terraform --version
```

---

## Step 2: Set Up AWS Account

### 2.1 Create AWS Account
- Go to https://aws.amazon.com
- Click "Create an AWS Account"
- Follow the signup process (requires credit card)

### 2.2 Create IAM User for Deployment

1. Go to AWS Console → IAM → Users → "Create user"
2. User name: `github-deploy`
3. Select: "Provide user access to the AWS Management Console" - UNCHECK THIS
4. Click "Next"
5. Select "Attach policies directly"
6. Attach these policies:
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
   - `AWSCertificateManagerFullAccess`
   - `AmazonRoute53FullAccess`
7. Click "Next" → "Create user"
8. Click on the user name → "Security credentials" tab
9. Click "Create access key"
10. Select "Command Line Interface (CLI)"
11. Click "Next" → "Create access key"
12. **SAVE THESE CREDENTIALS** (you'll only see them once):
    - Access Key ID
    - Secret Access Key

### 2.3 Configure AWS CLI

Run:
```bash
aws configure
```

Enter:
- AWS Access Key ID: [paste your key]
- AWS Secret Access Key: [paste your secret]
- Default region name: `eu-north-1`
- Default output format: `json`

---

## Step 3: Register Domain on Route 53

1. Go to AWS Console → Route 53 → "Register domain"
2. Search for `getout.space` (or your preferred domain)
3. Add to cart and complete registration
4. This can take up to 3 days, but usually completes in a few hours

**Note**: You can also use an existing domain from another registrar, but you'll need to update the nameservers later.

---

## Step 4: Deploy Infrastructure with Terraform

### 4.1 Configure Terraform Variables

```bash
cd infrastructure
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set your domain:
```hcl
domain_name = "getout.space"  # Change to your actual domain
```

### 4.2 Initialize Terraform

```bash
terraform init
```

### 4.3 Review the Plan

```bash
terraform plan
```

This shows what resources will be created:
- S3 bucket for website hosting
- CloudFront distribution (CDN)
- ACM SSL certificate
- Route 53 hosted zone
- Route 53 DNS records

### 4.4 Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted.

**This will take 15-30 minutes** because:
- ACM certificate validation takes time
- CloudFront distribution creation is slow

### 4.5 Save Important Outputs

After completion, Terraform will output important values:
```
s3_bucket_name = "getout.space"
cloudfront_distribution_id = "E1XXXXXXXXXXXX"
website_url = "https://getout.space"
route53_nameservers = [...]
```

**SAVE the CloudFront Distribution ID** - you'll need it for GitHub secrets.

### 4.6 Update Domain Nameservers (if using external registrar)

If you registered the domain outside AWS, update the nameservers at your registrar to the values shown in `route53_nameservers`.

---

## Step 5: Set Up GitHub Repository

### 5.1 Initialize Git (if not already done)

```bash
git add .
git commit -m "Initial commit with deployment setup"
```

### 5.2 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `getout.space`
3. Make it private or public (your choice)
4. Click "Create repository"

### 5.3 Push Code to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/getout.space.git
git branch -M main
git push -u origin main
```

### 5.4 Configure GitHub Secrets

Go to your GitHub repository:
- Settings → Secrets and variables → Actions → "New repository secret"

Add these secrets:

1. **AWS_ACCESS_KEY_ID**
   - Value: Your AWS access key ID

2. **AWS_SECRET_ACCESS_KEY**
   - Value: Your AWS secret access key

3. **DOMAIN_NAME**
   - Value: `getout.space` (your domain)

4. **CLOUDFRONT_DISTRIBUTION_ID**
   - Value: The CloudFront distribution ID from Terraform output

---

## Step 6: Test Automatic Deployment

### 6.1 Make a Change

Edit `frontend/src/App.tsx`:
```tsx
<h1>Welcome to getout.space!</h1>
```

### 6.2 Commit and Push

```bash
git add .
git commit -m "Test deployment"
git push
```

### 6.3 Watch the Deployment

1. Go to GitHub → Actions tab
2. You should see the "Deploy to AWS" workflow running
3. Wait for it to complete (usually 2-3 minutes)

### 6.4 Visit Your Website

Open: https://getout.space

You should see your React app live!

---

## How It Works

### Automatic Deployment Pipeline

1. You push code to the `main` branch
2. GitHub Actions triggers automatically
3. Workflow builds your React app (`npm run build`)
4. Uploads build files to S3
5. Invalidates CloudFront cache
6. Your changes are live in 2-3 minutes!

### What Gets Deployed

- `frontend/dist/` → S3 bucket
- CloudFront serves cached content globally
- HTTPS enabled with free SSL certificate
- Custom domain with DNS managed by Route 53

---

## Troubleshooting

### Certificate Validation Pending

If Terraform hangs on certificate validation:
- Check Route 53 hosted zone for validation records
- Wait up to 30 minutes (DNS propagation)
- Certificate must be validated before CloudFront can use it

### CloudFront Distribution Creation Slow

CloudFront distributions take 15-30 minutes to create. This is normal.

### GitHub Actions Failing

Check:
1. All GitHub secrets are set correctly
2. AWS credentials have proper permissions
3. Domain name matches in all configurations

### Website Not Loading

1. Wait 24-48 hours for DNS propagation
2. Check CloudFront distribution status (must be "Deployed")
3. Verify S3 bucket has files
4. Check browser console for errors

---

## Cost Estimate

Monthly costs (approximate):

- **Route 53 Hosted Zone**: $0.50/month
- **Domain Registration**: ~$12/year
- **S3 Storage**: ~$0.023 per GB/month
- **CloudFront**: Free tier: 1TB/month for 12 months, then $0.085 per GB
- **ACM Certificate**: FREE

**Expected total**: ~$1-5/month (depending on traffic)

---

## Useful Commands

### View website logs
```bash
aws s3 ls s3://getout.space
```

### Manually invalidate CloudFront cache
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Check Terraform state
```bash
cd infrastructure
terraform show
```

### Destroy all infrastructure (careful!)
```bash
cd infrastructure
terraform destroy
```

---

## Next Steps

1. ✅ Set up backend (Node.js, Python, etc.)
2. ✅ Add custom 404 page
3. ✅ Set up monitoring (CloudWatch)
4. ✅ Add Google Analytics
5. ✅ Configure CDN caching rules
6. ✅ Set up staging environment

---

## Support

For issues:
- Check AWS CloudWatch logs
- Review GitHub Actions workflow logs
- Verify Terraform state

---

**Happy deploying! 🚀**
