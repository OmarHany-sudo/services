from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import hashlib
from src.models import Prisma
from src.utils.audit import log_action, get_audit_logs
from src.utils.security import generate_api_key, hash_api_key
from src.utils.queue import get_queue_stats

admin_bp = Blueprint('admin', __name__)
prisma = Prisma()

def require_admin():
    """Decorator to require admin role"""
    def decorator(f):
        async def decorated_function(*args, **kwargs):
            user_id = get_jwt_identity()
            user = await prisma.user.find_unique(where={'id': user_id})
            
            if not user or user.role != 'ADMIN':
                return jsonify({'error': 'Admin access required'}), 403
            
            return await f(*args, **kwargs)
        return decorated_function
    return decorator

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@require_admin()
async def get_admin_dashboard():
    """Get admin dashboard statistics"""
    try:
        user_id = get_jwt_identity()
        
        # Get various statistics
        stats = {}
        
        # User statistics
        total_users = await prisma.user.count()
        active_users = await prisma.user.count(
            where={
                'updatedAt': {
                    'gte': datetime.utcnow() - timedelta(days=30)
                }
            }
        )
        stats['users'] = {
            'total': total_users,
            'active_last_30_days': active_users
        }
        
        # Lead statistics
        total_leads = await prisma.lead.count()
        consented_leads = await prisma.lead.count(where={'consentGiven': True})
        stats['leads'] = {
            'total': total_leads,
            'consented': consented_leads,
            'consent_rate': round((consented_leads / total_leads * 100) if total_leads > 0 else 0, 2)
        }
        
        # Message statistics
        total_messages = await prisma.message.count()
        sent_messages = await prisma.message.count(where={'status': 'SENT'})
        failed_messages = await prisma.message.count(where={'status': 'FAILED'})
        stats['messages'] = {
            'total': total_messages,
            'sent': sent_messages,
            'failed': failed_messages,
            'success_rate': round((sent_messages / total_messages * 100) if total_messages > 0 else 0, 2)
        }
        
        # Campaign statistics
        total_campaigns = await prisma.campaign.count()
        active_campaigns = await prisma.campaign.count(
            where={'status': {'in': ['RUNNING', 'SCHEDULED']}}
        )
        stats['campaigns'] = {
            'total': total_campaigns,
            'active': active_campaigns
        }
        
        # Facebook Pages statistics
        total_pages = await prisma.facebookpage.count()
        active_pages = await prisma.facebookpage.count(where={'isActive': True})
        stats['facebook_pages'] = {
            'total': total_pages,
            'active': active_pages
        }
        
        # WhatsApp Numbers statistics
        total_numbers = await prisma.whatsappnumber.count()
        active_numbers = await prisma.whatsappnumber.count(where={'isActive': True})
        stats['whatsapp_numbers'] = {
            'total': total_numbers,
            'active': active_numbers
        }
        
        # Queue statistics
        queue_stats = get_queue_stats()
        stats['queues'] = queue_stats
        
        # Recent activity (last 24 hours)
        recent_activity = await get_audit_logs(
            limit=10,
            offset=0
        )
        
        activity_data = [
            {
                'id': log.id,
                'action': log.action,
                'resource': log.resource,
                'user': {
                    'id': log.user.id if log.user else None,
                    'name': log.user.name if log.user else 'System',
                    'email': log.user.email if log.user else None
                },
                'createdAt': log.createdAt.isoformat(),
                'ipAddress': log.ipAddress
            } for log in recent_activity
        ]
        
        await log_action(
            user_id=user_id,
            action='view_admin_dashboard',
            resource='admin',
            details={'stats_requested': True}
        )
        
        return jsonify({
            'stats': stats,
            'recent_activity': activity_data
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get dashboard data: {str(e)}'}), 500

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@require_admin()
async def get_users():
    """Get all users with pagination"""
    try:
        user_id = get_jwt_identity()
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 25, type=int)
        search = request.args.get('search', '')
        role = request.args.get('role')
        
        # Build where clause
        where_clause = {}
        
        if search:
            where_clause['OR'] = [
                {'name': {'contains': search, 'mode': 'insensitive'}},
                {'email': {'contains': search, 'mode': 'insensitive'}}
            ]
        
        if role:
            where_clause['role'] = role
        
        # Get total count
        total = await prisma.user.count(where=where_clause)
        
        # Get users with pagination
        users = await prisma.user.find_many(
            where=where_clause,
            include={
                'facebookPages': True,
                'whatsappNumbers': True,
                'leads': {
                    'select': {'id': True}
                },
                'campaigns': {
                    'select': {'id': True}
                }
            },
            order_by={'createdAt': 'desc'},
            take=limit,
            skip=(page - 1) * limit
        )
        
        users_data = [
            {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'facebookId': user.facebookId,
                'createdAt': user.createdAt.isoformat(),
                'updatedAt': user.updatedAt.isoformat(),
                'stats': {
                    'facebook_pages': len(user.facebookPages),
                    'whatsapp_numbers': len(user.whatsappNumbers),
                    'leads': len(user.leads),
                    'campaigns': len(user.campaigns)
                }
            } for user in users
        ]
        
        await log_action(
            user_id=user_id,
            action='view_users',
            resource='user',
            details={'page': page, 'limit': limit}
        )
        
        return jsonify({
            'users': users_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get users: {str(e)}'}), 500

@admin_bp.route('/users/<user_id>/role', methods=['PUT'])
@jwt_required()
@require_admin()
async def update_user_role(user_id):
    """Update a user's role"""
    try:
        admin_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('role'):
            return jsonify({'error': 'Role is required'}), 400
        
        valid_roles = ['USER', 'ADMIN']
        if data['role'] not in valid_roles:
            return jsonify({'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'}), 400
        
        # Check if user exists
        user = await prisma.user.find_unique(where={'id': user_id})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update user role
        updated_user = await prisma.user.update(
            where={'id': user_id},
            data={'role': data['role']}
        )
        
        await log_action(
            user_id=admin_user_id,
            action='update_user_role',
            resource='user',
            resource_id=user_id,
            details={'old_role': user.role, 'new_role': data['role']}
        )
        
        return jsonify({
            'message': 'User role updated successfully',
            'user': {
                'id': updated_user.id,
                'name': updated_user.name,
                'email': updated_user.email,
                'role': updated_user.role
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to update user role: {str(e)}'}), 500

@admin_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@require_admin()
async def get_admin_audit_logs():
    """Get audit logs with filtering"""
    try:
        admin_user_id = get_jwt_identity()
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        user_id = request.args.get('user_id')
        resource = request.args.get('resource')
        action = request.args.get('action')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build where clause
        where_clause = {}
        
        if user_id:
            where_clause['userId'] = user_id
        
        if resource:
            where_clause['resource'] = resource
        
        if action:
            where_clause['action'] = action
        
        if start_date or end_date:
            where_clause['createdAt'] = {}
            if start_date:
                where_clause['createdAt']['gte'] = datetime.fromisoformat(start_date)
            if end_date:
                where_clause['createdAt']['lte'] = datetime.fromisoformat(end_date)
        
        # Get total count
        total = await prisma.auditlog.count(where=where_clause)
        
        # Get audit logs
        logs = await prisma.auditlog.find_many(
            where=where_clause,
            include={'user': True},
            order_by={'createdAt': 'desc'},
            take=limit,
            skip=(page - 1) * limit
        )
        
        logs_data = [
            {
                'id': log.id,
                'action': log.action,
                'resource': log.resource,
                'resourceId': log.resourceId,
                'details': log.details,
                'ipAddress': log.ipAddress,
                'userAgent': log.userAgent,
                'createdAt': log.createdAt.isoformat(),
                'user': {
                    'id': log.user.id if log.user else None,
                    'name': log.user.name if log.user else 'System',
                    'email': log.user.email if log.user else None
                }
            } for log in logs
        ]
        
        await log_action(
            user_id=admin_user_id,
            action='view_audit_logs',
            resource='audit_log',
            details={'page': page, 'limit': limit, 'filters': {
                'user_id': user_id,
                'resource': resource,
                'action': action
            }}
        )
        
        return jsonify({
            'logs': logs_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get audit logs: {str(e)}'}), 500

@admin_bp.route('/api-keys', methods=['GET'])
@jwt_required()
@require_admin()
async def get_api_keys():
    """Get all API keys"""
    try:
        admin_user_id = get_jwt_identity()
        
        api_keys = await prisma.apikey.find_many(
            order_by={'createdAt': 'desc'}
        )
        
        keys_data = [
            {
                'id': key.id,
                'name': key.name,
                'permissions': key.permissions,
                'isActive': key.isActive,
                'lastUsedAt': key.lastUsedAt.isoformat() if key.lastUsedAt else None,
                'expiresAt': key.expiresAt.isoformat() if key.expiresAt else None,
                'createdAt': key.createdAt.isoformat()
            } for key in api_keys
        ]
        
        await log_action(
            user_id=admin_user_id,
            action='view_api_keys',
            resource='api_key'
        )
        
        return jsonify({'api_keys': keys_data})
        
    except Exception as e:
        return jsonify({'error': f'Failed to get API keys: {str(e)}'}), 500

@admin_bp.route('/api-keys', methods=['POST'])
@jwt_required()
@require_admin()
async def create_api_key():
    """Create a new API key"""
    try:
        admin_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'error': 'API key name is required'}), 400
        
        # Generate API key
        api_key = generate_api_key()
        key_hash = hash_api_key(api_key)
        
        # Create API key record
        api_key_record = await prisma.apikey.create(
            data={
                'name': data['name'],
                'keyHash': key_hash,
                'permissions': data.get('permissions', []),
                'expiresAt': datetime.fromisoformat(data['expiresAt']) if data.get('expiresAt') else None
            }
        )
        
        await log_action(
            user_id=admin_user_id,
            action='create_api_key',
            resource='api_key',
            resource_id=api_key_record.id,
            details={'name': data['name']}
        )
        
        return jsonify({
            'message': 'API key created successfully',
            'api_key': api_key,  # Only return the key once
            'key_info': {
                'id': api_key_record.id,
                'name': api_key_record.name,
                'permissions': api_key_record.permissions,
                'expiresAt': api_key_record.expiresAt.isoformat() if api_key_record.expiresAt else None
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to create API key: {str(e)}'}), 500

@admin_bp.route('/api-keys/<key_id>', methods=['PUT'])
@jwt_required()
@require_admin()
async def update_api_key(key_id):
    """Update an API key"""
    try:
        admin_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        # Check if API key exists
        api_key = await prisma.apikey.find_unique(where={'id': key_id})
        if not api_key:
            return jsonify({'error': 'API key not found'}), 404
        
        # Update API key
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'permissions' in data:
            update_data['permissions'] = data['permissions']
        if 'isActive' in data:
            update_data['isActive'] = data['isActive']
        if 'expiresAt' in data:
            update_data['expiresAt'] = datetime.fromisoformat(data['expiresAt']) if data['expiresAt'] else None
        
        if update_data:
            updated_key = await prisma.apikey.update(
                where={'id': key_id},
                data=update_data
            )
        else:
            updated_key = api_key
        
        await log_action(
            user_id=admin_user_id,
            action='update_api_key',
            resource='api_key',
            resource_id=key_id,
            details={'updated_fields': list(update_data.keys())}
        )
        
        return jsonify({
            'message': 'API key updated successfully',
            'key_info': {
                'id': updated_key.id,
                'name': updated_key.name,
                'permissions': updated_key.permissions,
                'isActive': updated_key.isActive,
                'expiresAt': updated_key.expiresAt.isoformat() if updated_key.expiresAt else None
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to update API key: {str(e)}'}), 500

@admin_bp.route('/api-keys/<key_id>', methods=['DELETE'])
@jwt_required()
@require_admin()
async def delete_api_key(key_id):
    """Delete an API key"""
    try:
        admin_user_id = get_jwt_identity()
        
        # Check if API key exists
        api_key = await prisma.apikey.find_unique(where={'id': key_id})
        if not api_key:
            return jsonify({'error': 'API key not found'}), 404
        
        # Delete API key
        await prisma.apikey.delete(where={'id': key_id})
        
        await log_action(
            user_id=admin_user_id,
            action='delete_api_key',
            resource='api_key',
            resource_id=key_id,
            details={'name': api_key.name}
        )
        
        return jsonify({'message': 'API key deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete API key: {str(e)}'}), 500

@admin_bp.route('/data-requests', methods=['GET'])
@jwt_required()
@require_admin()
async def get_data_requests():
    """Get data export/deletion requests (GDPR compliance)"""
    try:
        admin_user_id = get_jwt_identity()
        
        # This would typically be stored in a separate table
        # For now, we'll look at audit logs for data-related actions
        data_actions = await prisma.auditlog.find_many(
            where={
                'action': {'in': ['export_user_data', 'delete_user_data', 'revoke_consent']}
            },
            include={'user': True},
            order_by={'createdAt': 'desc'},
            take=50
        )
        
        requests_data = [
            {
                'id': log.id,
                'type': log.action,
                'user': {
                    'id': log.user.id if log.user else None,
                    'name': log.user.name if log.user else 'Unknown',
                    'email': log.user.email if log.user else None
                },
                'status': 'completed',  # This would be tracked in a real implementation
                'requestedAt': log.createdAt.isoformat(),
                'details': log.details
            } for log in data_actions
        ]
        
        await log_action(
            user_id=admin_user_id,
            action='view_data_requests',
            resource='data_request'
        )
        
        return jsonify({'data_requests': requests_data})
        
    except Exception as e:
        return jsonify({'error': f'Failed to get data requests: {str(e)}'}), 500

@admin_bp.route('/system-health', methods=['GET'])
@jwt_required()
@require_admin()
async def get_system_health():
    """Get system health status"""
    try:
        admin_user_id = get_jwt_identity()
        
        health_data = {
            'database': 'healthy',  # Would check actual DB connection
            'redis': 'healthy',     # Would check Redis connection
            'queues': get_queue_stats(),
            'api_integrations': {
                'facebook': 'healthy',  # Would check Facebook API
                'whatsapp': 'healthy',  # Would check WhatsApp API
                'twilio': 'healthy'     # Would check Twilio API
            },
            'last_checked': datetime.utcnow().isoformat()
        }
        
        await log_action(
            user_id=admin_user_id,
            action='check_system_health',
            resource='system'
        )
        
        return jsonify(health_data)
        
    except Exception as e:
        return jsonify({'error': f'Failed to get system health: {str(e)}'}), 500

