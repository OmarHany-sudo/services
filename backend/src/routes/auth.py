from flask import Blueprint, request, jsonify, redirect, url_for, session
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import requests
import os
from datetime import datetime
from src.models import Prisma
from src.utils.security import encrypt_token, decrypt_token
from src.utils.audit import log_action

auth_bp = Blueprint('auth', __name__)
prisma = Prisma()

@auth_bp.route('/facebook/login', methods=['GET'])
def facebook_login():
    """Initiate Facebook OAuth flow"""
    facebook_app_id = os.getenv('FACEBOOK_APP_ID')
    redirect_uri = os.getenv('FACEBOOK_REDIRECT_URI', 'http://localhost:5000/api/auth/facebook/callback')
    
    if not facebook_app_id:
        return jsonify({'error': 'Facebook App ID not configured'}), 500
    
    # Facebook OAuth URL with required permissions
    permissions = 'pages_manage_posts,pages_read_engagement,pages_messaging,read_page_mailboxes'
    facebook_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth?"
        f"client_id={facebook_app_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope={permissions}&"
        f"response_type=code"
    )
    
    return redirect(facebook_url)

@auth_bp.route('/facebook/callback', methods=['GET'])
async def facebook_callback():
    """Handle Facebook OAuth callback"""
    code = request.args.get('code')
    error = request.args.get('error')
    
    if error:
        return jsonify({'error': f'Facebook OAuth error: {error}'}), 400
    
    if not code:
        return jsonify({'error': 'No authorization code received'}), 400
    
    try:
        # Exchange code for access token
        facebook_app_id = os.getenv('FACEBOOK_APP_ID')
        facebook_app_secret = os.getenv('FACEBOOK_APP_SECRET')
        redirect_uri = os.getenv('FACEBOOK_REDIRECT_URI', 'http://localhost:5000/api/auth/facebook/callback')
        
        token_url = 'https://graph.facebook.com/v18.0/oauth/access_token'
        token_params = {
            'client_id': facebook_app_id,
            'client_secret': facebook_app_secret,
            'redirect_uri': redirect_uri,
            'code': code
        }
        
        token_response = requests.get(token_url, params=token_params)
        token_data = token_response.json()
        
        if 'error' in token_data:
            return jsonify({'error': f'Token exchange error: {token_data["error"]["message"]}'}), 400
        
        access_token = token_data['access_token']
        
        # Get user info from Facebook
        user_url = f'https://graph.facebook.com/v18.0/me?access_token={access_token}&fields=id,name,email'
        user_response = requests.get(user_url)
        user_data = user_response.json()
        
        if 'error' in user_data:
            return jsonify({'error': f'User info error: {user_data["error"]["message"]}'}), 400
        
        # Create or update user in database
        facebook_id = user_data['id']
        name = user_data.get('name')
        email = user_data.get('email')
        
        # Check if user exists
        existing_user = await prisma.user.find_unique(
            where={'facebookId': facebook_id}
        )
        
        if existing_user:
            # Update existing user
            user = await prisma.user.update(
                where={'id': existing_user.id},
                data={
                    'name': name,
                    'email': email,
                    'facebookToken': encrypt_token(access_token),
                    'updatedAt': datetime.utcnow()
                }
            )
        else:
            # Create new user
            user = await prisma.user.create(
                data={
                    'facebookId': facebook_id,
                    'name': name,
                    'email': email,
                    'facebookToken': encrypt_token(access_token)
                }
            )
        
        # Create JWT token
        jwt_token = create_access_token(identity=user.id)
        
        # Log the action
        await log_action(
            user_id=user.id,
            action='facebook_login',
            resource='user',
            resource_id=user.id,
            details={'facebook_id': facebook_id}
        )
        
        # Redirect to frontend with token
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        return redirect(f'{frontend_url}/auth/callback?token={jwt_token}')
        
    except Exception as e:
        return jsonify({'error': f'Authentication failed: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
async def get_current_user():
    """Get current user information"""
    try:
        user_id = get_jwt_identity()
        user = await prisma.user.find_unique(
            where={'id': user_id},
            include={
                'facebookPages': True,
                'whatsappNumbers': True
            }
        )
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Remove sensitive data
        user_data = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'createdAt': user.createdAt.isoformat(),
            'facebookPages': [
                {
                    'id': page.id,
                    'name': page.name,
                    'facebookPageId': page.facebookPageId,
                    'isActive': page.isActive
                } for page in user.facebookPages
            ],
            'whatsappNumbers': [
                {
                    'id': number.id,
                    'phoneNumber': number.phoneNumber,
                    'displayName': number.displayName,
                    'isActive': number.isActive
                } for number in user.whatsappNumbers
            ]
        }
        
        return jsonify(user_data)
        
    except Exception as e:
        return jsonify({'error': f'Failed to get user: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
async def logout():
    """Logout user"""
    try:
        user_id = get_jwt_identity()
        
        # Log the action
        await log_action(
            user_id=user_id,
            action='logout',
            resource='user',
            resource_id=user_id
        )
        
        return jsonify({'message': 'Logged out successfully'})
        
    except Exception as e:
        return jsonify({'error': f'Logout failed: {str(e)}'}), 500

