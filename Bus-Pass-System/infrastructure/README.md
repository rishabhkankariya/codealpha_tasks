# Infrastructure Documentation

## Overview

The Smart Bus Pass System infrastructure is built on Microsoft Azure using Infrastructure as Code (Terraform). The architecture follows cloud-native best practices with emphasis on scalability, security, and high availability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Azure Cloud                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Resource Group                           │ │
│  │                                                              │ │
│  │  ┌──────────────┐      ┌──────────────┐                   │ │
│  │  │  App Service │      │  App Service │                   │ │
│  │  │   (Backend)  │◄────►│  (Frontend)  │                   │ │
│  │  │   FastAPI    │      │    React     │                   │ │
│  │  └──────┬───────┘      └──────────────┘                   │ │
│  │         │                                                   │ │
│  │         │                                                   │ │
│  │  ┌──────▼───────────────────────────────┐                 │ │
│  │  │     PostgreSQL Flexible Server       │                 │ │
│  │  │         (Database)                   │                 │ │
│  │  └──────────────────────────────────────┘                 │ │
│  │                                                              │ │
│  │  ┌──────────────┐      ┌──────────────┐                   │ │
│  │  │ Redis Cache  │      │ Blob Storage │                   │ │
│  │  │  (Session)   │      │   (Files)    │                   │ │
│  │  └──────────────┘      └──────────────┘                   │ │
│  │                                                              │ │
│  │  ┌──────────────┐      ┌──────────────┐                   │ │
│  │  │  Key Vault   │      │   Monitor    │                   │ │
│  │  │  (Secrets)   │      │  (Logging)   │                   │ │
│  │  └──────────────┘      └──────────────┘                   │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. App Service Plan
- **SKU**: B2 (dev), P1v3 (prod)
- **OS**: Linux
- **Auto-scaling**: Enabled with CPU-based rules
- **Min Instances**: 2
- **Max Instances**: 5 (dev), 10 (prod)

### 2. App Services
- **Backend API**: FastAPI application with Docker container
- **Frontend**: React application served via Nginx
- **Health Checks**: Enabled on `/health` endpoint
- **Always On**: Enabled for production

### 3. PostgreSQL Flexible Server
- **Version**: 15
- **SKU**: B_Standard_B2s (dev), GP_Standard_D4s_v3 (prod)
- **Storage**: 32 GB
- **Backup Retention**: 7 days (dev), 30 days (prod)
- **Geo-Redundancy**: Disabled (dev), Enabled (prod)
- **Network**: VNet integrated with private subnet

### 4. Redis Cache
- **SKU**: Standard C1 (dev), Premium P2 (prod)
- **TLS**: 1.2 minimum
- **Eviction Policy**: allkeys-lru
- **Non-SSL Port**: Disabled

### 5. Storage Account
- **Tier**: Standard
- **Replication**: LRS (dev), GRS (prod)
- **Containers**:
  - `pdfs`: Private (for bus pass PDFs)
  - `static-assets`: Public blob access (for static files)
- **Versioning**: Enabled

### 6. Key Vault
- **SKU**: Standard
- **Soft Delete**: 7 days retention
- **Purge Protection**: Enabled (prod only)
- **Network**: Deny by default, allow Azure services

### 7. Monitoring
- **Log Analytics Workspace**: 30 days (dev), 90 days (prod)
- **Application Insights**: Web application type
- **Metrics**: Request rate, error rate, response time, CPU, memory

## Network Architecture

### Virtual Network
- **Address Space**: 10.0.0.0/16
- **Subnets**:
  - App Service Subnet: 10.0.1.0/24
  - Database Subnet: 10.0.2.0/24

### Network Security
- **NSG Rules**: Allow PostgreSQL (5432) from App Service subnet only
- **Service Endpoints**: Enabled for Storage and Key Vault
- **Private Endpoints**: Database accessible only within VNet

## Security

### Authentication & Authorization
- JWT tokens for API authentication
- Managed Identity for service-to-service auth
- Key Vault for secrets management

### Data Protection
- TLS 1.2+ for all connections
- Encryption at rest for database and storage
- Password hashing with bcrypt

