from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import os
from datetime import datetime, timedelta
from src.models import Prisma
from src.utils.security import encrypt_token, decrypt_token
from src.utils.audit import log_action
from src.utils.queue import add_import_job

facebook_bp = Blueprint('facebook', __name__)
prisma = Prisma()

@facebook_bp.route('/pages', methods=['GET'])
@jwt_required()
async def get_facebook_pages():
    """Get user's Facebook pages"""
    try:
        user_id = get_jwt_identity()
        user = await prisma.user.find_unique(
            where={'id': user_id},
            include={'facebookPages': True}
        )
        
        if not user or not user.facebookToken:
            return jsonify({'error': 'Facebook not connected'}), 400
        
        # Decrypt and use Facebook token
        access_token = decrypt_token(user.facebookToken)
        if not access_token:
            return jsonify({'error': 'Invalid Facebook token'}), 400
        
        # Get pages from Facebook API
        pages_url = f'https://graph.facebook.com/v18.0/me/accounts?access_token={access_token}'
        response = requests.get(pages_url)
        pages_data = response.json()
        
        if 'error' in pages_data:
            return jsonify({'error': f'Facebook API error: {pages_data["error"]["message"]}'}), 400
        
        # Update database with current pages
        for page_data in pages_data.get('data', []):
            page_id = page_data['id']
            page_name = page_data['name']
            page_access_token = page_data['access_token']
            
            # Check if page exists
            existing_page = await prisma.facebookpage.find_unique(
                where={'facebookPageId': page_id}
            )
            
            if existing_page:
                # Update existing page
                await prisma.facebookpage.update(
                    where={'id': existing_page.id},
                    data={
                        'name': page_name,
                        'accessToken': encrypt_token(page_access_token),
                        'updatedAt': datetime.utcnow()
                    }
                )
            else:
                # Create new page
                await prisma.facebookpage.create(
                    data={
                        'facebookPageId': page_id,
                        'name': page_name,
                        'accessToken': encrypt_token(page_access_token),
                        'userId': user_id
                    }
                )
        
        # Get updated pages from database
        updated_user = await prisma.user.find_unique(
            where={'id': user_id},
            include={'facebookPages': True}
        )
        
        pages = [
            {
                'id': page.id,
                'facebookPageId': page.facebookPageId,
                'name': page.name,
                'isActive': page.isActive,
                'createdAt': page.createdAt.isoformat(),
                'updatedAt': page.updatedAt.isoformat()
            } for page in updated_user.facebookPages
        ]
        
        await log_action(
            user_id=user_id,
            action='get_facebook_pages',
            resource='facebook_page',
            details={'pages_count': len(pages)}
        )
        
        return jsonify({'pages': pages})
        
    except Exception as e:
        return jsonify({'error': f'Failed to get Facebook pages: {str(e)}'}), 500

