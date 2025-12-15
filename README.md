# User Tracking Platform - WBD Global Martech Engineering

A high-performance, scalable user tracking and analytics platform built for an e-commerce environment similar to Amazon. This system tracks user journeys, behaviors, and provides comprehensive analytics for business intelligence.

## Level Selections

| Area | Level | Description |
|------|-------|-------------|
| **Database** | L3 | MongoDB Atlas + Schema Design + Integration Points |
| **Backend/API** | L5 | Full API + Cloud Deployment + Unit Tests + Scheduled Jobs |
| **Cloud/DevOps** | L4 | AWS Infrastructure + CI/CD + Terraform IaC |
| **Frontend** | L6 | Full Web App + Admin Control Panel + Cloud Hosted |
| **Dashboards** | L4 | System Monitoring + Business Analytics KPIs |

## Challenge Addressed

**High Availability (24/7) with Multi-Region Support**
- Multi-AZ deployment for fault tolerance
- Auto-scaling based on load
- Read replicas for database
- CDN for static assets
- Health checks and automatic failover

## Tech Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB Atlas (with Mongoose ODM)
- **Caching**: Redis (ElastiCache)
- **Queue**: AWS SQS for event processing
- **Scheduling**: node-cron for scheduled jobs

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI (MUI)
- **Charts**: Recharts / D3.js
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod

### Infrastructure
- **Cloud**: AWS (EC2, ECS, Lambda, S3, CloudFront)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Monitoring**: CloudWatch + Grafana
- **Containerization**: Docker

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLOUDFRONT CDN                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
           ┌───────────────┐                   ┌───────────────┐
           │   S3 Bucket   │                   │     ALB       │
           │ (Static Web)  │                   │ (API Gateway) │
           └───────────────┘                   └───────────────┘
                                                       │
                              ┌─────────────────────────┼─────────────────────────┐
                              ▼                         ▼                         ▼
                    ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
                    │   ECS Service    │     │   ECS Service    │     │   ECS Service    │
                    │   (API - AZ1)    │     │   (API - AZ2)    │     │   (Worker)       │
                    └──────────────────┘     └──────────────────┘     └──────────────────┘
                              │                         │                         │
                              └─────────────────────────┼─────────────────────────┘
                                                        │
                    ┌───────────────────────────────────┼───────────────────────────────────┐
                    ▼                                   ▼                                   ▼
           ┌───────────────┐                   ┌───────────────┐                   ┌───────────────┐
           │ MongoDB Atlas │                   │   ElastiCache │                   │    AWS SQS    │
           │   (Primary)   │                   │    (Redis)    │                   │   (Events)    │
           └───────────────┘                   └───────────────┘                   └───────────────┘
                    │
                    ▼
           ┌───────────────┐
           │ MongoDB Atlas │
           │  (Replica)    │
           └───────────────┘
```

## Project Structure

```
user-tracking-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/     # Express middlewares
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── jobs/            # Scheduled jobs
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript types
│   │   └── tests/           # Unit & integration tests
│   ├── docs/                # API documentation
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── store/           # Redux store
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── package.json
├── infrastructure/
│   ├── terraform/           # IaC configurations
│   ├── docker/              # Docker configurations
│   └── scripts/             # Deployment scripts
├── docs/
│   ├── diagrams/            # Architecture diagrams
│   └── api/                 # API documentation
└── README.md
```

## Event Types Tracked

1. **SESSION_START** - User begins a session
2. **SESSION_END** - User ends a session
3. **PAGE_VIEW** - User views a page
4. **PRODUCT_VIEW** - User views a product
5. **ADD_TO_CART** - User adds item to cart
6. **REMOVE_FROM_CART** - User removes item from cart
7. **PURCHASE** - User completes purchase
8. **SEARCH** - User performs search
9. **CLICK** - User clicks on element
10. **SCROLL** - User scroll depth tracking

## Design Patterns Used

1. **Repository Pattern** - Data access abstraction
2. **Service Layer Pattern** - Business logic separation
3. **Factory Pattern** - Object creation
4. **Observer Pattern** - Event handling
5. **Singleton Pattern** - Configuration management
6. **Strategy Pattern** - Multiple export formats
7. **CQRS** - Command Query Responsibility Segregation for read/write optimization

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- MongoDB Atlas account (free tier)
- AWS CLI configured (for deployment)

### Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/user-tracking-platform.git
cd user-tracking-platform

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Seed Database (Test Data)

```bash
cd backend
npm run seed
```

This creates:
- 1,000 users with profiles
- ~50,000 events across various types
- 100 products
- 5 admin users (admin@example.com / Admin123!@#)

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:3000/api/docs`
- **API Reference**: [docs/API.md](docs/API.md)

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/events` | Track user events |
| `POST /api/v1/events/batch` | Batch event ingestion |
| `GET /api/v1/analytics/dashboard` | Dashboard metrics |
| `GET /api/v1/users` | User profiles with pagination |
| `GET /api/v1/sessions` | Session data |

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and diagrams |
| [DATABASE.md](docs/DATABASE.md) | MongoDB schema design |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment guide (AWS, Docker) |
| [API.md](docs/API.md) | Complete API reference |

## Key Features

### User Tracking
- Real-time event ingestion (1M+ events/day capacity)
- User profile management (500K+ profiles)
- Session tracking with device/location data
- E-commerce events (views, cart, purchases)

### Analytics Dashboard
- Real-time metrics and KPIs
- User segmentation analysis
- Funnel visualization
- Revenue analytics
- Cohort analysis

### Admin Panel
- User management (RBAC)
- Role-based access control
- Data export capabilities
- System monitoring

### High Availability
- Multi-AZ deployment
- Auto-scaling (2-10 instances)
- Health checks and failover
- 99.9% uptime target

## Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Analytics Export | Daily 10:00 UTC | Export analytics to S3 |
| Session Cleanup | Every 6 hours | Clean expired sessions |
| User Aggregation | Daily 02:00 UTC | Aggregate user metrics |

## Testing

```bash
# Run all tests
cd backend
npm test

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test:watch
```

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-32-char-secret-key
JWT_REFRESH_SECRET=your-32-char-refresh-key
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time (p95) | < 200ms |
| Event Ingestion Rate | 1,000+ events/sec |
| Dashboard Load Time | < 3 seconds |
| Availability | 99.9% |

## Monitoring

- **Grafana Dashboard**: System health and performance metrics
- **CloudWatch**: AWS service monitoring and logs
- **Prometheus**: Metrics collection
- **Custom Analytics**: Business KPIs and user insights

Access Grafana at `http://localhost:3001` (admin/admin) when running via Docker Compose.

## Deployment

### Quick Deploy to AWS

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

## License

Proprietary - WBD Technical Assessment

## Author

Built for WBD Global Martech Engineering Technical Assessment