### Network Security
- VNet integration for App Services
- Private endpoints for database
- NSG rules for traffic control
- CORS policies for API access

### Compliance
- Audit logging enabled
- 90-day log retention (prod)
- Automated backups
- Geo-redundancy (prod)

## Auto-scaling Configuration

### Scale-Out Rule
- **Metric**: CPU Percentage
- **Threshold**: > 70%
- **Duration**: 5 minutes
- **Action**: Add 1 instance
- **Cooldown**: 5 minutes

### Scale-In Rule
- **Metric**: CPU Percentage
- **Threshold**: < 30%
- **Duration**: 10 minutes
- **Action**: Remove 1 instance
- **Cooldown**: 10 minutes

## Disaster Recovery

### Backup Strategy
- **Database**: Automated daily backups with 30-day retention (prod)
- **Point-in-Time Restore**: Available for last 30 days
- **Geo-Redundant Backups**: Enabled for production
- **Storage**: Versioning enabled for blob storage

### High Availability
- **Minimum 2 instances**: Always running for zero-downtime deployments
- **Health checks**: Automatic instance replacement on failure
- **Load balancing**: Built-in Azure Load Balancer

### Recovery Procedures
1. **Database Recovery**: Restore from automated backup or point-in-time
2. **Application Recovery**: Rollback to previous Docker image
3. **Storage Recovery**: Restore from blob versioning

## Cost Optimization

### Development Environment
- Use B-series VMs (burstable)
- Standard Redis cache
- LRS storage replication
- 7-day backup retention
- Single availability zone

### Production Environment
- Use P-series VMs (premium)
- Premium Redis cache with persistence
- GRS storage replication
- 30-day backup retention
- Zone-redundant deployment

### Cost Monitoring
- Set up budget alerts in Azure Cost Management
- Monitor resource utilization
- Right-size resources based on actual usage
- Use reserved instances for predictable workloads

## Deployment Procedures

### Initial Deployment
```bash
cd infrastructure/terraform
terraform init
terraform plan -var="environment=prod"
terraform apply -var="environment=prod"
```

### Updates
```bash
terraform plan -var="environment=prod"
terraform apply -var="environment=prod"
```

### Rollback
```bash
# Revert to previous Terraform state
terraform state pull > backup.tfstate
terraform apply -var="environment=prod" -state=backup.tfstate
```

## Monitoring & Alerts

### Key Metrics
- **Availability**: Target 99.9% uptime
- **Response Time**: P95 < 500ms
- **Error Rate**: < 1%
- **CPU Utilization**: 40-70% average
- **Memory Utilization**: < 80%

### Alert Rules
- High error rate (> 5% for 5 minutes)
- High response time (> 2s for 5 minutes)
- High CPU (> 90% for 10 minutes)
- Database connection failures
- Storage capacity > 80%

### Notification Channels
- Email to ops team
- Azure Monitor action groups
- Integration with incident management system

## Maintenance Windows

### Scheduled Maintenance
- **Day**: Sunday
- **Time**: 2:00 AM - 4:00 AM UTC
- **Frequency**: Monthly
- **Activities**: OS updates, security patches, database maintenance

### Emergency Maintenance
- Communicated via status page
- Rollback plan prepared
- Post-mortem documentation required

## Troubleshooting

### Common Issues

**Issue**: Application not responding
- Check App Service health status
- Review Application Insights logs
- Verify database connectivity
- Check auto-scaling events

**Issue**: High response times
- Check database query performance
- Review Redis cache hit rate
- Analyze Application Insights performance data
- Check for resource constraints

**Issue**: Database connection errors
- Verify connection string in Key Vault
- Check NSG rules
- Verify VNet integration
- Review PostgreSQL logs

**Issue**: Deployment failures
- Check Docker image availability
- Review deployment logs in Azure Portal
- Verify environment variables
- Check health check endpoint

## Support Contacts

- **Infrastructure Team**: infra@smartbuspass.com
- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Azure Support**: Portal support ticket
- **Emergency Escalation**: CTO

## References

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure Database for PostgreSQL](https://docs.microsoft.com/en-us/azure/postgresql/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure Monitor](https://docs.microsoft.com/en-us/azure/azure-monitor/)