@facebook_bp.route('/pages/<page_id>/posts', methods=['GET'])
@jwt_required()
async def get_page_posts(page_id):
    """Get posts from a Facebook page"""
    try:
        user_id = get_jwt_identity()
        
        # Get page from database
        page = await prisma.facebookpage.find_unique(
            where={'id': page_id, 'userId': user_id}
        )
        
        if not page:
            return jsonify({'error': 'Page not found'}), 404
        
        # Decrypt page access token
        page_access_token = decrypt_token(page.accessToken)
        if not page_access_token:
            return jsonify({'error': 'Invalid page token'}), 400
        
        # Get query parameters
        limit = request.args.get('limit', 25, type=int)
        since = request.args.get('since')  # ISO date string
        
        # Build Facebook API URL
        posts_url = f'https://graph.facebook.com/v18.0/{page.facebookPageId}/posts'
        params = {
            'access_token': page_access_token,
            'fields': 'id,message,story,created_time,likes.summary(true),comments.summary(true),shares',
            'limit': min(limit, 100)  # Facebook API limit
        }
        
        if since:
            params['since'] = since
        
        response = requests.get(posts_url, params=params)
        posts_data = response.json()
        
        if 'error' in posts_data:
            return jsonify({'error': f'Facebook API error: {posts_data["error"]["message"]}'}), 400
        
        # Process and store posts
        posts = []
        for post_data in posts_data.get('data', []):
            post_id = post_data['id']
            
            # Check if post exists in database
            existing_post = await prisma.facebookpost.find_unique(
                where={'facebookPostId': post_id}
            )
            
            post_info = {
                'facebookPostId': post_id,
                'message': post_data.get('message'),
                'story': post_data.get('story'),
                'createdTime': datetime.fromisoformat(post_data['created_time'].replace('Z', '+00:00')),
                'likesCount': post_data.get('likes', {}).get('summary', {}).get('total_count', 0),
                'commentsCount': post_data.get('comments', {}).get('summary', {}).get('total_count', 0),
                'sharesCount': post_data.get('shares', {}).get('count', 0)
            }
            
            if existing_post:
                # Update existing post
                await prisma.facebookpost.update(
                    where={'id': existing_post.id},
                    data={
                        **post_info,
                        'updatedAt': datetime.utcnow()
                    }
                )
            else:
                # Create new post
                await prisma.facebookpost.create(
                    data={
                        **post_info,
                        'facebookPageId': page.id
                    }
                )
            
            posts.append({
                'id': post_id,
                'message': post_info['message'],
                'story': post_info['story'],
                'createdTime': post_info['createdTime'].isoformat(),
                'likesCount': post_info['likesCount'],
                'commentsCount': post_info['commentsCount'],
                'sharesCount': post_info['sharesCount']
            })
        
        await log_action(
            user_id=user_id,
            action='get_page_posts',
            resource='facebook_post',
            resource_id=page_id,
            details={'posts_count': len(posts)}
        )
        
        return jsonify({
            'posts': posts,
            'paging': posts_data.get('paging', {})
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get page posts: {str(e)}'}), 500

@facebook_bp.route('/pages/<page_id>/import-engagement', methods=['POST'])
@jwt_required()
async def import_page_engagement(page_id):
    """Import commenters and likers from page posts"""
    try:
        user_id = get_jwt_identity()
        
        # Get page from database
        page = await prisma.facebookpage.find_unique(
            where={'id': page_id, 'userId': user_id}
        )
        
        if not page:
            return jsonify({'error': 'Page not found'}), 404
        
        # Add import job to queue
        job_data = {
            'type': 'import_engagement',
            'user_id': user_id,
            'page_id': page_id,
            'facebook_page_id': page.facebookPageId
        }
        
        job_id = await add_import_job(job_data)
        
        if not job_id:
            return jsonify({'error': 'Failed to queue import job'}), 500
        
        await log_action(
            user_id=user_id,
            action='import_page_engagement',
            resource='facebook_page',
            resource_id=page_id,
            details={'job_id': job_id}
        )
        
        return jsonify({
            'message': 'Import job queued successfully',
            'job_id': job_id
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to import engagement: {str(e)}'}), 500

@facebook_bp.route('/pages/<page_id>/send-message', methods=['POST'])
@jwt_required()
async def send_messenger_message(page_id):
    """Send a message via Messenger"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('recipient') or not data.get('message'):
            return jsonify({'error': 'Recipient and message are required'}), 400
        
        # Get page from database
        page = await prisma.facebookpage.find_unique(
            where={'id': page_id, 'userId': user_id}
        )
        
        if not page:
            return jsonify({'error': 'Page not found'}), 404
        
        # Check if recipient has consented or has messaged the page
        recipient_id = data['recipient']
        lead = await prisma.lead.find_first(
            where={
                'facebookUserId': recipient_id,
                'facebookPageId': page_id,
                'OR': [
                    {'consentGiven': True},
                    {'source': 'FACEBOOK_MESSAGE'}
                ]
            }
        )
        
        if not lead:
            return jsonify({'error': 'Recipient has not consented or messaged the page'}), 403
        
        # Decrypt page access token
        page_access_token = decrypt_token(page.accessToken)
        if not page_access_token:
            return jsonify({'error': 'Invalid page token'}), 400
        
        # Send message via Facebook Messenger API
        messenger_url = f'https://graph.facebook.com/v18.0/me/messages'
        message_data = {
            'recipient': {'id': recipient_id},
            'message': {'text': data['message']},
            'access_token': page_access_token
        }
        
        response = requests.post(messenger_url, json=message_data)
        response_data = response.json()
        
        if 'error' in response_data:
            # Log failed message
            await prisma.message.create(
                data={
                    'type': 'TEXT',
                    'platform': 'MESSENGER',
                    'recipient': recipient_id,
                    'content': data['message'],
                    'status': 'FAILED',
                    'errorMessage': response_data['error']['message'],
                    'leadId': lead.id
                }
            )
            
            return jsonify({'error': f'Messenger API error: {response_data["error"]["message"]}'}), 400
        
        # Log successful message
        message = await prisma.message.create(
            data={
                'type': 'TEXT',
                'platform': 'MESSENGER',
                'recipient': recipient_id,
                'content': data['message'],
                'status': 'SENT',
                'sentAt': datetime.utcnow(),
                'leadId': lead.id
            }
        )
        
        await log_action(
            user_id=user_id,
            action='send_messenger_message',
            resource='message',
            resource_id=message.id,
            details={'recipient': recipient_id, 'page_id': page_id}
        )
        
        return jsonify({
            'message': 'Message sent successfully',
            'message_id': message.id,
            'facebook_message_id': response_data.get('message_id')
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to send message: {str(e)}'}), 500

