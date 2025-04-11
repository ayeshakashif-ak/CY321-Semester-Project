import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from config import get_config

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize SQLAlchemy with custom base class
class Base(DeclarativeBase):
    pass

# Initialize extensions
db = SQLAlchemy(model_class=Base)
migrate = Migrate()
jwt = JWTManager()

def create_app(config_class=None):
    """Create and configure an instance of the Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)
    
    # Initialize security middleware
    from app.utils.middleware import SecurityMiddleware
    security = SecurityMiddleware()
    security.init_app(app)
    
    # Import models
    from app import models
    
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

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {"message": "Token has expired", "error": "token_expired"}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {"message": "Signature verification failed", "error": "invalid_token"}, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {"message": "Request does not contain an access token", 
                "error": "authorization_required"}, 401
    
    @jwt.token_in_blocklist_loader
    def check_if_token_is_revoked(jwt_header, jwt_payload):
        from app.models import BlacklistedToken
        jti = jwt_payload['jti']
        return BlacklistedToken.query.filter_by(token=jti).first() is not None
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return {"message": "Token has been revoked", "error": "token_revoked"}, 401
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    return app

# Create the Flask application instance
app = create_app()

logger.info("Application initialized successfully")
