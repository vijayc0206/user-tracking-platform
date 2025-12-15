# Deployment Guide

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- AWS CLI configured
- Terraform 1.0+
- MongoDB Atlas account (free tier)

## Local Development

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/user-tracking-platform.git
cd user-tracking-platform
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 4. Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## MongoDB Atlas Setup (Free Tier)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free M0 cluster
3. Add database user
4. Whitelist your IP (or 0.0.0.0/0 for development)
5. Get connection string

```
mongodb+srv://username:password@cluster.mongodb.net/user-tracking?retryWrites=true&w=majority
```

## AWS Deployment

### 1. Configure AWS Credentials

```bash
aws configure
# Enter Access Key ID
# Enter Secret Access Key
# Enter Region (e.g., us-east-1)
```

### 2. Initialize Terraform

```bash
cd infrastructure/terraform

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
aws_region         = "us-east-1"
environment        = "production"
mongodb_uri        = "mongodb+srv://..."
jwt_secret         = "your-super-secret-jwt-key-min-32-chars"
jwt_refresh_secret = "your-refresh-secret-key-min-32-chars"
EOF

# Initialize
terraform init

# Plan
terraform plan

# Apply
terraform apply
```

### 3. Build and Push Docker Image

```bash
cd backend

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t user-tracking-api .

# Tag image
docker tag user-tracking-api:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/utp-production-api:latest

# Push image
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/utp-production-api:latest
```

### 4. Deploy Frontend to S3

```bash
cd frontend

# Build production bundle
npm run build

# Sync to S3
aws s3 sync dist/ s3://utp-production-frontend-<account-id> --delete

# Invalidate CloudFront cache (if configured)
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

### 5. Update ECS Service

```bash
# Force new deployment
aws ecs update-service \
  --cluster utp-production-cluster \
  --service utp-production-api \
  --force-new-deployment
```

## CI/CD with GitHub Actions

### Required Secrets

Add these secrets to your GitHub repository:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `API_URL` | Production API URL |
| `S3_FRONTEND_BUCKET` | S3 bucket name for frontend |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |

### Workflow Triggers

- **Push to main**: Full CI/CD (test, build, deploy)
- **Push to develop**: Tests only
- **Pull Request**: Tests and lint

## Environment Variables

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | No (default: 3000) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing key (32+ chars) | Yes |
| `JWT_REFRESH_SECRET` | Refresh token key (32+ chars) | Yes |
| `REDIS_HOST` | Redis host | No |
| `REDIS_PORT` | Redis port | No |
| `AWS_REGION` | AWS region | No |
| `AWS_S3_BUCKET` | S3 bucket for exports | No |
| `CORS_ORIGIN` | Allowed CORS origins | Yes |

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |

## Health Checks

### Backend Health Endpoints

- `GET /health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health with metrics
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/health/live` - Liveness probe

### Expected Response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

## Monitoring

### CloudWatch

Access CloudWatch console for:
- Log groups: `/ecs/utp-production-api`
- Metrics: ECS service metrics
- Alarms: Set up for high error rates

### Grafana (Optional)

1. Deploy Grafana from docker-compose
2. Add CloudWatch data source
3. Import dashboards from `infrastructure/grafana/dashboards`

## Troubleshooting

### Common Issues

1. **API not starting**
   - Check MongoDB connection string
   - Verify JWT secrets are 32+ characters
   - Check CloudWatch logs

2. **Frontend not loading**
   - Verify S3 bucket policy
   - Check CORS configuration
   - Verify API URL in environment

3. **Database connection issues**
   - Check IP whitelist in MongoDB Atlas
   - Verify credentials
   - Check network connectivity

### Useful Commands

```bash
# View ECS service logs
aws logs tail /ecs/utp-production-api --follow

# Check ECS service status
aws ecs describe-services \
  --cluster utp-production-cluster \
  --services utp-production-api

# List running tasks
aws ecs list-tasks \
  --cluster utp-production-cluster \
  --service-name utp-production-api
```

## Rollback

### ECS Rollback

```bash
# List task definition revisions
aws ecs list-task-definitions --family-prefix utp-production-api

# Update service to previous revision
aws ecs update-service \
  --cluster utp-production-cluster \
  --service utp-production-api \
  --task-definition utp-production-api:PREVIOUS_REVISION
```

### Frontend Rollback

```bash
# S3 versioning allows rollback
aws s3api list-object-versions \
  --bucket utp-production-frontend-<account-id>

# Restore specific version
aws s3api copy-object \
  --bucket utp-production-frontend-<account-id> \
  --copy-source utp-production-frontend-<account-id>/index.html?versionId=VERSION_ID \
  --key index.html
```
