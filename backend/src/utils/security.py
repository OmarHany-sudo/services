import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from flask import request
import hashlib
import secrets

# Generate or load encryption key
def get_encryption_key():
    """Get or generate encryption key for token encryption"""
    key = os.getenv('ENCRYPTION_KEY')
    if not key:
        # Generate a new key (in production, this should be stored securely)
        password = os.getenv('SECRET_KEY', 'default-secret').encode()
        salt = os.getenv('ENCRYPTION_SALT', 'default-salt').encode()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
    else:
        key = key.encode()
    
    return Fernet(key)

def encrypt_token(token):
    """Encrypt a token for secure storage"""
    if not token:
        return None
    
    fernet = get_encryption_key()
    encrypted_token = fernet.encrypt(token.encode())
    return base64.urlsafe_b64encode(encrypted_token).decode()

def decrypt_token(encrypted_token):
    """Decrypt a token for use"""
    if not encrypted_token:
        return None
    
    try:
        fernet = get_encryption_key()
        encrypted_data = base64.urlsafe_b64decode(encrypted_token.encode())
        decrypted_token = fernet.decrypt(encrypted_data)
        return decrypted_token.decode()
    except Exception:
        return None

def hash_api_key(api_key):
    """Hash an API key for secure storage"""
    return hashlib.sha256(api_key.encode()).hexdigest()

def generate_api_key():
    """Generate a secure API key"""
    return secrets.token_urlsafe(32)

def init_security(app):
    """Initialize security middleware"""
    
    @app.before_request
    def security_headers():
        """Add security headers to all responses"""
        pass
    
    @app.after_request
    def add_security_headers(response):
        """Add security headers"""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

def get_client_ip():
    """Get client IP address"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr

def get_user_agent():
    """Get user agent string"""
    return request.headers.get('User-Agent', 'Unknown')

