# getout.space

Modern web application with React frontend deployed on AWS.

## Project Structure

```
getout.space/
├── frontend/              # React + TypeScript (Vite)
├── backend/               # Backend API (to be implemented)
├── infrastructure/        # Terraform AWS infrastructure
├── .github/workflows/     # GitHub Actions CI/CD
└── DEPLOYMENT.md         # Detailed deployment guide
```

## Quick Start

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:5173

### Build Frontend

```bash
cd frontend
npm run build
```

## Deployment

The application automatically deploys to AWS when you push to the `main` branch.

**Live URL**: https://getout.space

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- ESLint

### Infrastructure

- AWS S3 (Static hosting)
- AWS CloudFront (CDN)
- AWS Route 53 (DNS)
- AWS ACM (SSL certificates)
- Terraform (Infrastructure as Code)
- GitHub Actions (CI/CD)

### Region

- Primary: EU North 1 (Stockholm)
- SSL Certificate: US East 1 (required for CloudFront)

## Development Workflow

1. Create a feature branch
2. Make changes
3. Test locally
4. Push to GitHub
5. Create Pull Request
6. Merge to `main`
7. **Automatic deployment** triggers
8. Live in 2-3 minutes!

## Commands

### Frontend

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Infrastructure

```bash
cd infrastructure
terraform init       # Initialize Terraform
terraform plan       # Preview changes
terraform apply      # Apply changes
terraform destroy    # Destroy infrastructure (careful!)
```

## Environment Setup

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup instructions.

## License

MIT

V
