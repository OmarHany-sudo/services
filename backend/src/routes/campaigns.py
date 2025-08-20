from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import json
from src.models import Prisma
from src.utils.audit import log_action
from src.utils.queue import add_message_job, schedule_message

campaigns_bp = Blueprint('campaigns', __name__)
prisma = Prisma()

@campaigns_bp.route('/', methods=['GET'])
@jwt_required()
async def get_campaigns():
    """Get user's campaigns"""
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 25, type=int)
        status = request.args.get('status')
        campaign_type = request.args.get('type')
        
        # Build where clause
        where_clause = {'userId': user_id}
        
        if status:
            where_clause['status'] = status
        
        if campaign_type:
            where_clause['type'] = campaign_type
        
        # Get total count
        total = await prisma.campaign.count(where=where_clause)
        
        # Get campaigns with pagination
        campaigns = await prisma.campaign.find_many(
            where=where_clause,
            include={
                'messages': {
                    'select': {
                        'id': True,
                        'status': True,
                        'createdAt': True
                    }
                }
            },
            order_by={'createdAt': 'desc'},
            take=limit,
            skip=(page - 1) * limit
        )
        
        campaigns_data = []
        for campaign in campaigns:
            # Calculate message statistics
            message_stats = {
                'total': len(campaign.messages),
                'sent': len([m for m in campaign.messages if m.status == 'SENT']),
                'delivered': len([m for m in campaign.messages if m.status == 'DELIVERED']),
                'failed': len([m for m in campaign.messages if m.status == 'FAILED']),
                'pending': len([m for m in campaign.messages if m.status == 'PENDING'])
            }
            
            campaign_data = {
                'id': campaign.id,
                'name': campaign.name,
                'description': campaign.description,
                'type': campaign.type,
                'status': campaign.status,
                'scheduledAt': campaign.scheduledAt.isoformat() if campaign.scheduledAt else None,
                'startedAt': campaign.startedAt.isoformat() if campaign.startedAt else None,
                'completedAt': campaign.completedAt.isoformat() if campaign.completedAt else None,
                'targetAudience': campaign.targetAudience,
                'messageTemplate': campaign.messageTemplate,
                'messageStats': message_stats,
                'createdAt': campaign.createdAt.isoformat(),
                'updatedAt': campaign.updatedAt.isoformat()
            }
            campaigns_data.append(campaign_data)
        
        return jsonify({
            'campaigns': campaigns_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get campaigns: {str(e)}'}), 500

@campaigns_bp.route('/', methods=['POST'])
@jwt_required()
async def create_campaign():
    """Create a new campaign"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['name', 'type', 'messageTemplate', 'targetAudience']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Name, type, message template, and target audience are required'}), 400
        
        # Validate campaign type
        valid_types = ['WHATSAPP_TEMPLATE', 'MESSENGER_BROADCAST', 'FOLLOW_UP']
        if data['type'] not in valid_types:
            return jsonify({'error': f'Invalid campaign type. Must be one of: {", ".join(valid_types)}'}), 400
        
        # Validate target audience
        target_audience = data['targetAudience']
        if not isinstance(target_audience, dict):
            return jsonify({'error': 'Target audience must be an object'}), 400
        
        # Create campaign
        campaign_data = {
            'name': data['name'],
            'description': data.get('description'),
            'type': data['type'],
            'status': 'DRAFT',
            'targetAudience': target_audience,
            'messageTemplate': data['messageTemplate'],
            'userId': user_id
        }
        
        if data.get('scheduledAt'):
            try:
                scheduled_at = datetime.fromisoformat(data['scheduledAt'].replace('Z', '+00:00'))
                if scheduled_at <= datetime.utcnow():
                    return jsonify({'error': 'Scheduled time must be in the future'}), 400
                campaign_data['scheduledAt'] = scheduled_at
                campaign_data['status'] = 'SCHEDULED'
            except ValueError:
                return jsonify({'error': 'Invalid scheduled time format'}), 400
        
        campaign = await prisma.campaign.create(data=campaign_data)
        
        await log_action(
            user_id=user_id,
            action='create_campaign',
            resource='campaign',
            resource_id=campaign.id,
            details={'name': data['name'], 'type': data['type']}
        )
        
        return jsonify({
            'message': 'Campaign created successfully',
            'campaign': {
                'id': campaign.id,
                'name': campaign.name,
                'type': campaign.type,
                'status': campaign.status,
                'scheduledAt': campaign.scheduledAt.isoformat() if campaign.scheduledAt else None
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to create campaign: {str(e)}'}), 500

@campaigns_bp.route('/<campaign_id>', methods=['PUT'])
@jwt_required()
async def update_campaign(campaign_id):
    """Update a campaign"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        # Verify campaign belongs to user
        campaign = await prisma.campaign.find_unique(
            where={'id': campaign_id, 'userId': user_id}
        )
        
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Check if campaign can be updated
        if campaign.status in ['RUNNING', 'COMPLETED']:
            return jsonify({'error': 'Cannot update running or completed campaigns'}), 400
        
        # Update campaign
        update_data = {}
        updatable_fields = ['name', 'description', 'messageTemplate', 'targetAudience']
        
        for field in updatable_fields:
            if field in data:
                update_data[field] = data[field]
        
        # Handle scheduled time updates
        if 'scheduledAt' in data:
            if data['scheduledAt']:
                try:
                    scheduled_at = datetime.fromisoformat(data['scheduledAt'].replace('Z', '+00:00'))
                    if scheduled_at <= datetime.utcnow():
                        return jsonify({'error': 'Scheduled time must be in the future'}), 400
                    update_data['scheduledAt'] = scheduled_at
                    update_data['status'] = 'SCHEDULED'
                except ValueError:
                    return jsonify({'error': 'Invalid scheduled time format'}), 400
            else:
                update_data['scheduledAt'] = None
                update_data['status'] = 'DRAFT'
        
        if update_data:
            update_data['updatedAt'] = datetime.utcnow()
            updated_campaign = await prisma.campaign.update(
                where={'id': campaign_id},
                data=update_data
            )
        else:
            updated_campaign = campaign
        
        await log_action(
            user_id=user_id,
            action='update_campaign',
            resource='campaign',
            resource_id=campaign_id,
            details={'updated_fields': list(update_data.keys())}
        )
        
        return jsonify({
            'message': 'Campaign updated successfully',
            'campaign': {
                'id': updated_campaign.id,
                'name': updated_campaign.name,
                'status': updated_campaign.status,
                'scheduledAt': updated_campaign.scheduledAt.isoformat() if updated_campaign.scheduledAt else None
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to update campaign: {str(e)}'}), 500

@campaigns_bp.route('/<campaign_id>/start', methods=['POST'])
@jwt_required()
async def start_campaign(campaign_id):
    """Start a campaign immediately"""
    try:
        user_id = get_jwt_identity()
        
        # Verify campaign belongs to user
        campaign = await prisma.campaign.find_unique(
            where={'id': campaign_id, 'userId': user_id}
        )
        
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Check if campaign can be started
        if campaign.status not in ['DRAFT', 'SCHEDULED']:
            return jsonify({'error': 'Campaign cannot be started'}), 400
        
        # Get target leads based on audience criteria
        leads = await get_campaign_leads(user_id, campaign.targetAudience)
        
        if not leads:
            return jsonify({'error': 'No leads match the target audience criteria'}), 400
        
        # Update campaign status
        await prisma.campaign.update(
            where={'id': campaign_id},
            data={
                'status': 'RUNNING',
                'startedAt': datetime.utcnow(),
                'scheduledAt': None  # Clear scheduled time since we're starting now
            }
        )
        
        # Queue messages for each lead
        queued_messages = 0
        for lead in leads:
            # Check consent for the campaign type
            if campaign.type == 'WHATSAPP_TEMPLATE' and not lead.consentGiven:
                continue
            
            if campaign.type == 'MESSENGER_BROADCAST' and not (lead.consentGiven or lead.source == 'FACEBOOK_MESSAGE'):
                continue
            
            # Create message record
            message = await prisma.message.create(
                data={
                    'type': 'TEMPLATE' if campaign.type == 'WHATSAPP_TEMPLATE' else 'TEXT',
                    'platform': 'WHATSAPP' if campaign.type == 'WHATSAPP_TEMPLATE' else 'MESSENGER',
                    'recipient': lead.phoneNumber if campaign.type == 'WHATSAPP_TEMPLATE' else lead.facebookUserId,
                    'content': campaign.messageTemplate,
                    'status': 'PENDING',
                    'leadId': lead.id,
                    'campaignId': campaign_id
                }
            )
            
            # Queue message for sending
            job_data = {
                'type': 'campaign_message',
                'campaign_id': campaign_id,
                'message_id': message.id,
                'lead_id': lead.id,
                'user_id': user_id
            }
            
            await add_message_job(job_data)
            queued_messages += 1
        
        await log_action(
            user_id=user_id,
            action='start_campaign',
            resource='campaign',
            resource_id=campaign_id,
            details={'queued_messages': queued_messages}
        )
        
        return jsonify({
            'message': 'Campaign started successfully',
            'queued_messages': queued_messages
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to start campaign: {str(e)}'}), 500

@campaigns_bp.route('/<campaign_id>/pause', methods=['POST'])
@jwt_required()
async def pause_campaign(campaign_id):
    """Pause a running campaign"""
    try:
        user_id = get_jwt_identity()
        
        # Verify campaign belongs to user
        campaign = await prisma.campaign.find_unique(
            where={'id': campaign_id, 'userId': user_id}
        )
        
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Check if campaign can be paused
        if campaign.status != 'RUNNING':
            return jsonify({'error': 'Only running campaigns can be paused'}), 400
        
        # Update campaign status
        await prisma.campaign.update(
            where={'id': campaign_id},
            data={'status': 'PAUSED'}
        )
        
        await log_action(
            user_id=user_id,
            action='pause_campaign',
            resource='campaign',
            resource_id=campaign_id
        )
        
        return jsonify({'message': 'Campaign paused successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to pause campaign: {str(e)}'}), 500

@campaigns_bp.route('/<campaign_id>/resume', methods=['POST'])
@jwt_required()
async def resume_campaign(campaign_id):
    """Resume a paused campaign"""
    try:
        user_id = get_jwt_identity()
        
        # Verify campaign belongs to user
        campaign = await prisma.campaign.find_unique(
            where={'id': campaign_id, 'userId': user_id}
        )
        
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Check if campaign can be resumed
        if campaign.status != 'PAUSED':
            return jsonify({'error': 'Only paused campaigns can be resumed'}), 400
        
        # Update campaign status
        await prisma.campaign.update(
            where={'id': campaign_id},
            data={'status': 'RUNNING'}
        )
        
        await log_action(
            user_id=user_id,
            action='resume_campaign',
            resource='campaign',
            resource_id=campaign_id
        )
        
        return jsonify({'message': 'Campaign resumed successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to resume campaign: {str(e)}'}), 500

@campaigns_bp.route('/<campaign_id>/cancel', methods=['POST'])
@jwt_required()
async def cancel_campaign(campaign_id):
    """Cancel a campaign"""
    try:
        user_id = get_jwt_identity()
        
        # Verify campaign belongs to user
        campaign = await prisma.campaign.find_unique(
            where={'id': campaign_id, 'userId': user_id}
        )
        
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Check if campaign can be cancelled
        if campaign.status == 'COMPLETED':
            return jsonify({'error': 'Completed campaigns cannot be cancelled'}), 400
        
        # Update campaign status
        await prisma.campaign.update(
            where={'id': campaign_id},
            data={
                'status': 'CANCELLED',
                'completedAt': datetime.utcnow()
            }
        )
        
        # Cancel pending messages
        await prisma.message.update_many(
            where={
                'campaignId': campaign_id,
                'status': 'PENDING'
            },
            data={'status': 'FAILED', 'errorMessage': 'Campaign cancelled'}
        )
        
        await log_action(
            user_id=user_id,
            action='cancel_campaign',
            resource='campaign',
            resource_id=campaign_id
        )
        
        return jsonify({'message': 'Campaign cancelled successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to cancel campaign: {str(e)}'}), 500

@campaigns_bp.route('/<campaign_id>/preview', methods=['POST'])
@jwt_required()
async def preview_campaign(campaign_id):
    """Preview campaign audience and message count"""
    try:
        user_id = get_jwt_identity()
        
        # Verify campaign belongs to user
        campaign = await prisma.campaign.find_unique(
            where={'id': campaign_id, 'userId': user_id}
        )
        
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Get target leads based on audience criteria
        leads = await get_campaign_leads(user_id, campaign.targetAudience)
        
        # Filter leads based on consent for the campaign type
        eligible_leads = []
        for lead in leads:
            if campaign.type == 'WHATSAPP_TEMPLATE' and lead.consentGiven:
                eligible_leads.append(lead)
            elif campaign.type == 'MESSENGER_BROADCAST' and (lead.consentGiven or lead.source == 'FACEBOOK_MESSAGE'):
                eligible_leads.append(lead)
            elif campaign.type == 'FOLLOW_UP':
                eligible_leads.append(lead)
        
        # Create preview data
        preview_data = {
            'total_leads': len(leads),
            'eligible_leads': len(eligible_leads),
            'message_template': campaign.messageTemplate,
            'estimated_cost': calculate_estimated_cost(campaign.type, len(eligible_leads)),
            'leads_sample': [
                {
                    'id': lead.id,
                    'name': f"{lead.firstName or ''} {lead.lastName or ''}".strip(),
                    'email': lead.email,
                    'phoneNumber': lead.phoneNumber,
                    'source': lead.source,
                    'consentGiven': lead.consentGiven
                } for lead in eligible_leads[:10]  # Show first 10 leads
            ]
        }
        
        return jsonify(preview_data)
        
    except Exception as e:
        return jsonify({'error': f'Failed to preview campaign: {str(e)}'}), 500

async def get_campaign_leads(user_id, target_audience):
    """Get leads based on target audience criteria"""
    where_clause = {'userId': user_id}
    
    # Apply audience filters
    if target_audience.get('status'):
        where_clause['status'] = {'in': target_audience['status']}
    
    if target_audience.get('source'):
        where_clause['source'] = {'in': target_audience['source']}
    
    if target_audience.get('tags'):
        where_clause['tags'] = {
            'some': {
                'tagId': {'in': target_audience['tags']}
            }
        }
    
    if target_audience.get('consent_only'):
        where_clause['consentGiven'] = True
    
    if target_audience.get('date_range'):
        date_range = target_audience['date_range']
        if date_range.get('start'):
            where_clause['createdAt'] = {'gte': datetime.fromisoformat(date_range['start'])}
        if date_range.get('end'):
            if 'createdAt' not in where_clause:
                where_clause['createdAt'] = {}
            where_clause['createdAt']['lte'] = datetime.fromisoformat(date_range['end'])
    
    leads = await prisma.lead.find_many(
        where=where_clause,
        include={'tags': True}
    )
    
    return leads

def calculate_estimated_cost(campaign_type, lead_count):
    """Calculate estimated cost for campaign"""
    # These are example rates - adjust based on actual pricing
    rates = {
        'WHATSAPP_TEMPLATE': 0.05,  # $0.05 per template message
        'MESSENGER_BROADCAST': 0.01,  # $0.01 per messenger message
        'FOLLOW_UP': 0.02  # $0.02 per follow-up message
    }
    
    rate = rates.get(campaign_type, 0)
    return round(rate * lead_count, 2)

