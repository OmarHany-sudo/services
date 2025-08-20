import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.models import Prisma
from src.routes.auth import auth_bp
from src.routes.facebook import facebook_bp
from src.routes.whatsapp import whatsapp_bp
from src.routes.leads import leads_bp
from src.routes.campaigns import campaigns_bp
from src.routes.admin import admin_bp
from src.utils.security import init_security
from src.utils.queue import init_queue

# Initialize Prisma client
prisma = Prisma()

def create_app():
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # For development, set proper expiry in production
    
    # Initialize extensions
    CORS(app, origins="*")  # Allow all origins for development
    jwt = JWTManager(app)
    
    # Initialize security middleware
    init_security(app)
    
    # Initialize message queue
    init_queue()
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(facebook_bp, url_prefix='/api/facebook')
    app.register_blueprint(whatsapp_bp, url_prefix='/api/whatsapp')
    app.register_blueprint(leads_bp, url_prefix='/api/leads')
    app.register_blueprint(campaigns_bp, url_prefix='/api/campaigns')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Initialize database connection
    @app.before_first_request
    def startup():
        asyncio.create_task(prisma.connect())
    
    @app.teardown_appcontext
    def shutdown(exception=None):
        asyncio.create_task(prisma.disconnect())
    
    # Serve frontend static files
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        static_folder_path = app.static_folder
        if static_folder_path is None:
            return "Static folder not configured", 404

        if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
            return send_from_directory(static_folder_path, path)
        else:
            index_path = os.path.join(static_folder_path, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(static_folder_path, 'index.html')
            else:
                return "index.html not found", 404
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

