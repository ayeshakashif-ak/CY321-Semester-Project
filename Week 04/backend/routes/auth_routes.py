import logging
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    get_jwt_identity, jwt_required, get_jwt
)
from app import db
from app.models import User, BlacklistedToken, MFASession
from app.utils.auth_utils import validate_password, validate_email, validate_username
from app.utils.security_utils import log_audit_event, require_mfa
from app.utils.mfa_utils import create_mfa_session

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    # Validate input
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    # Validate required fields
    if not all([username, email, password]):
        return jsonify({"error": "Username, email, and password are required"}), 400
    
    # Validate username format
    if not validate_username(username):
        return jsonify({"error": "Invalid username format. Username must be 3-64 characters and contain only letters, numbers, and underscores."}), 400
    
    # Validate email format
    if not validate_email(email):
        return jsonify({"error": "Invalid email format"}), 400
    
    # Validate password strength
    password_validation = validate_password(password)
    if not password_validation['valid']:
        return jsonify({"error": password_validation['message']}), 400
    
    # Check if username already exists
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 409
    
    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409
    
    # Create new user
    try:
        # Get optional role, defaulting to 'user'
        role = data.get('role', 'user')
        # Only allow 'user' role during registration, admins must be created separately
        if role != 'user':
            role = 'user'
            
        new_user = User(username=username, email=email, password=password, role=role)
        db.session.add(new_user)
        db.session.commit()
        
        logger.info(f"New user registered: {username}")
        
        return jsonify({"message": "User registered successfully", "user_id": new_user.id}), 201
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error registering user: {e}")
        return jsonify({"error": "Error registering user"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login a user."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    # Get login credentials
    username_or_email = data.get('username') or data.get('email')
    password = data.get('password')
    mfa_token = data.get('mfa_token')  # Optional MFA token
    
    if not username_or_email or not password:
        return jsonify({"error": "Username/email and password are required"}), 400
    
    # Check if login is via username or email
    if '@' in username_or_email:
        user = User.query.filter_by(email=username_or_email).first()
    else:
        user = User.query.filter_by(username=username_or_email).first()
    
    # Verify user exists and password is correct
    if not user or not user.check_password(password):
        # Log failed login attempt
        log_audit_event(
            action="login_attempt",
            user_id=user.id if user else None,
            status="failure",
            details={"reason": "Invalid credentials", "username_or_email": username_or_email}
        )
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Check if user is active
    if not user.is_active:
        log_audit_event(
            action="login_attempt",
            user_id=user.id,
            status="failure",
            details={"reason": "Account deactivated"}
        )
        return jsonify({"error": "Account is deactivated. Please contact admin."}), 403
    
    try:
        # Check if MFA is required for this user
        requires_mfa = user.requires_mfa()
        
        # If MFA is required but no token provided
        if requires_mfa and not mfa_token:
            # Return early with MFA required flag
            return jsonify({
                "message": "MFA required",
                "requires_mfa": True,
                "user_id": user.id,
                "temp_access_token": create_access_token(
                    identity=user.id,
                    additional_claims={"role": user.role, "mfa_required": True},
                    expires_delta=current_app.config.get('MFA_TOKEN_VALIDITY', 300)
                )
            }), 200
        
        # If MFA is required and token is provided, verify it
        if requires_mfa and mfa_token:
            # Verify MFA session
            session = MFASession.query.filter_by(
                token=mfa_token,
                user_id=user.id,
                used=False
            ).first()
            
            if not session or session.is_expired():
                log_audit_event(
                    action="mfa_verification",
                    user_id=user.id,
                    status="failure",
                    details={"reason": "Invalid or expired MFA token"}
                )
                return jsonify({
                    "error": "Invalid or expired MFA token",
                    "requires_mfa": True
                }), 403
            
            # Mark session as used
            session.mark_used()
        
        # Update last login time
        user.update_last_login()
        db.session.commit()
        
        # Create access and refresh tokens
        access_token = create_access_token(
            identity=user.id,
            additional_claims={"role": user.role}
        )
        refresh_token = create_refresh_token(identity=user.id)
        
        # Log successful login
        log_audit_event(
            action="login_success",
            user_id=user.id,
            details={"mfa_used": requires_mfa}
        )
        
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "mfa_enabled": user.mfa_enabled
            }
        }), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error during login: {e}")
        log_audit_event(
            action="login_attempt",
            user_id=user.id if user else None,
            status="failure",
            details={"reason": "Server error", "error": str(e)}
        )
        return jsonify({"error": "Login process failed"}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh an access token."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if not user.is_active:
            return jsonify({"error": "Account is deactivated"}), 403
        
        # Create new access token
        access_token = create_access_token(
            identity=current_user_id,
            additional_claims={"role": user.role}
        )
        
        return jsonify({"access_token": access_token}), 200
    
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        return jsonify({"error": "Token refresh failed"}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout a user by blacklisting their current token."""
    try:
        jwt_token = get_jwt()
        jti = jwt_token['jti']
        
        # Add token to blacklist
        blacklisted_token = BlacklistedToken(token=jti)
        db.session.add(blacklisted_token)
        db.session.commit()
        
        return jsonify({"message": "Successfully logged out"}), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error during logout: {e}")
        return jsonify({"error": "Logout failed"}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get the current user's profile."""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({"user": user.to_dict()}), 200
    
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        return jsonify({"error": "Failed to retrieve user profile"}), 500

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    """Test endpoint for JWT protection."""
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'user')
    
    return jsonify(
        logged_in_as=current_user_id,
        role=role,
        message="This is a protected endpoint"
    ), 200
