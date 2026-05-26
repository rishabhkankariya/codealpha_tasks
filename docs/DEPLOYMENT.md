# Deployment Guide

This guide covers deploying the Smart Bus Pass System to Azure cloud infrastructure.

## Prerequisites

- Azure subscription with appropriate permissions
- Azure CLI installed and configured
- Terraform >= 1.0 installed
- Docker Hub account (for container registry)
- GitHub repository with Actions enabled

## Step 1: Azure Setup

### 1.1 Login to Azure
```bash
az login
az account set --subscription "Your-Subscription-Name"
```

### 1.2 Create Service Principal for Terraform
```bash
az ad sp create-for-rbac --name "smart-bus-pass-terraform" \
  --role="Contributor" \
  --scopes="/subscriptions/YOUR_SUBSCRIPTION_ID"
```

Save the output - you'll need it for Terraform and GitHub Actions.

### 1.3 Create Terraform State Storage
```bash
# Create resource group
az group create --name tfstate-rg --location eastus

# Create storage account
az storage account create \
  --name tfstatestorage \
  --resource-group tfstate-rg \
  --location eastus \
  --sku Standard_LRS

# Create container
az storage container create \
  --name tfstate \
  --account-name tfstatestorage
```

## Step 2: Infrastructure Deployment

### 2.1 Configure Terraform Variables
```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
environment = "prod"
location    = "eastus"
project_name = "smart-bus-pass"
allowed_ip_addresses = ["YOUR_IP/32"]
```

### 2.2 Initialize Terraform
```bash
terraform init
```

### 2.3 Plan Deployment
```bash
terraform plan -var="environment=prod" -out=tfplan
```

Review the plan carefully before applying.

### 2.4 Apply Infrastructure
```bash
terraform apply tfplan
```

This will create:
- Resource Group
- Virtual Network with subnets
- PostgreSQL Flexible Server
- Redis Cache
- Storage Account with containers
- Key Vault
- App Service Plan
- App Services (backend and frontend)
- Log Analytics Workspace
- Application Insights
- Auto-scaling rules

### 2.5 Save Outputs
```bash
terraform output > outputs.txt
```

## Step 3: Database Setup

### 3.1 Connect to Database
```bash
# Get database connection details from Terraform outputs
DB_HOST=$(terraform output -raw database_fqdn)
DB_PASSWORD=$(terraform output -raw database_password)

# Connect using psql
psql "host=$DB_HOST port=5432 dbname=smart_bus_pass_db user=psqladmin sslmode=require" \
  --password
```

### 3.2 Initialize Schema
```bash
# Copy schema file to a temporary location
cat ../../backend/database/schema.sql | \
  psql "host=$DB_HOST port=5432 dbname=smart_bus_pass_db user=psqladmin sslmode=require"
```

### 3.3 Verify Database
```bash
psql "host=$DB_HOST port=5432 dbname=smart_bus_pass_db user=psqladmin sslmode=require" \
  -c "\dt"
```

## Step 4: Configure GitHub Actions

### 4.1 Set GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

**Azure Credentials** (from Step 1.2):
```json
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "..."
}
```

**Docker Hub Credentials**:
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password or access token

### 4.2 Configure Environments

Create two environments in GitHub:
- `production` (requires approval)
- `staging`

## Step 5: Build and Push Docker Images

### 5.1 Build Images Locally (Optional)
```bash
# Backend
cd backend
docker build -t smartbuspass/backend:latest .

# Frontend
cd ../frontend
docker build -t smartbuspass/frontend:latest .
```

### 5.2 Push to Docker Hub
```bash
docker login
docker push smartbuspass/backend:latest
docker push smartbuspass/frontend:latest
```

### 5.3 Or Use GitHub Actions
Simply push to the `main` branch and GitHub Actions will build and push automatically.

## Step 6: Deploy Application

### 6.1 Manual Deployment

**Deploy Backend**:
```bash
az webapp config container set \
  --name smart-bus-pass-prod-api \
  --resource-group smart-bus-pass-prod-rg \
  --docker-custom-image-name smartbuspass/backend:latest \
  --docker-registry-server-url https://index.docker.io
```

**Deploy Frontend**:
```bash
az webapp config container set \
  --name smart-bus-pass-prod-web \
  --resource-group smart-bus-pass-prod-rg \
  --docker-custom-image-name smartbuspass/frontend:latest \
  --docker-registry-server-url https://index.docker.io
```

### 6.2 Automated Deployment via GitHub Actions

Push to `main` branch:
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

GitHub Actions will:
1. Run tests
2. Build Docker images
3. Push to Docker Hub
4. Deploy to Azure App Service
5. Run health checks

## Step 7: Configure Environment Variables

