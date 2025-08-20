# Controls Tools User Guide

Welcome to Controls Tools, the consent-first social media marketing platform that helps you ethically grow your business while respecting user privacy and maintaining full compliance with data protection regulations.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Lead Management](#lead-management)
4. [Campaign Management](#campaign-management)
5. [Facebook Integration](#facebook-integration)
6. [WhatsApp Business](#whatsapp-business)
7. [Settings & Configuration](#settings--configuration)
8. [Admin Features](#admin-features)
9. [Compliance & Privacy](#compliance--privacy)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Getting Started

### First Login

1. **Access the Platform**: Navigate to your Controls Tools instance (e.g., https://app.controlstools.com)
2. **Facebook Authentication**: Click "Continue with Facebook" to authenticate using your Facebook account
3. **Grant Permissions**: Authorize the necessary permissions for page management and messaging
4. **Complete Setup**: Follow the onboarding wizard to configure your initial settings

### Initial Configuration

After your first login, you'll need to:

1. **Connect Facebook Pages**: Link your business Facebook Pages
2. **Set Up WhatsApp**: Add your WhatsApp Business numbers
3. **Configure Notifications**: Set your notification preferences
4. **Review Privacy Settings**: Ensure compliance settings match your requirements

## Dashboard Overview

The dashboard provides a comprehensive overview of your marketing activities and key metrics.

### Key Metrics Cards

- **Total Leads**: Shows the total number of leads in your database
- **Consented Leads**: Displays leads who have given explicit consent (with consent rate percentage)
- **Messages Sent**: Total messages sent across all channels with success rate
- **Active Campaigns**: Currently running campaigns out of total campaigns

### Quick Actions

- **Facebook Pages**: Manage your connected Facebook Pages
- **WhatsApp Business**: Manage your WhatsApp Business numbers
- **Lead Management**: Access your lead database

### Recent Activity

View the latest actions performed in your account, including:
- Campaign launches and completions
- Lead imports and updates
- System events and notifications

### System Status

Monitor the health of platform integrations:
- Database connectivity
- Message queue status
- Facebook API connection
- WhatsApp API connection

## Lead Management

The lead management system is the heart of Controls Tools, designed with consent-first principles.

### Viewing Leads

1. **Navigate to Leads**: Click "Leads" in the sidebar
2. **Browse Your Database**: View all leads in a comprehensive table format
3. **Use Filters**: Apply filters to find specific leads:
   - Search by name, email, or phone number
   - Filter by status (New, Contacted, Qualified, Converted, Unsubscribed)
   - Filter by source (Facebook Comment, Like, Message, etc.)
   - Show only consented leads

### Lead Information

Each lead displays:
- **Contact Information**: Name, email, phone number
- **Source**: How the lead was acquired
- **Status**: Current stage in your sales funnel
- **Consent Status**: Whether explicit consent has been given
- **Tags**: Custom labels for organization
- **Creation Date**: When the lead was first captured

### Adding Leads

#### Manual Entry
1. Click "Add Lead" button
2. Fill in the lead information form:
   - First Name and Last Name
   - Email Address
   - Phone Number (with country code)
   - Source of the lead
   - Consent status (required)
3. Add custom fields and tags as needed
4. Click "Add Lead" to save

#### Import from Facebook
1. Go to Facebook integration page
2. Select a Facebook Page
3. Click "Import" to collect commenters and likers
4. Review and approve leads before adding to database

### Managing Leads

#### Updating Lead Status
1. Click on a lead to view details
2. Change the status dropdown:
   - **New**: Recently acquired lead
   - **Contacted**: Initial contact made
   - **Qualified**: Meets your criteria
   - **Converted**: Became a customer
   - **Unsubscribed**: Opted out of communications

#### Adding Tags
1. Click on the tags field for any lead
2. Add existing tags or create new ones
3. Use tags for segmentation and organization

#### Custom Fields
Add custom information to leads:
- Company name
- Budget range
- Interests
- Notes and comments

### Exporting Leads

1. Click "Export" button
2. Choose export format (CSV or XLSX)
3. Apply filters to export specific segments
4. Select fields to include in export
5. Download the generated file

**Note**: Only leads with proper consent will be included in exports to ensure compliance.

## Campaign Management

Create and manage messaging campaigns across Facebook Messenger and WhatsApp.

### Campaign Types

- **WhatsApp Template**: Use pre-approved WhatsApp message templates
- **Messenger Broadcast**: Send messages via Facebook Messenger
- **Follow Up**: Automated follow-up sequences

### Creating a Campaign

1. **Navigate to Campaigns**: Click "Campaigns" in the sidebar
2. **Click "Create Campaign"**
3. **Fill Campaign Details**:
   - Campaign Name
   - Description
   - Campaign Type
   - Message Template or Custom Message
4. **Define Audience**:
   - Select lead status filters
   - Choose tags to include/exclude
   - Set consent requirements
5. **Schedule or Start**:
   - Start immediately
   - Schedule for later
   - Set up recurring campaigns

### Campaign Management

#### Starting Campaigns
- Draft campaigns can be started immediately
- Scheduled campaigns will start automatically at the set time
- Preview campaigns before starting to see recipient count and estimated costs

#### Monitoring Performance
- View real-time delivery statistics
- Track message success rates
- Monitor engagement metrics
- Analyze conversion rates

#### Pausing and Stopping
- **Pause**: Temporarily stop a campaign (can be resumed)
- **Cancel**: Permanently stop a campaign (cannot be resumed)

### Campaign Analytics

Track key metrics for each campaign:
- **Total Messages**: Number of messages in the campaign
- **Sent**: Successfully sent messages
- **Delivered**: Messages delivered to recipients
- **Failed**: Messages that failed to send
- **Success Rate**: Percentage of successful deliveries

## Facebook Integration

Connect and manage your Facebook Pages to collect leads and send messages.

### Connecting Facebook Pages

1. **Navigate to Facebook**: Click "Facebook" in the sidebar
2. **Authenticate**: If not already connected, authenticate with Facebook
3. **Select Pages**: Choose which pages to connect
4. **Grant Permissions**: Authorize necessary permissions for:
   - Reading page posts and comments
   - Sending messages
   - Accessing page insights

### Managing Facebook Pages

#### Page Status
- **Active**: Page is connected and functional
- **Inactive**: Page connection has issues

#### Available Actions
- **View Posts**: See recent posts and their engagement
- **Import**: Collect commenters and likers as leads
- **Message**: Send direct messages to users

### Importing Leads from Facebook

1. **Select a Page**: Choose the Facebook Page
2. **View Posts**: Browse recent posts with engagement
3. **Import Engagement**: Click "Import" on posts with comments/likes
4. **Review Leads**: Check imported leads before adding to database
5. **Consent Verification**: Ensure proper consent before messaging

### Sending Facebook Messages

1. **Select Page**: Choose which page to send from
2. **Enter Recipient**: Provide Facebook User ID
3. **Compose Message**: Write your message
4. **Send**: Deliver the message

**Important**: Only users who have messaged your page or given explicit consent can receive messages.

### Compliance Notes

- Only public engagement data is collected
- Users must have interacted with your page
- Explicit consent required for messaging
- All activities are logged for audit purposes

## WhatsApp Business

Manage WhatsApp Business numbers and send template-based messages.

### Adding WhatsApp Numbers

1. **Navigate to WhatsApp**: Click "WhatsApp" in the sidebar
2. **Click "Add Number"**
3. **Enter Details**:
   - Phone Number (with country code)
   - Display Name for your business
   - Webhook URL for receiving messages
4. **Verify Number**: Complete the verification process
5. **Activate**: Once verified, the number becomes active

### WhatsApp Number Management

#### Number Status
- **Pending**: Verification in progress
- **Verified**: Number is verified but not active
- **Active**: Ready to send and receive messages
- **Failed**: Verification failed

#### Number Actions
- **Verify**: Start or retry verification process
- **Send**: Send messages using this number
- **View Stats**: See message statistics

### Message Templates

WhatsApp requires pre-approved templates for marketing messages.

#### Viewing Templates
1. Click "Templates" button
2. Browse available templates
3. Check approval status:
   - **Approved**: Ready to use
   - **Pending**: Under review by WhatsApp
   - **Rejected**: Not approved for use

#### Using Templates
1. Select a WhatsApp number
2. Click "Send" to compose a message
3. Choose a template from the dropdown
4. Fill in template parameters
5. Enter recipient phone number
6. Send the message

### Sending WhatsApp Messages

#### Template Messages
1. **Select Number**: Choose sending number
2. **Choose Template**: Select approved template
3. **Fill Parameters**: Complete template variables
4. **Enter Recipient**: Phone number with country code
5. **Send**: Deliver the message

#### Free-form Messages
- Only available within 24 hours of user interaction
- Can be used for customer service responses
- No template required

### WhatsApp Compliance

- All marketing messages require approved templates
- Users must opt-in to receive messages
- 24-hour window for free-form responses
- Comprehensive logging for audit purposes

## Settings & Configuration

Customize your Controls Tools experience and manage account settings.

### Profile Information

Update your personal details:
- **Full Name**: Your display name
- **Email Address**: Contact email
- **Timezone**: For scheduling and reporting
- **Language**: Interface language preference

### Notification Preferences

Control what notifications you receive:
- **Email Notifications**: General email alerts
- **Campaign Updates**: Campaign status changes
- **Lead Notifications**: New lead alerts
- **System Alerts**: Important system notifications

### API Key Management

Generate API keys for programmatic access:

#### Creating API Keys
1. Click "Create API Key"
2. Enter a descriptive name
3. Set permissions (read/write access)
4. Set expiration date (optional)
5. Save the generated key securely

#### Managing API Keys
- View all active keys
- Check last usage dates
- Deactivate or delete keys
- Monitor key permissions

### Privacy & Data Management

#### Data Export
- Download all your data in JSON format
- Includes leads, campaigns, and settings
- GDPR compliance feature

#### Account Deletion
- Permanently delete your account
- Removes all associated data
- Cannot be undone

## Admin Features

*Available only to users with Admin role*

### Admin Dashboard

Comprehensive platform overview including:
- Total users and activity metrics
- System-wide lead and message statistics
- Platform health monitoring
- Recent activity across all users

### User Management

#### Viewing Users
- Browse all platform users
- Search by name or email
- Filter by user role
- View user statistics

#### Managing User Roles
- Change user roles (User/Admin)
- Monitor user activity
- View user creation dates

### Audit Logs

Complete activity tracking:
- All user actions logged
- System events recorded
- Searchable by user, action, or resource
- Exportable for compliance

### System Health Monitoring

Real-time system status:
- Database connectivity
- Redis cache status
- External API health
- Message queue statistics

### API Key Administration

Platform-wide API key management:
- View all API keys
- Monitor usage patterns
- Revoke keys if needed
- Set platform-wide limits

## Compliance & Privacy

Controls Tools is built with privacy-first principles and comprehensive compliance features.

### GDPR Compliance

#### Data Subject Rights
- **Right to Access**: Users can export their data
- **Right to Rectification**: Data can be updated
- **Right to Erasure**: Complete data deletion available
- **Right to Portability**: Data export in standard formats

#### Consent Management
- Explicit consent required for all data collection
- Consent status tracked for every lead
- Consent can be withdrawn at any time
- Audit trail of all consent changes

#### Data Processing
- Lawful basis documented for all processing
- Data minimization principles applied
- Purpose limitation enforced
- Storage limitation with retention policies

### CCPA Compliance

- Consumer rights respected
- Opt-out mechanisms provided
- Data sale restrictions enforced
- Transparency in data practices

### Security Measures

#### Data Protection
- AES-GCM encryption for sensitive data
- TLS 1.3 for data in transit
- Secure key management
- Regular security audits

#### Access Control
- Role-based permissions
- Multi-factor authentication support
- Session management
- API key security

#### Audit & Monitoring
- Comprehensive activity logging
- Real-time security monitoring
- Anomaly detection
- Incident response procedures

## Best Practices

### Lead Management Best Practices

1. **Always Obtain Consent**
   - Never add leads without explicit consent
   - Document consent method and date
   - Provide easy opt-out mechanisms

2. **Keep Data Clean**
   - Regularly update lead information
   - Remove invalid email addresses
   - Maintain accurate phone numbers

3. **Use Proper Segmentation**
   - Tag leads appropriately
   - Create meaningful segments
   - Personalize communications

4. **Respect Communication Preferences**
   - Honor unsubscribe requests immediately
   - Respect frequency preferences
   - Use appropriate channels

### Campaign Best Practices

1. **Plan Your Campaigns**
   - Define clear objectives
   - Identify target audience
   - Create compelling messages

2. **Test Before Sending**
   - Use preview functionality
   - Test with small segments first
   - Monitor delivery rates

3. **Monitor Performance**
   - Track key metrics
   - Analyze engagement rates
   - Optimize based on results

4. **Maintain Compliance**
   - Only message consented leads
   - Include opt-out instructions
   - Follow platform policies

### Facebook Integration Best Practices

1. **Respect Platform Policies**
   - Follow Facebook's terms of service
   - Don't spam users
   - Provide value in interactions

2. **Engage Authentically**
   - Respond to comments genuinely
   - Build relationships, not just collect leads
   - Provide helpful information

3. **Monitor Page Performance**
   - Track engagement metrics
   - Respond promptly to messages
   - Maintain active presence

### WhatsApp Best Practices

1. **Use Approved Templates**
   - Only use WhatsApp-approved templates
   - Keep templates relevant and valuable
   - Update templates regularly

2. **Respect User Preferences**
   - Don't over-message users
   - Provide opt-out options
   - Use appropriate timing

3. **Maintain Professional Tone**
   - Use business-appropriate language
   - Be clear and concise
   - Provide helpful information

## Troubleshooting

### Common Issues and Solutions

#### Login Problems

**Issue**: Cannot log in with Facebook
**Solutions**:
1. Clear browser cache and cookies
2. Check Facebook app permissions
3. Try incognito/private browsing mode
4. Contact support if issues persist

**Issue**: "Access Denied" error
**Solutions**:
1. Ensure you have necessary Facebook permissions
2. Check if your Facebook account is verified
3. Verify you're an admin of the pages you're trying to connect

#### Facebook Integration Issues

**Issue**: Cannot connect Facebook Pages
**Solutions**:
1. Verify you're an admin of the page
2. Check page permissions in Facebook
3. Re-authenticate your Facebook connection
4. Ensure page is published and active

**Issue**: Cannot import leads from Facebook
**Solutions**:
1. Check page permissions
2. Verify posts have public engagement
3. Ensure you have necessary API permissions
4. Try refreshing page connection

#### WhatsApp Integration Issues

**Issue**: WhatsApp number verification fails
**Solutions**:
1. Ensure phone number is correct
2. Check WhatsApp Business API setup
3. Verify webhook URL is accessible
4. Contact WhatsApp support if needed

**Issue**: Cannot send WhatsApp messages
**Solutions**:
1. Verify number is active and verified
2. Check template approval status
3. Ensure recipient has opted in
4. Verify message format matches template

#### Campaign Issues

**Issue**: Campaign not sending messages
**Solutions**:
1. Check campaign status and schedule
2. Verify audience has consented leads
3. Check message template approval
4. Review campaign configuration

**Issue**: Low message delivery rates
**Solutions**:
1. Verify contact information accuracy
2. Check for blocked or invalid numbers
3. Review message content for compliance
4. Monitor for spam filtering

#### Performance Issues

**Issue**: Slow page loading
**Solutions**:
1. Check internet connection
2. Clear browser cache
3. Try different browser
4. Contact support for server issues

**Issue**: Data not updating
**Solutions**:
1. Refresh the page
2. Check for browser JavaScript errors
3. Verify API connectivity
4. Contact support if issues persist

### Getting Help

#### Self-Service Resources
- **Documentation**: Comprehensive guides and API docs
- **FAQ**: Common questions and answers
- **Video Tutorials**: Step-by-step walkthroughs
- **Community Forum**: User discussions and tips

#### Support Channels
- **Email Support**: support@controlstools.com
- **Live Chat**: Available during business hours
- **Phone Support**: For enterprise customers
- **Emergency Support**: For critical issues

#### Reporting Issues
When reporting issues, please include:
1. Detailed description of the problem
2. Steps to reproduce the issue
3. Browser and operating system information
4. Screenshots or error messages
5. Account information (without passwords)

---

**Need Additional Help?**

If you can't find the answer to your question in this guide, please don't hesitate to contact our support team. We're here to help you succeed with Controls Tools while maintaining the highest standards of privacy and compliance.

For the latest updates and announcements, follow us on our social media channels or subscribe to our newsletter through your account settings.

