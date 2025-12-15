# System Architecture

## Overview

The User Tracking Platform is designed as a cloud-native, highly available system that can handle 1M+ events daily with 500K+ user profiles.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                     INTERNET                                             │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              AWS CloudFront CDN                                          │
│                     (Static Assets & API Caching)                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                          │                               │
                          ▼                               ▼
            ┌─────────────────────────┐     ┌─────────────────────────┐
            │     S3 Bucket           │     │   Application Load      │
            │   (React Frontend)      │     │      Balancer           │
            └─────────────────────────┘     └─────────────────────────┘
                                                        │
                              ┌─────────────────────────┼─────────────────────────┐
                              ▼                         ▼                         ▼
                    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
                    │   ECS Fargate   │     │   ECS Fargate   │     │   ECS Fargate   │
                    │   (API - AZ1)   │     │   (API - AZ2)   │     │   (Worker)      │
                    └─────────────────┘     └─────────────────┘     └─────────────────┘
                              │                         │                         │
                              └─────────────────────────┼─────────────────────────┘
                                                        │
                    ┌─────────────────────────┬─────────┴─────────┬─────────────────────────┐
                    ▼                         ▼                   ▼                         ▼
          ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
          │  MongoDB Atlas  │     │   ElastiCache   │     │    AWS SQS      │     │    AWS S3       │
          │   (Primary +    │     │    (Redis)      │     │  (Event Queue)  │     │   (Exports)     │
          │    Replicas)    │     │                 │     │                 │     │                 │
          └─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Component Details

### 1. Frontend Layer

**Technology**: React 18 with TypeScript
- **Hosting**: S3 + CloudFront for global distribution
- **Features**:
  - Server-side rendering (optional via Next.js)
  - Real-time dashboard updates
  - Responsive design with Material-UI

### 2. API Layer

**Technology**: Node.js/Express with TypeScript
- **Deployment**: ECS Fargate (multi-AZ)
- **Auto-scaling**: 1-10 instances based on CPU/memory
- **Features**:
  - RESTful API design
  - JWT authentication
  - Rate limiting
  - Request validation with Zod

### 3. Data Layer

**MongoDB Atlas**
- Primary database for all data
- 3-node replica set for high availability
- Time-series collections for events
- Indexed for common query patterns

**Redis (ElastiCache)**
- Session caching
- Rate limiting counters
- Real-time analytics cache

### 4. Event Processing

**AWS SQS**
- Decouples event ingestion from processing
- Handles traffic spikes gracefully
- Dead letter queue for failed events

**Worker Service**
- Processes events from SQS
- Updates user profiles
- Generates real-time analytics

## Data Flow

### Event Ingestion Flow

```
Client → CloudFront → ALB → API Service → SQS → Worker → MongoDB
                                              ↓
                                          Redis (cache)
```

### User Journey Query Flow

```
Dashboard → API → Redis (cache check)
                      ↓ (cache miss)
                  MongoDB → Response → Redis (cache set)
```

### Analytics Export Flow

```
Scheduled Job (10:00 UTC)
       ↓
  MongoDB (aggregate queries)
       ↓
  Generate Report
       ↓
  S3 (store) + External System (push)
```

## High Availability Design

### Challenge: 24/7 High Availability

**Solution Implemented**:

1. **Multi-AZ Deployment**
   - API services run across 2+ availability zones
   - MongoDB Atlas uses 3-node replica set
   - ALB distributes traffic across zones

2. **Auto-Scaling**
   - ECS scales from 1-10 instances
   - Triggers: CPU > 70%, Memory > 80%
   - Scale-out: 60s cooldown
   - Scale-in: 300s cooldown

3. **Health Checks**
   - ALB health checks every 30s
   - Container health checks
   - Automatic instance replacement

4. **Zero-Downtime Deployments**
   - Rolling updates with ECS
   - Blue/green deployment option
   - Automatic rollback on failure

5. **Data Redundancy**
   - MongoDB replication
   - S3 cross-region replication
   - Redis cluster mode (production)

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Security Layers                          │
├─────────────────────────────────────────────────────────────────┤
│  1. WAF (Web Application Firewall)                               │
│     - SQL injection protection                                   │
│     - XSS protection                                            │
│     - Rate limiting                                             │
├─────────────────────────────────────────────────────────────────┤
│  2. TLS/SSL                                                      │
│     - HTTPS everywhere                                          │
│     - TLS 1.3                                                   │
├─────────────────────────────────────────────────────────────────┤
│  3. Authentication                                               │
│     - JWT tokens                                                │
│     - Refresh token rotation                                    │
│     - Role-based access control                                 │
├─────────────────────────────────────────────────────────────────┤
│  4. Network Security                                             │
│     - VPC isolation                                             │
│     - Security groups                                           │
│     - Private subnets for services                              │
├─────────────────────────────────────────────────────────────────┤
│  5. Data Security                                                │
│     - Encryption at rest (S3, MongoDB)                          │
│     - Encryption in transit                                     │
│     - Secrets in SSM Parameter Store                            │
└─────────────────────────────────────────────────────────────────┘
```

## Monitoring & Observability

### CloudWatch Metrics
- API response times
- Error rates
- CPU/Memory utilization
- Request counts

### Grafana Dashboards
- System health overview
- Event processing metrics
- User activity trends
- Error tracking

### Alerting
- High error rate (>5%)
- High latency (>2s p99)
- Service unhealthy
- Disk space warnings

## Scaling Considerations

### Current Design (1M events/day)
- 2-4 API instances
- MongoDB M10 cluster
- Single Redis node

### Scaled Design (10M events/day)
- 10-20 API instances
- MongoDB M30+ cluster with sharding
- Redis cluster with replicas
- Dedicated worker cluster

### Further Scaling (100M+ events/day)
- Apache Kafka for event streaming
- ClickHouse for analytics
- Elasticsearch for search
- Multi-region deployment
