# Smart Bus Pass System - Terraform Infrastructure

This directory contains Terraform configurations for provisioning Azure infrastructure for the Smart Bus Pass & Ticket Booking System.

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- Azure subscription with appropriate permissions

## Resources Provisioned

- **Resource Group**: Container for all resources
- **Virtual Network**: Network isolation with subnets for App Service and Database
- **PostgreSQL Flexible Server**: Managed PostgreSQL 15 database with automated backups
- **Storage Account**: Blob storage for PDFs and static assets
- **Key Vault**: Secure storage for secrets and credentials
- **App Service Plan**: Hosting plan with auto-scaling
- **App Services**: Separate services for backend API and frontend
- **Redis Cache**: In-memory cache for session and data caching
- **Log Analytics Workspace**: Centralized logging
- **Application Insights**: Application performance monitoring
- **Auto-scaling**: CPU-based auto-scaling rules

## Setup

1. **Login to Azure**:
   ```bash
   az login
   ```

2. **Create backend storage for Terraform state** (one-time setup):
   ```bash
   az group create --name tfstate-rg --location eastus
   az storage account create --name tfstatestorage --resource-group tfstate-rg --location eastus --sku Standard_LRS
   az storage container create --name tfstate --account-name tfstatestorage
   ```

3. **Copy and configure variables**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

4. **Initialize Terraform**:
   ```bash
   terraform init
   ```

5. **Plan the deployment**:
   ```bash
   terraform plan -var="environment=dev"
   ```

6. **Apply the configuration**:
   ```bash
   terraform apply -var="environment=dev"
   ```

## Environments

The infrastructure supports three environments:
- **dev**: Development environment with minimal resources
- **staging**: Staging environment for testing
- **prod**: Production environment with high availability and geo-redundancy

## Auto-scaling Configuration

- **Scale Out**: When CPU > 70% for 5 minutes, add 1 instance
- **Scale In**: When CPU < 30% for 10 minutes, remove 1 instance
- **Min Instances**: 2 (for high availability)
- **Max Instances**: 5 (dev/staging), 10 (prod)

## Security Features

- TLS 1.2+ enforced on all services
- Network isolation with VNet and subnets
- Key Vault for secrets management
- Network Security Groups for database access control
- Managed identities for service-to-service authentication

## Outputs

After successful deployment, Terraform outputs:
- Resource group name
- Database FQDN
- Backend API URL
- Frontend URL
- Storage account name
- Key Vault URI
- Redis hostname
- Application Insights instrumentation key

## Cleanup

To destroy all resources:
```bash
terraform destroy -var="environment=dev"
```

**Warning**: This will permanently delete all resources and data.

## Cost Optimization

For development:
- Use B-series VMs for App Service
- Use Standard Redis cache
- Disable geo-redundancy
- Reduce backup retention to 7 days

For production:
- Use P-series VMs for better performance
- Use Premium Redis cache
- Enable geo-redundancy
- Set backup retention to 30 days
