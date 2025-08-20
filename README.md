# Controls Tools - Consent-First Social Media Marketing Platform

A production-ready, enterprise-grade social media marketing platform built with privacy and consent at its core. Controls Tools enables businesses to ethically collect leads, manage campaigns, and engage with their audience across Facebook and WhatsApp while maintaining full GDPR and CCPA compliance.

## 🚀 Features

### Core Capabilities
- **Consent-First Data Collection**: All data collection requires explicit user consent
- **Multi-Platform Integration**: Facebook Pages, Messenger, and WhatsApp Business API
- **Advanced Lead Management**: Comprehensive CRM with tagging, segmentation, and export
- **Campaign Management**: Create, schedule, and monitor messaging campaigns
- **Real-Time Analytics**: Track engagement, conversion rates, and campaign performance
- **Enterprise Security**: AES-GCM encryption, audit logging, and role-based access control

### Facebook Integration
- Connect and manage multiple Facebook Pages
- Import commenters and likers from posts (with consent)
- Send Messenger broadcasts and follow-up sequences
- Track engagement metrics and lead generation

### WhatsApp Business
- Manage multiple WhatsApp Business numbers
- Send template messages and custom broadcasts
- Handle incoming messages and automated responses
- Template management and approval workflow

### Lead Management
- Comprehensive lead database with consent tracking
- Advanced filtering and search capabilities
- Lead scoring and segmentation
- CSV/XLSX export functionality
- GDPR-compliant data management

### Admin & Compliance
- Admin dashboard with system monitoring
- Comprehensive audit logging
- API key management
- Data export and deletion tools
- Privacy center for user rights

## 🏗️ Architecture

### Backend (Flask + Python)
- **Framework**: Flask with async support
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management and caching
- **Queue**: BullMQ with Redis for background jobs
- **Authentication**: JWT with Facebook OAuth
- **Security**: AES-GCM encryption, input validation, rate limiting

### Frontend (React + Vite)
- **Framework**: React 19 with Vite
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: React Query for server state
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **File Storage**: S3-compatible storage
- **Monitoring**: Built-in health checks and metrics

## 📋 Prerequisites

- **Node.js** 20+ and pnpm
- **Python** 3.11+ and pip
- **Docker** and Docker Compose
- **PostgreSQL** 15+ (or use Docker)
- **Redis** 7+ (or use Docker)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd controls-tools-platform
```

### 2. Start Infrastructure Services
```bash
docker-compose up -d postgres redis
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
prisma generate
prisma db push

# Start the backend server
python src/main.py
```

### 4. Frontend Setup
```bash
cd frontend
pnpm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development server
pnpm dev
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Dashboard**: http://localhost:3000/admin (admin users only)

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/controls_tools_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=jwt-secret-key-change-in-production
ENCRYPTION_KEY=your-encryption-key-change-in-production
ENCRYPTION_SALT=your-encryption-salt-change-in-production

# Facebook/Meta
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:5000/api/auth/facebook/callback

# WhatsApp
WHATSAPP_VERIFY_TOKEN=your-whatsapp-verify-token

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token

# S3 Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket

# Frontend
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```bash
# API Configuration
VITE_API_URL=http://localhost:5000

# Environment
NODE_ENV=development
```

### Facebook App Setup
1. Create a Facebook App at https://developers.facebook.com
2. Add Facebook Login product
3. Configure OAuth redirect URIs
4. Add Pages and Messenger permissions
5. Submit for app review (for production)

### WhatsApp Business Setup
1. Create a WhatsApp Business Account
2. Set up WhatsApp Business API
3. Configure webhook endpoints
4. Create and approve message templates

## 📚 API Documentation

### Authentication
All API endpoints require authentication via JWT tokens obtained through Facebook OAuth.

```bash
# Login via Facebook OAuth
GET /api/auth/facebook/login

# Get current user
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

### Leads Management
```bash
# Get leads with filtering
GET /api/leads?search=john&status=NEW&consent_only=true
Authorization: Bearer <jwt_token>

# Create new lead
POST /api/leads
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "source": "FACEBOOK_COMMENT",
  "consentGiven": true
}

# Export leads
POST /api/leads/export
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "format": "csv",
  "filters": {
    "status": "NEW",
    "consent_only": true
  }
}
```

### Campaign Management
```bash
# Get campaigns
GET /api/campaigns
Authorization: Bearer <jwt_token>