### 7.1 Backend Environment Variables
```bash
az webapp config appsettings set \
  --name smart-bus-pass-prod-api \
  --resource-group smart-bus-pass-prod-rg \
  --settings \
    DATABASE_URL="postgresql://psqladmin:PASSWORD@HOST:5432/smart_bus_pass_db" \
    REDIS_URL="redis://:PASSWORD@HOST:6380" \
    SECRET_KEY="your-secret-key-min-32-chars" \
    OPENAI_API_KEY="your-openai-api-key" \
    ENVIRONMENT="production"
```

### 7.2 Frontend Environment Variables
```bash
az webapp config appsettings set \
  --name smart-bus-pass-prod-web \
  --resource-group smart-bus-pass-prod-rg \
  --settings \
    REACT_APP_API_URL="https://smart-bus-pass-prod-api.azurewebsites.net"
```

## Step 8: Verify Deployment

### 8.1 Health Checks
```bash
# Backend health
curl https://smart-bus-pass-prod-api.azurewebsites.net/health

# Frontend health
curl https://smart-bus-pass-prod-web.azurewebsites.net/health
```

### 8.2 API Documentation
Visit: https://smart-bus-pass-prod-api.azurewebsites.net/docs

### 8.3 Application
Visit: https://smart-bus-pass-prod-web.azurewebsites.net

## Step 9: Configure Custom Domain (Optional)

### 9.1 Add Custom Domain
```bash
# Backend
az webapp config hostname add \
  --webapp-name smart-bus-pass-prod-api \
  --resource-group smart-bus-pass-prod-rg \
  --hostname api.smartbuspass.com

# Frontend
az webapp config hostname add \
  --webapp-name smart-bus-pass-prod-web \
  --resource-group smart-bus-pass-prod-rg \
  --hostname www.smartbuspass.com
```

### 9.2 Configure SSL
```bash
# Azure will automatically provision a free managed certificate
az webapp config ssl bind \
  --name smart-bus-pass-prod-api \
  --resource-group smart-bus-pass-prod-rg \
  --certificate-thumbprint auto \
  --ssl-type SNI
```

## Step 10: Monitoring Setup

### 10.1 Configure Alerts
```bash
# High error rate alert
az monitor metrics alert create \
  --name high-error-rate \
  --resource-group smart-bus-pass-prod-rg \
  --scopes /subscriptions/SUB_ID/resourceGroups/smart-bus-pass-prod-rg/providers/Microsoft.Web/sites/smart-bus-pass-prod-api \
  --condition "avg Http5xx > 10" \
  --window-size 5m \
  --evaluation-frequency 1m
```

### 10.2 View Logs
```bash
# Stream logs
az webapp log tail \
  --name smart-bus-pass-prod-api \
  --resource-group smart-bus-pass-prod-rg
```

## Rollback Procedures

### Application Rollback
```bash
# List deployment history
az webapp deployment list \
  --name smart-bus-pass-prod-api \
  --resource-group smart-bus-pass-prod-rg

# Rollback to previous deployment
az webapp deployment slot swap \
  --name smart-bus-pass-prod-api \
  --resource-group smart-bus-pass-prod-rg \
  --slot staging
```

### Infrastructure Rollback
```bash
cd infrastructure/terraform
terraform state pull > backup.tfstate
# Edit terraform files to previous version
terraform apply -var="environment=prod"
```

## Troubleshooting

### Issue: Deployment Fails
```bash
# Check deployment logs
az webapp log deployment show \
  --name smart-bus-pass-prod-api \
  --resource-group smart-bus-pass-prod-rg

# Check container logs
az webapp log tail \
  --name smart-bus-pass-prod-api \
  --resource-group smart-bus-pass-prod-rg
```

### Issue: Database Connection Fails
```bash
# Test database connectivity
az postgres flexible-server connect \
  --name smart-bus-pass-prod-psql \
  --admin-user psqladmin \
  --database-name smart_bus_pass_db
```

### Issue: Application Not Responding
```bash
# Restart app service
az webapp restart \
  --name smart-bus-pass-prod-api \
  --resource-group smart-bus-pass-prod-rg
```

## Maintenance

### Regular Tasks
- Monitor Application Insights dashboards
- Review error logs weekly
- Check auto-scaling events
- Verify backup completion
- Update dependencies monthly
- Review security advisories

### Monthly Tasks
- Review and optimize costs
- Update SSL certificates (if not auto-managed)
- Database performance tuning
- Clean up old logs and backups

## Support

For deployment issues:
- Check Azure Portal for resource status
- Review Application Insights logs
- Contact: devops@smartbuspass.com
- Emergency: +1-XXX-XXX-XXXX

## Next Steps

After successful deployment:
1. Set up monitoring dashboards
2. Configure backup verification
3. Test disaster recovery procedures
4. Document runbooks for common operations
5. Train operations team
6. Set up status page for users
