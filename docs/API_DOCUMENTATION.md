# Controls Tools API Documentation

## Overview

The Controls Tools API is a RESTful API that provides programmatic access to all platform features. The API is designed with security, performance, and ease of use in mind, following industry best practices for authentication, error handling, and data validation.

### Base URL
```
Production: https://api.controlstools.com
Development: http://localhost:5000
```

### Authentication
All API endpoints require authentication via JWT tokens obtained through Facebook OAuth or API keys for programmatic access.

### Content Type
All requests and responses use `application/json` content type unless otherwise specified.

### Rate Limiting
- **Authenticated Users**: 1000 requests per hour
- **API Keys**: 5000 requests per hour
- **Admin Users**: 10000 requests per hour

## Authentication Endpoints

### Facebook OAuth Login
Initiates Facebook OAuth flow for user authentication.

```http
GET /api/auth/facebook/login
```

**Response:**
Redirects to Facebook OAuth consent screen.

### Facebook OAuth Callback
Handles Facebook OAuth callback and returns JWT token.

```http
GET /api/auth/facebook/callback?code={auth_code}&state={state}
```

**Parameters:**
- `code` (string): Authorization code from Facebook
- `state` (string): CSRF protection state parameter

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

### Get Current User
Returns information about the currently authenticated user.

```http
GET /api/auth/me
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "USER",
  "facebookId": "fb_123456789",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Lead Management Endpoints

### Get Leads
Retrieve leads with optional filtering and pagination.

```http
GET /api/leads?page=1&limit=25&search=john&status=NEW&source=FACEBOOK_COMMENT&consent_only=true
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 25, max: 100)
- `search` (string, optional): Search in name, email, or phone
- `status` (string, optional): Filter by status (NEW, CONTACTED, QUALIFIED, CONVERTED, UNSUBSCRIBED)
- `source` (string, optional): Filter by source (FACEBOOK_COMMENT, FACEBOOK_LIKE, etc.)
- `consent_only` (boolean, optional): Only return leads with consent

**Response:**
```json
{
  "leads": [
    {
      "id": "lead_123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "status": "NEW",
      "source": "FACEBOOK_COMMENT",
      "consentGiven": true,
      "consentDate": "2024-01-15T10:00:00Z",
      "tags": [
        {
          "id": "tag_1",
          "name": "interested",
          "color": "#3B82F6"
        }
      ],
      "customFields": {
        "company": "Acme Corp",
        "budget": "10000"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 150,
    "pages": 6
  }
}
```

### Create Lead
Create a new lead in the system.

```http
POST /api/leads
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "source": "FACEBOOK_COMMENT",
  "consentGiven": true,
  "customFields": {
    "company": "Acme Corp",
    "budget": "10000"
  },
  "tags": ["interested", "high-value"]
}
```

