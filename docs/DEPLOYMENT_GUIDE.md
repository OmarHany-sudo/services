# Controls Tools Deployment Guide

This guide provides comprehensive instructions for deploying Controls Tools to production environments, including cloud platforms, on-premises servers, and containerized environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [SSL Certificate Configuration](#ssl-certificate-configuration)
4. [Database Setup](#database-setup)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Platform Deployment](#cloud-platform-deployment)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Security Hardening](#security-hardening)
9. [Backup and Recovery](#backup-and-recovery)
10. [Scaling and Performance](#scaling-and-performance)
11. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum Requirements:**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 1Gbps connection

**Recommended for Production:**
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: 1Gbps+ connection with low latency

### Software Dependencies

- **Docker**: 20.10+ and Docker Compose 2.0+
- **Operating System**: Ubuntu 20.04+, CentOS 8+, or similar
- **SSL Certificate**: Valid SSL certificate for HTTPS
- **Domain Name**: Registered domain pointing to your server

### External Services

- **Facebook Developer Account**: For Facebook/Meta API access
- **WhatsApp Business Account**: For WhatsApp Business API
- **Twilio Account**: For SMS/OTP services
- **AWS Account**: For S3 storage (or S3-compatible service)
- **Email Service**: SMTP server for notifications

## Environment Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

### 2. Application Setup

```bash
# Clone the repository
git clone <your-repository-url>
cd controls-tools-platform

# Create production environment file
cp .env.prod.example .env.prod

# Edit the environment file with your production values
nano .env.prod
```

### 3. Environment Configuration

Edit `.env.prod` with your production values:

```bash
# Database - Use strong passwords
POSTGRES_PASSWORD=your-secure-database-password

# Security - Generate strong keys
SECRET_KEY=$(openssl rand -base64 32)
JWT_SECRET_KEY=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
ENCRYPTION_SALT=$(openssl rand -base64 16)

# Facebook/Meta
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=https://yourdomain.com/api/auth/facebook/callback

# WhatsApp
WHATSAPP_VERIFY_TOKEN=your-whatsapp-verify-token

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-s3-bucket

# URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com
```

## SSL Certificate Configuration

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Create SSL directory
mkdir -p nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*
```

### Option 2: Custom Certificate

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy your certificate files
cp your-certificate.pem nginx/ssl/cert.pem
cp your-private-key.pem nginx/ssl/key.pem

# Set proper permissions
chmod 600 nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem
```

### Option 3: Self-Signed (Development Only)

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

## Database Setup

### PostgreSQL Configuration

The database will be automatically initialized when you start the containers. For additional security:

```bash
# Create database initialization script
cat > backend/init.sql << EOF
-- Create additional database users if needed
-- CREATE USER app_user WITH PASSWORD 'secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE controls_tools_db TO app_user;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF
```

### Database Backup Setup

```bash
# Create backup script
cat > scripts/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="controls_tools_db_${DATE}.sql"

mkdir -p $BACKUP_DIR

docker exec controls-tools-postgres pg_dump -U postgres controls_tools_db > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

chmod +x scripts/backup-db.sh

# Add to crontab for daily backups
echo "0 2 * * * /path/to/controls-tools-platform/scripts/backup-db.sh" | crontab -
```

## Docker Deployment

### 1. Build and Start Services

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 2. Initialize Database

```bash
# Run database migrations
docker exec controls-tools-backend prisma db push

# Create admin user (optional)
docker exec -it controls-tools-backend python scripts/create-admin.py
```

### 3. Verify Deployment

```bash
# Check service health
curl -k https://yourdomain.com/health

# Check API endpoints
curl -k https://yourdomain.com/api/health

# Check frontend
curl -k https://yourdomain.com/
```

### 4. Service Management

```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Update services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# View service logs
docker-compose -f docker-compose.prod.yml logs -f [service-name]
```

## Cloud Platform Deployment

### AWS Deployment

#### Using AWS ECS

1. **Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name controls-tools-cluster
```

2. **Create Task Definitions**
```json
{
  "family": "controls-tools-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-ecr-repo/controls-tools-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/controls-tools",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

3. **Create Services**
```bash
aws ecs create-service \
  --cluster controls-tools-cluster \
  --service-name controls-tools-backend \
  --task-definition controls-tools-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

#### Using AWS App Runner

```yaml
# apprunner.yaml
version: 1.0
runtime: python3.11
build:
  commands:
    build:
      - pip install -r requirements.txt
      - prisma generate
run:
  runtime-version: 3.11
  command: python src/main.py
  network:
    port: 5000
    env: PORT
  env:
    - name: NODE_ENV
      value: production
```

### Google Cloud Platform

#### Using Cloud Run

```bash
# Build and push to Container Registry
docker build -t gcr.io/your-project/controls-tools-backend ./backend
docker push gcr.io/your-project/controls-tools-backend

# Deploy to Cloud Run
gcloud run deploy controls-tools-backend \
  --image gcr.io/your-project/controls-tools-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 5000 \
  --memory 2Gi \
  --cpu 1 \
  --max-instances 10
```

### Microsoft Azure

#### Using Container Instances

```bash
# Create resource group
az group create --name controls-tools-rg --location eastus

# Create container group
az container create \
  --resource-group controls-tools-rg \
  --name controls-tools \
  --image your-registry/controls-tools-backend:latest \
  --dns-name-label controls-tools \
  --ports 5000 \
  --environment-variables NODE_ENV=production \
  --secure-environment-variables DATABASE_URL=your-db-url
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: controls-tools
services:
- name: backend
  source_dir: /backend
  github:
    repo: your-username/controls-tools-platform
    branch: main
  run_command: python src/main.py
  environment_slug: python
  instance_count: 2
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
- name: frontend
  source_dir: /frontend
  github:
    repo: your-username/controls-tools-platform
    branch: main
  build_command: pnpm build
  run_command: serve -s dist -l 3000
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
databases:
- name: db
  engine: PG
  version: "13"
  size: basic-xs
```

## Monitoring and Logging

### Application Monitoring

#### Health Checks

```bash
# Create health check script
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

# Check backend health
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/health)
if [ $BACKEND_STATUS -ne 200 ]; then
    echo "Backend health check failed: $BACKEND_STATUS"
    exit 1
fi

# Check frontend health
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/)
if [ $FRONTEND_STATUS -ne 200 ]; then
    echo "Frontend health check failed: $FRONTEND_STATUS"
    exit 1
fi

# Check database connection
DB_STATUS=$(docker exec controls-tools-postgres pg_isready -U postgres)
if [ $? -ne 0 ]; then
    echo "Database health check failed"
    exit 1
fi

echo "All services healthy"
EOF

chmod +x scripts/health-check.sh
```

#### Log Management

```bash
# Configure log rotation
cat > /etc/logrotate.d/controls-tools << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF

# Create log monitoring script
cat > scripts/monitor-logs.sh << 'EOF'
#!/bin/bash

# Monitor error logs
docker-compose -f docker-compose.prod.yml logs --tail=100 | grep -i error

# Check disk usage
df -h

# Check memory usage
free -h

# Check container status
docker-compose -f docker-compose.prod.yml ps
EOF

chmod +x scripts/monitor-logs.sh
```

### External Monitoring

#### Uptime Monitoring

Set up monitoring with services like:
- **Pingdom**: Website uptime monitoring
- **UptimeRobot**: Free uptime monitoring
- **StatusCake**: Comprehensive monitoring
- **New Relic**: Application performance monitoring

#### Error Tracking

Configure Sentry for error tracking:

```python
# In backend/src/main.py
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[FlaskIntegration()],
    traces_sample_rate=1.0
)
```

## Security Hardening

### Server Security

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Application Security

```bash
# Set proper file permissions
chmod 600 .env.prod
chmod 600 nginx/ssl/key.pem
chmod -R 755 nginx/
chmod -R 755 backend/
chmod -R 755 frontend/

# Create security headers script
cat > scripts/security-check.sh << 'EOF'
#!/bin/bash

echo "Checking security headers..."
curl -I https://yourdomain.com | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Strict-Transport-Security)"

echo "Checking SSL configuration..."
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
EOF

chmod +x scripts/security-check.sh
```

### Database Security

```bash
# Create database security script
cat > scripts/secure-database.sh << 'EOF'
#!/bin/bash

# Change default passwords
docker exec -it controls-tools-postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'new-secure-password';"

# Create application user with limited privileges
docker exec -it controls-tools-postgres psql -U postgres -c "CREATE USER app_user WITH PASSWORD 'app-user-password';"
docker exec -it controls-tools-postgres psql -U postgres -c "GRANT CONNECT ON DATABASE controls_tools_db TO app_user;"
docker exec -it controls-tools-postgres psql -U postgres -c "GRANT USAGE ON SCHEMA public TO app_user;"
docker exec -it controls-tools-postgres psql -U postgres -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;"

echo "Database security configured"
EOF

chmod +x scripts/secure-database.sh
```

## Backup and Recovery

### Automated Backup System

```bash
# Create comprehensive backup script
cat > scripts/full-backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="controls-tools-backup-${DATE}"

mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Backup database
echo "Backing up database..."
docker exec controls-tools-postgres pg_dump -U postgres controls_tools_db > "${BACKUP_DIR}/${BACKUP_NAME}/database.sql"

# Backup application files
echo "Backing up application files..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}/application.tar.gz" \
  --exclude=node_modules \
  --exclude=venv \
  --exclude=.git \
  --exclude=logs \
  .

# Backup environment files
echo "Backing up configuration..."
cp .env.prod "${BACKUP_DIR}/${BACKUP_NAME}/"
cp -r nginx/ssl "${BACKUP_DIR}/${BACKUP_NAME}/"

# Create backup archive
echo "Creating backup archive..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

# Upload to S3 (optional)
if [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
    aws s3 cp "${BACKUP_NAME}.tar.gz" "s3://your-backup-bucket/controls-tools/"
fi

# Clean old backups (keep last 30 days)
find "${BACKUP_DIR}" -name "controls-tools-backup-*.tar.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_NAME}.tar.gz"
EOF

chmod +x scripts/full-backup.sh

# Schedule daily backups
echo "0 3 * * * /path/to/controls-tools-platform/scripts/full-backup.sh" | crontab -
```

### Recovery Procedures

```bash
# Create recovery script
cat > scripts/restore-backup.sh << 'EOF'
#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    exit 1
fi

BACKUP_FILE="$1"
RESTORE_DIR="/tmp/restore-$(date +%s)"

echo "Restoring from backup: $BACKUP_FILE"

# Extract backup
mkdir -p "$RESTORE_DIR"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore database
echo "Restoring database..."
docker-compose -f docker-compose.prod.yml up -d postgres
sleep 10
docker exec -i controls-tools-postgres psql -U postgres -c "DROP DATABASE IF EXISTS controls_tools_db;"
docker exec -i controls-tools-postgres psql -U postgres -c "CREATE DATABASE controls_tools_db;"
docker exec -i controls-tools-postgres psql -U postgres controls_tools_db < "$RESTORE_DIR"/*/database.sql

# Restore configuration
echo "Restoring configuration..."
cp "$RESTORE_DIR"/*/.env.prod .
cp -r "$RESTORE_DIR"/*/ssl nginx/

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Clean up
rm -rf "$RESTORE_DIR"

echo "Restore completed"
EOF

chmod +x scripts/restore-backup.sh
```

## Scaling and Performance

### Horizontal Scaling

#### Load Balancer Configuration

```nginx
# nginx/nginx-lb.conf
upstream backend_servers {
    least_conn;
    server backend-1:5000 weight=1 max_fails=3 fail_timeout=30s;
    server backend-2:5000 weight=1 max_fails=3 fail_timeout=30s;
    server backend-3:5000 weight=1 max_fails=3 fail_timeout=30s;
}

upstream frontend_servers {
    least_conn;
    server frontend-1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server frontend-2:3000 weight=1 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name _;

    location /api/ {
        proxy_pass http://backend_servers;
        # ... other proxy settings
    }

    location / {
        proxy_pass http://frontend_servers;
        # ... other proxy settings
    }
}
```

#### Multi-Node Docker Swarm

```bash
# Initialize Docker Swarm
docker swarm init

# Create overlay network
docker network create -d overlay controls-tools-network

# Deploy stack
docker stack deploy -c docker-compose.swarm.yml controls-tools

# Scale services
docker service scale controls-tools_backend=3
docker service scale controls-tools_frontend=2
```

### Database Scaling

#### Read Replicas

```yaml
# docker-compose.scale.yml
services:
  postgres-master:
    image: postgres:15-alpine
    environment:
      POSTGRES_REPLICATION_MODE: master
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: replication_password

  postgres-replica:
    image: postgres:15-alpine
    environment:
      POSTGRES_REPLICATION_MODE: slave
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: replication_password
      POSTGRES_MASTER_HOST: postgres-master
```

#### Connection Pooling

```python
# backend/src/database.py
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

### Caching Strategy

#### Redis Clustering

```yaml
# docker-compose.redis-cluster.yml
services:
  redis-master:
    image: redis:7-alpine
    command: redis-server --appendonly yes --cluster-enabled yes

  redis-replica-1:
    image: redis:7-alpine
    command: redis-server --appendonly yes --cluster-enabled yes --slaveof redis-master 6379

  redis-replica-2:
    image: redis:7-alpine
    command: redis-server --appendonly yes --cluster-enabled yes --slaveof redis-master 6379
```

### Performance Optimization

#### Application Performance

```python
# backend/src/optimizations.py
from functools import lru_cache
import asyncio

# Cache frequently accessed data
@lru_cache(maxsize=1000)
def get_user_permissions(user_id):
    # Expensive database query
    pass

# Async processing for heavy operations
async def process_campaign_async(campaign_id):
    # Heavy processing
    pass

# Database query optimization
def get_leads_optimized():
    return db.query(Lead).options(
        selectinload(Lead.tags),
        selectinload(Lead.custom_fields)
    ).all()
```

#### Frontend Performance

```javascript
// frontend/src/optimizations.js
import { lazy, Suspense } from 'react'

// Code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Leads = lazy(() => import('./pages/Leads'))

// Memoization
const MemoizedLeadCard = React.memo(LeadCard)

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'
```

## Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check service logs
docker-compose -f docker-compose.prod.yml logs [service-name]

# Check container status
docker ps -a

# Check resource usage
docker stats

# Check disk space
df -h

# Check memory usage
free -h
```

#### Database Connection Issues

```bash
# Check database logs
docker logs controls-tools-postgres

# Test database connection
docker exec -it controls-tools-postgres psql -U postgres -d controls_tools_db -c "SELECT 1;"

# Check database configuration
docker exec -it controls-tools-postgres cat /var/lib/postgresql/data/postgresql.conf
```

#### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check certificate expiration
openssl x509 -in nginx/ssl/cert.pem -noout -dates
```

#### Performance Issues

```bash
# Check system resources
htop
iotop
nethogs

# Check Docker resource usage
docker stats

# Check application logs for errors
docker-compose -f docker-compose.prod.yml logs | grep -i error

# Check database performance
docker exec -it controls-tools-postgres psql -U postgres -d controls_tools_db -c "SELECT * FROM pg_stat_activity;"
```

### Debugging Tools

#### Application Debugging

```bash
# Enable debug mode temporarily
docker-compose -f docker-compose.prod.yml exec backend python -c "
import os
os.environ['FLASK_DEBUG'] = '1'
exec(open('src/main.py').read())
"

# Check API endpoints
curl -v https://yourdomain.com/api/health
curl -v https://yourdomain.com/api/auth/me -H "Authorization: Bearer token"

# Monitor real-time logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

#### Network Debugging

```bash
# Check port connectivity
telnet yourdomain.com 443
nc -zv yourdomain.com 443

# Check DNS resolution
nslookup yourdomain.com
dig yourdomain.com

# Check network connectivity between containers
docker exec controls-tools-backend ping postgres
docker exec controls-tools-backend ping redis
```

### Emergency Procedures

#### Service Recovery

```bash
# Quick service restart
docker-compose -f docker-compose.prod.yml restart

# Full service recovery
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Rollback to previous version
docker-compose -f docker-compose.prod.yml down
git checkout previous-stable-tag
docker-compose -f docker-compose.prod.yml up -d
```

#### Data Recovery

```bash
# Restore from latest backup
./scripts/restore-backup.sh /backups/controls-tools-backup-latest.tar.gz

# Point-in-time recovery (if using WAL archiving)
docker exec controls-tools-postgres pg_basebackup -D /backup -Ft -z -P
```

### Support and Maintenance

#### Regular Maintenance Tasks

```bash
# Weekly maintenance script
cat > scripts/weekly-maintenance.sh << 'EOF'
#!/bin/bash

echo "Starting weekly maintenance..."

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean Docker resources
docker system prune -f
docker volume prune -f

# Rotate logs
logrotate -f /etc/logrotate.d/controls-tools

# Check disk space
df -h

# Check service health
./scripts/health-check.sh

# Update SSL certificates if needed
certbot renew --quiet

# Restart services if needed
docker-compose -f docker-compose.prod.yml restart

echo "Weekly maintenance completed"
EOF

chmod +x scripts/weekly-maintenance.sh

# Schedule weekly maintenance
echo "0 4 * * 0 /path/to/controls-tools-platform/scripts/weekly-maintenance.sh" | crontab -
```

#### Monitoring Alerts

Set up alerts for:
- Service downtime
- High resource usage
- SSL certificate expiration
- Database connection failures
- Error rate spikes

#### Getting Help

- **Documentation**: Check this guide and API documentation
- **Logs**: Always check application and system logs first
- **Community**: Join our community forum for support
- **Professional Support**: Contact our support team for enterprise assistance

---

**Deployment Checklist**

Before going live, ensure:

- [ ] All environment variables are configured
- [ ] SSL certificates are valid and properly configured
- [ ] Database is properly secured and backed up
- [ ] All services pass health checks
- [ ] Monitoring and alerting are configured
- [ ] Backup and recovery procedures are tested
- [ ] Security hardening is complete
- [ ] Performance testing is done
- [ ] Documentation is updated

**Post-Deployment**

After successful deployment:

1. Monitor services for 24-48 hours
2. Test all critical functionality
3. Verify backup procedures
4. Update DNS records if needed
5. Configure monitoring alerts
6. Document any deployment-specific configurations
7. Train team members on operational procedures

For additional support or questions about deployment, please contact our support team or refer to the troubleshooting section above.

