from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import os
from datetime import datetime, timedelta
from src.models import Prisma
from src.utils.security import encrypt_token, decrypt_token
from src.utils.audit import log_action
from src.utils.queue import add_message_job

whatsapp_bp = Blueprint('whatsapp', __name__)
prisma = Prisma()

@whatsapp_bp.route('/numbers', methods=['GET'])
@jwt_required()
async def get_whatsapp_numbers():
    """Get user's WhatsApp Business numbers"""
    try:
        user_id = get_jwt_identity()
        
        numbers = await prisma.whatsappnumber.find_many(
            where={'userId': user_id},
            include={'templates': True}
        )
        
        numbers_data = [
            {
                'id': number.id,
                'phoneNumber': number.phoneNumber,
                'displayName': number.displayName,
                'businessAccountId': number.businessAccountId,
                'isActive': number.isActive,
                'createdAt': number.createdAt.isoformat(),
                'templatesCount': len(number.templates)
            } for number in numbers
        ]
        
        return jsonify({'numbers': numbers_data})
        
    except Exception as e:
        return jsonify({'error': f'Failed to get WhatsApp numbers: {str(e)}'}), 500

@whatsapp_bp.route('/numbers', methods=['POST'])
@jwt_required()
async def add_whatsapp_number():
    """Add a WhatsApp Business number"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['phoneNumber', 'businessAccountId', 'accessToken']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Phone number, business account ID, and access token are required'}), 400
        
        # Verify the WhatsApp Business API token
        verify_url = f'https://graph.facebook.com/v18.0/{data["businessAccountId"]}'
        headers = {'Authorization': f'Bearer {data["accessToken"]}'}
        
        response = requests.get(verify_url, headers=headers)
        if response.status_code != 200:
            return jsonify({'error': 'Invalid WhatsApp Business API token'}), 400
        
        # Check if number already exists
        existing_number = await prisma.whatsappnumber.find_unique(
            where={'phoneNumber': data['phoneNumber']}
        )
        
        if existing_number:
            return jsonify({'error': 'Phone number already registered'}), 409
        
        # Create new WhatsApp number
        number = await prisma.whatsappnumber.create(
            data={
                'phoneNumber': data['phoneNumber'],
                'displayName': data.get('displayName'),
                'businessAccountId': data['businessAccountId'],
                'accessToken': encrypt_token(data['accessToken']),
                'userId': user_id
            }
        )
        
        await log_action(
            user_id=user_id,
            action='add_whatsapp_number',
            resource='whatsapp_number',
            resource_id=number.id,
            details={'phone_number': data['phoneNumber']}
        )
        
        return jsonify({
            'message': 'WhatsApp number added successfully',
            'number': {
                'id': number.id,
                'phoneNumber': number.phoneNumber,
                'displayName': number.displayName,
                'isActive': number.isActive
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to add WhatsApp number: {str(e)}'}), 500

@whatsapp_bp.route('/numbers/<number_id>/templates', methods=['GET'])
@jwt_required()
async def get_whatsapp_templates(number_id):
    """Get WhatsApp message templates for a number"""
    try:
        user_id = get_jwt_identity()
        
        # Verify user owns the number
        number = await prisma.whatsappnumber.find_unique(
            where={'id': number_id, 'userId': user_id}
        )
        
        if not number:
            return jsonify({'error': 'WhatsApp number not found'}), 404
        
        # Get templates from database
        templates = await prisma.whatsapptemplate.find_many(
            where={'whatsappNumberId': number_id}
        )
        
        # Also fetch latest templates from WhatsApp API
        access_token = decrypt_token(number.accessToken)
        if access_token:
            templates_url = f'https://graph.facebook.com/v18.0/{number.businessAccountId}/message_templates'
            headers = {'Authorization': f'Bearer {access_token}'}
            
            response = requests.get(templates_url, headers=headers)
            if response.status_code == 200:
                api_templates = response.json().get('data', [])
                
                # Update database with latest templates
                for template_data in api_templates:
                    existing_template = await prisma.whatsapptemplate.find_unique(
                        where={
                            'whatsappNumberId_name': {
                                'whatsappNumberId': number_id,
                                'name': template_data['name']
                            }
                        }
                    )
                    
                    template_info = {
                        'name': template_data['name'],
                        'language': template_data['language'],
                        'status': template_data['status'],
                        'category': template_data['category'],
                        'components': template_data.get('components', [])
                    }
                    
                    if existing_template:
                        await prisma.whatsapptemplate.update(
                            where={'id': existing_template.id},
                            data={
                                **template_info,
                                'updatedAt': datetime.utcnow()
                            }
                        )
                    else:
                        await prisma.whatsapptemplate.create(
                            data={
                                **template_info,
                                'whatsappNumberId': number_id
                            }
                        )
        
        # Get updated templates from database
        updated_templates = await prisma.whatsapptemplate.find_many(
            where={'whatsappNumberId': number_id}
        )
        
        templates_data = [
            {
                'id': template.id,
                'name': template.name,
                'language': template.language,
                'status': template.status,
                'category': template.category,
                'components': template.components,
                'createdAt': template.createdAt.isoformat(),
                'updatedAt': template.updatedAt.isoformat()
            } for template in updated_templates
        ]
        
        return jsonify({'templates': templates_data})
        
    except Exception as e:
        return jsonify({'error': f'Failed to get WhatsApp templates: {str(e)}'}), 500

@whatsapp_bp.route('/numbers/<number_id>/send-template', methods=['POST'])
@jwt_required()
async def send_whatsapp_template(number_id):
    """Send a WhatsApp template message"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['recipient', 'templateName', 'language']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Recipient, template name, and language are required'}), 400
        
        # Verify user owns the number
        number = await prisma.whatsappnumber.find_unique(
            where={'id': number_id, 'userId': user_id}
        )
        
        if not number:
            return jsonify({'error': 'WhatsApp number not found'}), 404
        
        # Check if recipient has consented
        recipient_phone = data['recipient']
        lead = await prisma.lead.find_first(
            where={
                'phoneNumber': recipient_phone,
                'consentGiven': True,
                'userId': user_id
            }
        )
        
        if not lead:
            return jsonify({'error': 'Recipient has not consented to receive messages'}), 403
        
        # Get template
        template = await prisma.whatsapptemplate.find_unique(
            where={
                'whatsappNumberId_name': {
                    'whatsappNumberId': number_id,
                    'name': data['templateName']
                }
            }
        )
        
        if not template or template.status != 'APPROVED':
            return jsonify({'error': 'Template not found or not approved'}), 400
        
        # Add message to queue for sending
        job_data = {
            'type': 'whatsapp_template',
            'number_id': number_id,
            'recipient': recipient_phone,
            'template_name': data['templateName'],
            'language': data['language'],
            'parameters': data.get('parameters', []),
            'lead_id': lead.id,
            'user_id': user_id
        }
        
        job_id = await add_message_job(job_data)
        
        if not job_id:
            return jsonify({'error': 'Failed to queue message'}), 500
        
        # Create message record
        message = await prisma.message.create(
            data={
                'type': 'TEMPLATE',
                'platform': 'WHATSAPP',
                'recipient': recipient_phone,
                'content': f'Template: {data["templateName"]}',
                'status': 'PENDING',
                'leadId': lead.id,
                'whatsappNumberId': number_id,
                'whatsappTemplateId': template.id
            }
        )
        
        await log_action(
            user_id=user_id,
            action='send_whatsapp_template',
            resource='message',
            resource_id=message.id,
            details={
                'recipient': recipient_phone,
                'template_name': data['templateName'],
                'job_id': job_id
            }
        )
        
        return jsonify({
            'message': 'Template message queued successfully',
            'message_id': message.id,
            'job_id': job_id
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to send template message: {str(e)}'}), 500

@whatsapp_bp.route('/numbers/<number_id>/send-text', methods=['POST'])
@jwt_required()
async def send_whatsapp_text(number_id):
    """Send a WhatsApp text message (only within 24-hour window)"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('recipient') or not data.get('message'):
            return jsonify({'error': 'Recipient and message are required'}), 400
        
        # Verify user owns the number
        number = await prisma.whatsappnumber.find_unique(
            where={'id': number_id, 'userId': user_id}
        )
        
        if not number:
            return jsonify({'error': 'WhatsApp number not found'}), 404
        
        # Check if recipient has messaged recently (24-hour window)
        recipient_phone = data['recipient']
        recent_message = await prisma.message.find_first(
            where={
                'recipient': recipient_phone,
                'platform': 'WHATSAPP',
                'createdAt': {
                    'gte': datetime.utcnow() - timedelta(hours=24)
                }
            },
            order_by={'createdAt': 'desc'}
        )
        
        if not recent_message:
            return jsonify({'error': 'Can only send text messages within 24 hours of last customer message. Use template messages instead.'}), 403
        
        # Get lead
        lead = await prisma.lead.find_first(
            where={
                'phoneNumber': recipient_phone,
                'userId': user_id
            }
        )
        
        if not lead:
            return jsonify({'error': 'Lead not found'}), 404
        
        # Add message to queue for sending
        job_data = {
            'type': 'whatsapp_text',
            'number_id': number_id,
            'recipient': recipient_phone,
            'message': data['message'],
            'lead_id': lead.id,
            'user_id': user_id
        }
        
        job_id = await add_message_job(job_data)
        
        if not job_id:
            return jsonify({'error': 'Failed to queue message'}), 500
        
        # Create message record
        message = await prisma.message.create(
            data={
                'type': 'TEXT',
                'platform': 'WHATSAPP',
                'recipient': recipient_phone,
                'content': data['message'],
                'status': 'PENDING',
                'leadId': lead.id,
                'whatsappNumberId': number_id
            }
        )
        
        await log_action(
            user_id=user_id,
            action='send_whatsapp_text',
            resource='message',
            resource_id=message.id,
            details={
                'recipient': recipient_phone,
                'job_id': job_id
            }
        )
        
        return jsonify({
            'message': 'Text message queued successfully',
            'message_id': message.id,
            'job_id': job_id
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to send text message: {str(e)}'}), 500

@whatsapp_bp.route('/webhook', methods=['GET', 'POST'])
def whatsapp_webhook():
    """Handle WhatsApp webhook for message status updates"""
    if request.method == 'GET':
        # Webhook verification
        verify_token = os.getenv('WHATSAPP_VERIFY_TOKEN')
        mode = request.args.get('hub.mode')
        token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')
        
        if mode == 'subscribe' and token == verify_token:
            return challenge
        else:
            return 'Forbidden', 403
    
    elif request.method == 'POST':
        # Handle webhook events
        try:
            data = request.get_json()
            
            # Process webhook data (message status updates, incoming messages)
            for entry in data.get('entry', []):
                for change in entry.get('changes', []):
                    if change.get('field') == 'messages':
                        value = change.get('value', {})
                        
                        # Handle message status updates
                        for status in value.get('statuses', []):
                            message_id = status.get('id')
                            status_type = status.get('status')
                            timestamp = status.get('timestamp')
                            
                            # Update message status in database
                            # This would require storing WhatsApp message IDs
                            # Implementation depends on your message tracking needs
                        
                        # Handle incoming messages
                        for message in value.get('messages', []):
                            from_number = message.get('from')
                            message_type = message.get('type')
                            
                            # Create or update lead for incoming message
                            # This ensures we can respond within 24-hour window
                            
            return 'OK', 200
            
        except Exception as e:
            print(f"Webhook error: {str(e)}")
            return 'Error', 500