**Response:**
```json
{
  "id": "lead_123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "status": "NEW",
  "source": "FACEBOOK_COMMENT",
  "consentGiven": true,
  "consentDate": "2024-01-15T10:00:00Z",
  "customFields": {
    "company": "Acme Corp",
    "budget": "10000"
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Update Lead
Update an existing lead.

```http
PUT /api/leads/{lead_id}
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "CONTACTED",
  "customFields": {
    "company": "Acme Corp",
    "budget": "15000",
    "notes": "Very interested in premium package"
  },
  "tags": ["interested", "high-value", "contacted"]
}
```

### Delete Lead
Delete a lead and all associated data (GDPR compliance).

```http
DELETE /api/leads/{lead_id}
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "message": "Lead deleted successfully",
  "deletedAt": "2024-01-15T10:30:00Z"
}
```

### Export Leads
Export leads to CSV or XLSX format.

```http
POST /api/leads/export
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "format": "csv",
  "filters": {
    "status": "NEW",
    "consent_only": true,
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    }
  },
  "fields": ["firstName", "lastName", "email", "phoneNumber", "status", "source"]
}
```

**Response:**
Returns a file download with the exported data.

## Campaign Management Endpoints

### Get Campaigns
Retrieve campaigns with optional filtering.

```http
GET /api/campaigns?status=RUNNING&type=WHATSAPP_TEMPLATE
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "campaigns": [
    {
      "id": "campaign_123",
      "name": "Welcome Campaign",
      "description": "Welcome new leads with special offer",
      "type": "WHATSAPP_TEMPLATE",
      "status": "RUNNING",
      "templateId": "welcome_template",
      "audienceFilters": {
        "status": "NEW",
        "tags": ["interested"],
        "consent_only": true
      },
      "messageStats": {
        "total": 100,
        "sent": 95,
        "delivered": 90,
        "failed": 5
      },
      "scheduledAt": "2024-01-15T10:00:00Z",
      "startedAt": "2024-01-15T10:00:00Z",
      "createdAt": "2024-01-14T15:00:00Z"
    }
  ]
}
```

### Create Campaign
Create a new messaging campaign.

```http
POST /api/campaigns
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Welcome Campaign",
  "description": "Welcome new leads with special offer",
  "type": "WHATSAPP_TEMPLATE",
  "templateId": "welcome_template",
  "audienceFilters": {
    "status": "NEW",
    "tags": ["interested"],
    "consent_only": true
  },
  "scheduledAt": "2024-01-15T10:00:00Z"
}
```

### Start Campaign
Start a scheduled or draft campaign.

```http
POST /api/campaigns/{campaign_id}/start
Authorization: Bearer {jwt_token}
```

### Pause Campaign
Pause a running campaign.

```http
POST /api/campaigns/{campaign_id}/pause
Authorization: Bearer {jwt_token}
```

### Cancel Campaign
Cancel a campaign (cannot be resumed).

```http
POST /api/campaigns/{campaign_id}/cancel
Authorization: Bearer {jwt_token}
```

### Preview Campaign
Preview campaign recipients and estimated costs.

```http
POST /api/campaigns/{campaign_id}/preview
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "total_leads": 500,
  "eligible_leads": 450,
  "estimated_cost": 22.50,
  "message_template": "Hello {{firstName}}, welcome to our platform!",
  "breakdown": {
    "whatsapp_messages": 450,
    "cost_per_message": 0.05
  }
}
```

## Facebook Integration Endpoints

### Get Facebook Pages
Retrieve connected Facebook Pages.

```http
GET /api/facebook/pages
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "pages": [
    {
      "id": "page_123",
      "facebookPageId": "fb_page_456789",
      "name": "My Business Page",
      "isActive": true,
      "accessToken": "encrypted_token",
      "permissions": ["pages_messaging", "pages_read_engagement"],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Page Posts
Retrieve posts from a Facebook Page.

```http
GET /api/facebook/pages/{page_id}/posts?limit=10
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "posts": [
    {
      "id": "post_123",
      "facebookPostId": "fb_post_789",
      "message": "Check out our new product!",
      "story": "My Business Page shared a photo",
      "likesCount": 45,
      "commentsCount": 12,
      "sharesCount": 8,
      "createdTime": "2024-01-15T08:00:00Z"
    }
  ]
}
```

### Import Engagement
Import commenters and likers from Facebook posts.

```http
POST /api/facebook/pages/{page_id}/import-engagement
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "post_ids": ["fb_post_789", "fb_post_790"],
  "import_comments": true,
  "import_likes": true,
  "consent_required": true
}
```

### Send Messenger Message
Send a message via Facebook Messenger.

```http
POST /api/facebook/pages/{page_id}/send-message
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "recipient": "facebook_user_id",
  "message": "Hello! Thanks for your interest in our products.",
  "message_type": "RESPONSE"
}
```

## WhatsApp Integration Endpoints

### Get WhatsApp Numbers
Retrieve registered WhatsApp Business numbers.

```http
GET /api/whatsapp/numbers
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "numbers": [
    {
      "id": "number_123",
      "phoneNumber": "+1234567890",
      "displayName": "My Business",
      "status": "VERIFIED",
      "isActive": true,
      "webhookUrl": "https://api.example.com/webhook",
      "messagesSent": 1250,
      "messagesReceived": 890,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Add WhatsApp Number
Register a new WhatsApp Business number.

```http
POST /api/whatsapp/numbers
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "displayName": "My Business",
  "webhookUrl": "https://api.example.com/webhook"
}
```

### Send WhatsApp Message
Send a WhatsApp message using a template or free-form text.

```http
POST /api/whatsapp/numbers/{number_id}/send-message
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body (Template Message):**
```json
{
  "recipient": "+1987654321",
  "templateId": "welcome_template",
  "parameters": ["John", "Doe", "Premium Package"]
}
```

**Request Body (Free-form Message):**
```json
{
  "recipient": "+1987654321",
  "message": "Hello! How can I help you today?"
}
```

### Get Message Templates
Retrieve WhatsApp message templates.

```http
GET /api/whatsapp/templates
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "templates": [
    {
      "id": "template_123",
      "name": "welcome_template",
      "category": "MARKETING",
      "language": "en",
      "status": "APPROVED",
      "content": "Hello {{1}}, welcome to {{2}}! Your {{3}} is ready.",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## User Management Endpoints

### Get User Settings
Retrieve current user's settings and preferences.

```http
GET /api/users/settings
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "profile": {
    "name": "John Doe",
    "email": "john@example.com",
    "timezone": "America/New_York",
    "language": "en"
  },
  "notifications": {
    "emailNotifications": true,
    "campaignUpdates": true,
    "leadNotifications": true,
    "systemAlerts": true
  }
}
```

### Update User Profile
Update user profile information.

```http
PUT /api/users/profile
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Smith",
  "timezone": "America/Los_Angeles",
  "language": "en"
}
```

### Update Notification Settings
Update notification preferences.

```http
PUT /api/users/notifications
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "emailNotifications": true,
  "campaignUpdates": false,
  "leadNotifications": true,
  "systemAlerts": true
}
```

### Get API Keys
Retrieve user's API keys.

```http
GET /api/users/api-keys
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "api_keys": [
    {
      "id": "key_123",
      "name": "Production API Key",
      "permissions": ["leads:read", "campaigns:write"],
      "isActive": true,
      "lastUsedAt": "2024-01-15T10:00:00Z",
      "expiresAt": "2024-12-31T23:59:59Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create API Key
Generate a new API key.

```http
POST /api/users/api-keys
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Integration API Key",
  "permissions": ["leads:read", "leads:write"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "api_key": "ct_live_1234567890abcdef...",
  "key_info": {
    "id": "key_124",
    "name": "Integration API Key",
    "permissions": ["leads:read", "leads:write"],
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

### Export User Data
Export all user data (GDPR compliance).

```http
POST /api/users/export-data
Authorization: Bearer {jwt_token}
```

**Response:**
Returns a JSON file with all user data.

## Admin Endpoints

### Get Admin Dashboard
Retrieve admin dashboard statistics (Admin only).

```http
GET /api/admin/dashboard
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "stats": {
    "users": {
      "total": 1250,
      "active_last_30_days": 890
    },
    "leads": {
      "total": 45000,
      "consented": 42000,
      "consent_rate": 93.33
    },
    "messages": {
      "total": 125000,
      "sent": 120000,
      "failed": 5000,
      "success_rate": 96.0
    },
    "campaigns": {
      "total": 450,
      "active": 25
    }
  },
  "recent_activity": [
    {
      "id": "log_123",
      "action": "create_campaign",
      "resource": "campaign",
      "user": {
        "id": "user_456",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "ipAddress": "192.168.1.100"
    }
  ]
}
```

### Get Users (Admin)
Retrieve all users with filtering (Admin only).

```http
GET /api/admin/users?search=john&role=USER&page=1&limit=25
Authorization: Bearer {jwt_token}
```

### Update User Role (Admin)
Update a user's role (Admin only).

```http
PUT /api/admin/users/{user_id}/role
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

### Get Audit Logs (Admin)
Retrieve system audit logs (Admin only).

```http
GET /api/admin/audit-logs?resource=campaign&action=create&page=1&limit=50
Authorization: Bearer {jwt_token}
```

### Get System Health (Admin)
Check system health status (Admin only).

```http
GET /api/admin/system-health
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "database": "healthy",
  "redis": "healthy",
  "queues": {
    "message_queue": {
      "active": 5,
      "waiting": 12,
      "completed": 1250,
      "failed": 3
    }
  },
  "api_integrations": {
    "facebook": "healthy",
    "whatsapp": "healthy",
    "twilio": "healthy"
  },
  "last_checked": "2024-01-15T10:30:00Z"
}
```

## Error Handling

### Error Response Format
All API errors follow a consistent format:

```json
{
  "error": "Validation failed",
  "message": "The request data is invalid",
  "details": {
    "field": "email",
    "code": "INVALID_EMAIL",
    "message": "Please provide a valid email address"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/leads",
  "requestId": "req_123456789"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (business logic error)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Common Error Codes
- `INVALID_TOKEN` - JWT token is invalid or expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `VALIDATION_ERROR` - Request data validation failed
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `EXTERNAL_API_ERROR` - Third-party API error
- `CONSENT_REQUIRED` - User consent required for operation

## Webhooks

### WhatsApp Webhook
Receive incoming WhatsApp messages and status updates.

```http
POST /api/webhooks/whatsapp
Content-Type: application/json
```

**Request Body (Incoming Message):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "business_account_id",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "+1234567890",
              "phone_number_id": "phone_number_id"
            },
            "messages": [
              {
                "from": "+1987654321",
                "id": "message_id",
                "timestamp": "1642186741",
                "text": {
                  "body": "Hello, I'm interested in your services"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Facebook Webhook
Receive Facebook Page events and messages.

```http
POST /api/webhooks/facebook
Content-Type: application/json
```

## SDK Examples

### JavaScript/Node.js
```javascript
const ControlsTools = require('@controls-tools/sdk');

const client = new ControlsTools({
  apiKey: 'ct_live_1234567890abcdef...',
  baseUrl: 'https://api.controlstools.com'
});

// Create a new lead
const lead = await client.leads.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phoneNumber: '+1234567890',
  source: 'FACEBOOK_COMMENT',
  consentGiven: true
});

