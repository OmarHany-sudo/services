from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import csv
import io
import os
from datetime import datetime, timedelta
from src.models import Prisma
from src.utils.audit import log_action

leads_bp = Blueprint('leads', __name__)
prisma = Prisma()

@leads_bp.route('/', methods=['GET'])
@jwt_required()
async def get_leads():
    """Get leads with filtering and pagination"""
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 25, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status')
        source = request.args.get('source')
        tag_ids = request.args.getlist('tags')
        consent_only = request.args.get('consent_only', 'false').lower() == 'true'
        
        # Build where clause
        where_clause = {'userId': user_id}
        
        if search:
            where_clause['OR'] = [
                {'firstName': {'contains': search, 'mode': 'insensitive'}},
                {'lastName': {'contains': search, 'mode': 'insensitive'}},
                {'email': {'contains': search, 'mode': 'insensitive'}},
                {'phoneNumber': {'contains': search}}
            ]
        
        if status:
            where_clause['status'] = status
        
        if source:
            where_clause['source'] = source
        
        if consent_only:
            where_clause['consentGiven'] = True
        
        if tag_ids:
            where_clause['tags'] = {
                'some': {
                    'tagId': {'in': tag_ids}
                }
            }
        
        # Get total count
        total = await prisma.lead.count(where=where_clause)
        
        # Get leads with pagination
        leads = await prisma.lead.find_many(
            where=where_clause,
            include={
                'tags': {
                    'include': {'tag': True}
                },
                'facebookPage': True,
                'messages': {
                    'take': 1,
                    'order_by': {'createdAt': 'desc'}
                }
            },
            order_by={'createdAt': 'desc'},
            take=limit,
            skip=(page - 1) * limit
        )
        
        leads_data = []
        for lead in leads:
            lead_data = {
                'id': lead.id,
                'firstName': lead.firstName,
                'lastName': lead.lastName,
                'email': lead.email,
                'phoneNumber': lead.phoneNumber,
                'facebookUserId': lead.facebookUserId,
                'source': lead.source,
                'status': lead.status,
                'consentGiven': lead.consentGiven,
                'consentTimestamp': lead.consentTimestamp.isoformat() if lead.consentTimestamp else None,
                'consentType': lead.consentType,
                'lastInteraction': lead.lastInteraction.isoformat() if lead.lastInteraction else None,
                'createdAt': lead.createdAt.isoformat(),
                'updatedAt': lead.updatedAt.isoformat(),
                'tags': [
                    {
                        'id': tag.tag.id,
                        'name': tag.tag.name,
                        'color': tag.tag.color
                    } for tag in lead.tags
                ],
                'facebookPage': {
                    'id': lead.facebookPage.id,
                    'name': lead.facebookPage.name
                } if lead.facebookPage else None,
                'lastMessage': {
                    'content': lead.messages[0].content,
                    'createdAt': lead.messages[0].createdAt.isoformat(),
                    'platform': lead.messages[0].platform
                } if lead.messages else None
            }
            leads_data.append(lead_data)
        
        return jsonify({
            'leads': leads_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get leads: {str(e)}'}), 500

@leads_bp.route('/', methods=['POST'])
@jwt_required()
async def create_lead():
    """Create a new lead"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        # Validate required fields based on source
        source = data.get('source', 'MANUAL')
        if source == 'WEB_FORM' and not data.get('consentGiven'):
            return jsonify({'error': 'Consent is required for web form submissions'}), 400
        
        # Check for duplicate leads
        duplicate_conditions = []
        if data.get('email'):
            duplicate_conditions.append({'email': data['email']})
        if data.get('phoneNumber'):
            duplicate_conditions.append({'phoneNumber': data['phoneNumber']})
        if data.get('facebookUserId'):
            duplicate_conditions.append({'facebookUserId': data['facebookUserId']})
        
        if duplicate_conditions:
            existing_lead = await prisma.lead.find_first(
                where={
                    'userId': user_id,
                    'OR': duplicate_conditions
                }
            )
            
            if existing_lead:
                return jsonify({'error': 'Lead with this email, phone, or Facebook ID already exists'}), 409
        
        # Create lead
        lead_data = {
            'firstName': data.get('firstName'),
            'lastName': data.get('lastName'),
            'email': data.get('email'),
            'phoneNumber': data.get('phoneNumber'),
            'facebookUserId': data.get('facebookUserId'),
            'source': source,
            'status': data.get('status', 'NEW'),
            'consentGiven': data.get('consentGiven', False),
            'consentType': data.get('consentType'),
            'userId': user_id
        }
        
        if data.get('consentGiven'):
            lead_data['consentTimestamp'] = datetime.utcnow()
        
        if data.get('facebookPageId'):
            lead_data['facebookPageId'] = data['facebookPageId']
        
        lead = await prisma.lead.create(data=lead_data)
        
        # Add tags if provided
        if data.get('tagIds'):
            for tag_id in data['tagIds']:
                await prisma.leadtag.create(
                    data={
                        'leadId': lead.id,
                        'tagId': tag_id
                    }
                )
        
        await log_action(
            user_id=user_id,
            action='create_lead',
            resource='lead',
            resource_id=lead.id,
            details={'source': source, 'consent_given': data.get('consentGiven', False)}
        )
        
        return jsonify({
            'message': 'Lead created successfully',
            'lead': {
                'id': lead.id,
                'firstName': lead.firstName,
                'lastName': lead.lastName,
                'email': lead.email,
                'phoneNumber': lead.phoneNumber,
                'source': lead.source,
                'status': lead.status,
                'consentGiven': lead.consentGiven
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to create lead: {str(e)}'}), 500

@leads_bp.route('/<lead_id>', methods=['PUT'])
@jwt_required()
async def update_lead(lead_id):
    """Update a lead"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        # Verify lead belongs to user
        lead = await prisma.lead.find_unique(
            where={'id': lead_id, 'userId': user_id}
        )
        
        if not lead:
            return jsonify({'error': 'Lead not found'}), 404
        
        # Update lead
        update_data = {}
        updatable_fields = ['firstName', 'lastName', 'email', 'phoneNumber', 'status']
        
        for field in updatable_fields:
            if field in data:
                update_data[field] = data[field]
        
        # Handle consent updates
        if 'consentGiven' in data:
            update_data['consentGiven'] = data['consentGiven']
            if data['consentGiven'] and not lead.consentTimestamp:
                update_data['consentTimestamp'] = datetime.utcnow()
                update_data['consentType'] = data.get('consentType', 'EXPLICIT_OPTIN')
        
        if update_data:
            update_data['updatedAt'] = datetime.utcnow()
            updated_lead = await prisma.lead.update(
                where={'id': lead_id},
                data=update_data
            )
        else:
            updated_lead = lead
        
        await log_action(
            user_id=user_id,
            action='update_lead',
            resource='lead',
            resource_id=lead_id,
            details={'updated_fields': list(update_data.keys())}
        )
        
        return jsonify({
            'message': 'Lead updated successfully',
            'lead': {
                'id': updated_lead.id,
                'firstName': updated_lead.firstName,
                'lastName': updated_lead.lastName,
                'email': updated_lead.email,
                'phoneNumber': updated_lead.phoneNumber,
                'status': updated_lead.status,
                'consentGiven': updated_lead.consentGiven
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to update lead: {str(e)}'}), 500

@leads_bp.route('/<lead_id>/tags', methods=['POST'])
@jwt_required()
async def add_lead_tags(lead_id):
    """Add tags to a lead"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('tagIds'):
            return jsonify({'error': 'Tag IDs are required'}), 400
        
        # Verify lead belongs to user
        lead = await prisma.lead.find_unique(
            where={'id': lead_id, 'userId': user_id}
        )
        
        if not lead:
            return jsonify({'error': 'Lead not found'}), 404
        
        # Add tags
        added_tags = []
        for tag_id in data['tagIds']:
            # Check if tag already exists
            existing = await prisma.leadtag.find_unique(
                where={
                    'leadId_tagId': {
                        'leadId': lead_id,
                        'tagId': tag_id
                    }
                }
            )
            
            if not existing:
                await prisma.leadtag.create(
                    data={
                        'leadId': lead_id,
                        'tagId': tag_id
                    }
                )
                added_tags.append(tag_id)
        
        await log_action(
            user_id=user_id,
            action='add_lead_tags',
            resource='lead',
            resource_id=lead_id,
            details={'added_tags': added_tags}
        )
        
        return jsonify({
            'message': f'Added {len(added_tags)} tags to lead',
            'added_tags': added_tags
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to add tags: {str(e)}'}), 500

@leads_bp.route('/<lead_id>/tags/<tag_id>', methods=['DELETE'])
@jwt_required()
async def remove_lead_tag(lead_id, tag_id):
    """Remove a tag from a lead"""
    try:
        user_id = get_jwt_identity()
        
        # Verify lead belongs to user
        lead = await prisma.lead.find_unique(
            where={'id': lead_id, 'userId': user_id}
        )
        
        if not lead:
            return jsonify({'error': 'Lead not found'}), 404
        
        # Remove tag
        await prisma.leadtag.delete(
            where={
                'leadId_tagId': {
                    'leadId': lead_id,
                    'tagId': tag_id
                }
            }
        )
        
        await log_action(
            user_id=user_id,
            action='remove_lead_tag',
            resource='lead',
            resource_id=lead_id,
            details={'removed_tag': tag_id}
        )
        
        return jsonify({'message': 'Tag removed from lead'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to remove tag: {str(e)}'}), 500

@leads_bp.route('/export', methods=['POST'])
@jwt_required()
async def export_leads():
    """Export leads to CSV"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        # Build where clause (same as get_leads)
        where_clause = {'userId': user_id}
        
        if data.get('search'):
            where_clause['OR'] = [
                {'firstName': {'contains': data['search'], 'mode': 'insensitive'}},
                {'lastName': {'contains': data['search'], 'mode': 'insensitive'}},
                {'email': {'contains': data['search'], 'mode': 'insensitive'}},
                {'phoneNumber': {'contains': data['search']}}
            ]
        
        if data.get('status'):
            where_clause['status'] = data['status']
        
        if data.get('source'):
            where_clause['source'] = data['source']
        
        if data.get('consent_only'):
            where_clause['consentGiven'] = True
        
        if data.get('tag_ids'):
            where_clause['tags'] = {
                'some': {
                    'tagId': {'in': data['tag_ids']}
                }
            }
        
        # Get leads for export
        leads = await prisma.lead.find_many(
            where=where_clause,
            include={
                'tags': {
                    'include': {'tag': True}
                },
                'facebookPage': True
            },
            order_by={'createdAt': 'desc'}
        )
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        headers = [
            'ID', 'First Name', 'Last Name', 'Email', 'Phone Number',
            'Facebook User ID', 'Source', 'Status', 'Consent Given',
            'Consent Timestamp', 'Consent Type', 'Tags', 'Facebook Page',
            'Last Interaction', 'Created At', 'Updated At'
        ]
        writer.writerow(headers)
        
        # Write data
        for lead in leads:
            tags = ', '.join([tag.tag.name for tag in lead.tags])
            facebook_page = lead.facebookPage.name if lead.facebookPage else ''
            
            row = [
                lead.id,
                lead.firstName or '',
                lead.lastName or '',
                lead.email or '',
                lead.phoneNumber or '',
                lead.facebookUserId or '',
                lead.source,
                lead.status,
                'Yes' if lead.consentGiven else 'No',
                lead.consentTimestamp.isoformat() if lead.consentTimestamp else '',
                lead.consentType or '',
                tags,
                facebook_page,
                lead.lastInteraction.isoformat() if lead.lastInteraction else '',
                lead.createdAt.isoformat(),
                lead.updatedAt.isoformat()
            ]
            writer.writerow(row)
        
        # Create file response
        output.seek(0)
        csv_data = output.getvalue()
        output.close()
        
        # Create a BytesIO object for the response
        csv_buffer = io.BytesIO()
        csv_buffer.write(csv_data.encode('utf-8'))
        csv_buffer.seek(0)
        
        await log_action(
            user_id=user_id,
            action='export_leads',
            resource='lead',
            details={'exported_count': len(leads)}
        )
        
        return send_file(
            csv_buffer,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'leads_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )
        
    except Exception as e:
        return jsonify({'error': f'Failed to export leads: {str(e)}'}), 500

@leads_bp.route('/tags', methods=['GET'])
@jwt_required()
async def get_tags():
    """Get all available tags"""
    try:
        tags = await prisma.tag.find_many(
            order_by={'name': 'asc'}
        )
        
        tags_data = [
            {
                'id': tag.id,
                'name': tag.name,
                'color': tag.color,
                'createdAt': tag.createdAt.isoformat()
            } for tag in tags
        ]
        
        return jsonify({'tags': tags_data})
        
    except Exception as e:
        return jsonify({'error': f'Failed to get tags: {str(e)}'}), 500

@leads_bp.route('/tags', methods=['POST'])
@jwt_required()
async def create_tag():
    """Create a new tag"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'error': 'Tag name is required'}), 400
        
        # Check if tag already exists
        existing_tag = await prisma.tag.find_unique(
            where={'name': data['name']}
        )
        
        if existing_tag:
            return jsonify({'error': 'Tag with this name already exists'}), 409
        
        # Create tag
        tag = await prisma.tag.create(
            data={
                'name': data['name'],
                'color': data.get('color', '#3B82F6')  # Default blue color
            }
        )
        
        await log_action(
            user_id=user_id,
            action='create_tag',
            resource='tag',
            resource_id=tag.id,
            details={'name': data['name']}
        )
        
        return jsonify({
            'message': 'Tag created successfully',
            'tag': {
                'id': tag.id,
                'name': tag.name,
                'color': tag.color
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to create tag: {str(e)}'}), 500

