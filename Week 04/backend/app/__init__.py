import os
import logging
from flask import Flask, current_app
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
import jwt  # Import PyJWT library directly

# Load environment variables from .env file
load_dotenv()

from config import get_config

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize extensions
jwt_manager = JWTManager()  # Rename to avoid naming conflict with PyJWT

def create_app(config_class=None):
    """Create and configure an instance of the Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)
    
    # Initialize extensions
    jwt_manager.init_app(app)
    
    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:3001", "http://localhost:3000", "http://localhost:5002", 
                "http://localhost:5173", "http://localhost:5174", 
                "http://127.0.0.1:3000", "http://127.0.0.1:5002", 
                "http://127.0.0.1:5173", "http://127.0.0.1:5174",
                "http://10.1.149.171:3001"  # Your local IP with frontend port
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize security middleware
    from app.utils.middleware import SecurityMiddleware
    security = SecurityMiddleware()
    security.init_app(app)
    
    # Initialize Firestore
    from app.firebase import get_firestore
    app.firestore = get_firestore()
    
    # Register blueprints
    from app.routes import register_blueprints
    register_blueprints(app)
    
    # Setup error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {"error": "Not found"}, 404
        
    @app.errorhandler(500)
    def server_error(error):
        logger.error(f"Server error: {error}")
        return {"error": "Internal server error"}, 500

    @jwt_manager.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {"message": "Token has expired", "error": "token_expired"}, 401
    
    @jwt_manager.invalid_token_loader
    def invalid_token_callback(error):
        return {"message": "Signature verification failed", "error": "invalid_token"}, 401
    
    @jwt_manager.unauthorized_loader
    def missing_token_callback(error):
        return {"message": "Request does not contain an access token", 
                "error": "authorization_required"}, 401
    
    @jwt_manager.token_in_blocklist_loader
    def check_if_token_is_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        db = get_firestore()
        
        # First try to find by JTI (new format)
        token_ref = db.collection('blacklisted_tokens').document(jti)
        token_doc = token_ref.get()
        if token_doc.exists:
            return True
            
        # If not found by JTI, check the old way (for backwards compatibility)
        try:
            # Use the imported PyJWT library, not the JWTManager instance
            encoded_token = jwt.encode(
                jwt_payload, 
                current_app.config['JWT_SECRET_KEY'],
                algorithm=jwt_header['alg']
            )
            raw_token_query = db.collection('blacklisted_tokens').where(
                'token', '==', encoded_token
            ).limit(1).get()
            
            return len(raw_token_query) > 0
        except Exception as e:
            logger.error(f"Error checking token in blocklist: {str(e)}")
            # If there's an error, better to assume the token is valid than block legitimate requests
            return False
    
    @jwt_manager.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return {"message": "Token has been revoked", "error": "token_revoked"}, 401
    
    return app

# Create the Flask application instance
app = create_app()

logger.info("Application initialized successfully")
