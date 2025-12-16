# System Monitoring Guide

## Overview

The User Tracking Platform uses Grafana Cloud integrated with AWS CloudWatch for comprehensive system monitoring and observability.

## Grafana Cloud Setup

### Prerequisites
- AWS Account with CloudWatch enabled
- Grafana Cloud account (free tier)

### IAM User for Grafana

An IAM user `grafana-cloudwatch-reader` has been created with read-only access to CloudWatch metrics and logs.

**Policy Attached**: `GrafanaCloudWatchReadOnly`

Permissions include:
- CloudWatch metrics read access
- CloudWatch logs read access
- EC2 tags and instance information
- Resource tags

### Configuring CloudWatch Data Source

1. Log into Grafana Cloud
2. Go to **Connections** → **Data sources**
3. Click **Add data source** → Select **CloudWatch**
4. Configure:
   - Authentication Provider: `Access & secret key`
   - Default Region: `us-east-1`
5. Click **Save & Test**

### Importing the Dashboard

1. Go to **Dashboards** → **Import**
2. Upload the JSON file from `infrastructure/grafana/dashboard.json`
3. Select your CloudWatch data source
4. Click **Import**

## Dashboard Panels

### ECS Service Health
| Panel | Description |
|-------|-------------|
| CPU Utilization | ECS service CPU usage percentage |
| Memory Utilization | ECS service memory usage percentage |
| Running Tasks | Number of running ECS tasks |
| Pending Tasks | Number of pending ECS tasks |

### Application Load Balancer
| Panel | Description |
|-------|-------------|
| Request Count | Total requests per minute |
| Response Time | Average response time in ms |
| 5XX Errors | Server-side errors count |
| 4XX Errors | Client-side errors count |
| Healthy Hosts | Number of healthy targets |
| Unhealthy Hosts | Number of unhealthy targets |

## Alerting (Optional)

### Recommended Alerts

1. **High CPU Usage**
   - Condition: CPU > 80% for 5 minutes
   - Severity: Warning

2. **High Memory Usage**
   - Condition: Memory > 85% for 5 minutes
   - Severity: Warning

3. **Service Unhealthy**
   - Condition: Healthy Hosts < 1
   - Severity: Critical

4. **High Error Rate**
   - Condition: 5XX errors > 10 in 5 minutes
   - Severity: Critical

5. **High Latency**
   - Condition: Response time > 2000ms
   - Severity: Warning

### Setting Up Alerts in Grafana

1. Go to **Alerting** → **Alert rules**
2. Click **Create alert rule**
3. Configure the condition based on CloudWatch metrics
4. Set up notification channels (email, Slack, etc.)

## CloudWatch Logs

Application logs are available in CloudWatch:

- **Log Group**: `/ecs/utp-development-api`
- **Retention**: 30 days

### Viewing Logs in Grafana

1. Add a **Logs** panel
2. Select CloudWatch data source
3. Query: `fields @timestamp, @message | sort @timestamp desc | limit 100`
4. Log Group: `/ecs/utp-development-api`

## Metrics Reference

### ECS Metrics (AWS/ECS)
| Metric | Description |
|--------|-------------|
| CPUUtilization | CPU usage percentage |
| MemoryUtilization | Memory usage percentage |

### ECS Container Insights (ECS/ContainerInsights)
| Metric | Description |
|--------|-------------|
| RunningTaskCount | Number of running tasks |
| PendingTaskCount | Number of pending tasks |
| CpuReserved | Reserved CPU units |
| MemoryReserved | Reserved memory in MB |

### ALB Metrics (AWS/ApplicationELB)
| Metric | Description |
|--------|-------------|
| RequestCount | Total request count |
| TargetResponseTime | Response time in seconds |
| HTTPCode_ELB_5XX_Count | 5XX error count |
| HTTPCode_ELB_4XX_Count | 4XX error count |
| HealthyHostCount | Healthy targets |
| UnHealthyHostCount | Unhealthy targets |

## Troubleshooting

### No Data in Dashboard
1. Verify CloudWatch data source is configured correctly
2. Check IAM user permissions
3. Ensure correct AWS region is selected
4. Verify ECS service is running

### Metrics Delayed
CloudWatch metrics have a 1-5 minute delay. This is normal behavior.

### Connection Issues
1. Verify Access Key ID and Secret Access Key
2. Check network connectivity
3. Ensure IAM user has proper permissions

## Best Practices

1. **Set appropriate time ranges** - Use 1h-6h for real-time monitoring
2. **Use auto-refresh** - Set 30s-1m refresh interval
3. **Create focused dashboards** - Separate system metrics from business metrics
4. **Set up alerts** - Don't just monitor, get notified
5. **Review regularly** - Check dashboards daily during initial deployment