# Create campaign
POST /api/campaigns
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Welcome Campaign",
  "type": "WHATSAPP_TEMPLATE",
  "templateId": "welcome_template",
  "audienceFilters": {
    "status": "NEW",
    "tags": ["interested"]
  },
  "scheduledAt": "2024-01-15T10:00:00Z"
}

# Start campaign
POST /api/campaigns/{id}/start
Authorization: Bearer <jwt_token>
```

### Facebook Integration
```bash
# Get Facebook pages
GET /api/facebook/pages
Authorization: Bearer <jwt_token>

# Import engagement from page
POST /api/facebook/pages/{id}/import-engagement
Authorization: Bearer <jwt_token>

# Send Messenger message
POST /api/facebook/pages/{id}/send-message
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "recipient": "facebook_user_id",
  "message": "Hello! Thanks for your interest."
}
```

### WhatsApp Integration
```bash
# Get WhatsApp numbers
GET /api/whatsapp/numbers
Authorization: Bearer <jwt_token>

# Send WhatsApp message
POST /api/whatsapp/numbers/{id}/send-message
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "recipient": "+1234567890",
  "templateId": "welcome_template",
  "parameters": ["John", "Doe"]
}
```

## 🔒 Security Features

### Data Protection
- **Encryption at Rest**: All sensitive data encrypted with AES-GCM
- **Encryption in Transit**: TLS 1.3 for all communications
- **Secure Headers**: Comprehensive security headers via Helmet
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries

### Authentication & Authorization
- **OAuth 2.0**: Facebook OAuth for secure authentication
- **JWT Tokens**: Stateless authentication with secure token handling
- **Role-Based Access**: User and Admin roles with granular permissions
- **API Key Management**: Secure API keys for programmatic access

### Compliance
- **GDPR Compliance**: Right to access, rectify, and delete personal data
- **CCPA Compliance**: California Consumer Privacy Act compliance
- **Audit Logging**: Comprehensive logging of all user actions
- **Consent Management**: Explicit consent tracking for all data collection
- **Data Retention**: Configurable data retention policies

### Monitoring & Alerting
- **Health Checks**: Real-time system health monitoring
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Monitoring**: API response time and throughput tracking
- **Security Monitoring**: Failed login attempts and suspicious activity detection

## 🧪 Testing

### Backend Tests
```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
pnpm test
```

### Integration Tests
```bash
# Start all services
docker-compose up -d

# Run integration tests
cd backend
pytest tests/integration/ -v
```

## 🚀 Deployment

### Production Environment Variables
Ensure all environment variables are properly configured for production:
- Use strong, unique secrets for all keys
- Configure proper database and Redis connections
- Set up S3 bucket for file storage
- Configure Facebook and WhatsApp API credentials

### Docker Deployment
```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Health Checks
The platform includes comprehensive health checks:
- **Database connectivity**: PostgreSQL connection status
- **Cache availability**: Redis connection and performance
- **External APIs**: Facebook and WhatsApp API connectivity
- **Queue processing**: Background job queue status

## 📊 Monitoring

### Metrics
- **User Metrics**: Active users, new registrations, retention rates
- **Lead Metrics**: Lead generation, conversion rates, consent rates
- **Campaign Metrics**: Message delivery rates, engagement rates, ROI
- **System Metrics**: API response times, error rates, queue processing

### Dashboards
- **User Dashboard**: Personal metrics and campaign performance
- **Admin Dashboard**: System-wide metrics and user management
- **Health Dashboard**: Real-time system health and performance

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- **Python**: Follow PEP 8 style guidelines
- **JavaScript**: Use ESLint and Prettier for code formatting
- **Documentation**: Update documentation for all changes
- **Testing**: Maintain test coverage above 80%

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- **API Reference**: `/docs` endpoint when running the backend
- **User Guide**: Available in the `/docs` directory
- **Admin Guide**: Available in the `/docs` directory

### Community
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions
- **Security**: Report security issues via security@example.com

### Professional Support
For enterprise support, custom development, and consulting services, contact our team at support@example.com.

---

**Built with ❤️ by the Controls Tools Team**

*Empowering businesses to grow ethically with consent-first marketing.*