// Start a campaign
const campaign = await client.campaigns.start('campaign_123');

// Send WhatsApp message
const message = await client.whatsapp.sendMessage('number_123', {
  recipient: '+1987654321',
  templateId: 'welcome_template',
  parameters: ['John', 'Premium Package']
});
```

### Python
```python
from controls_tools import ControlsToolsClient

client = ControlsToolsClient(
    api_key='ct_live_1234567890abcdef...',
    base_url='https://api.controlstools.com'
)

# Create a new lead
lead = client.leads.create({
    'firstName': 'John',
    'lastName': 'Doe',
    'email': 'john@example.com',
    'phoneNumber': '+1234567890',
    'source': 'FACEBOOK_COMMENT',
    'consentGiven': True
})

# Export leads
export_data = client.leads.export({
    'format': 'csv',
    'filters': {
        'consent_only': True,
        'status': 'NEW'
    }
})
```

### cURL Examples
```bash
# Create a lead
curl -X POST https://api.controlstools.com/api/leads \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "source": "FACEBOOK_COMMENT",
    "consentGiven": true
  }'

# Get campaigns
curl -X GET "https://api.controlstools.com/api/campaigns?status=RUNNING" \
  -H "Authorization: Bearer your_jwt_token"

# Send WhatsApp message
curl -X POST https://api.controlstools.com/api/whatsapp/numbers/number_123/send-message \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "+1987654321",
    "templateId": "welcome_template",
    "parameters": ["John", "Premium Package"]
  }'
```

## Rate Limiting

### Limits by User Type
- **Free Users**: 100 requests per hour
- **Paid Users**: 1,000 requests per hour
- **API Keys**: 5,000 requests per hour
- **Admin Users**: 10,000 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642190400
X-RateLimit-Window: 3600
```

### Rate Limit Exceeded Response
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded your hourly rate limit",
  "details": {
    "limit": 1000,
    "window": 3600,
    "reset_at": "2024-01-15T11:00:00Z"
  }
}
```

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Facebook and WhatsApp integrations
- Lead management endpoints
- Campaign management
- User authentication and management
- Admin endpoints
- Comprehensive error handling
- Rate limiting implementation

---

For additional support or questions about the API, please contact our developer support team at api-support@controlstools.com.

