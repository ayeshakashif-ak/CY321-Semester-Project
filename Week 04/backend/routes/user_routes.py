import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import User, VerificationProfile
from app.utils.auth_utils import validate_password, role_required
from app.utils.security_utils import log_audit_event, require_mfa

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
user_bp = Blueprint('user', __name__)

@user_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    """User dashboard endpoint."""
    current_user_id = get_jwt_identity()
    
    try:
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get verification status
        verification_profile = VerificationProfile.query.filter_by(user_id=current_user_id).first()
        verification_status = verification_profile.verification_status if verification_profile else "not_submitted"
        
        # Build dashboard data
        data = {
            "user": user.to_dict(),
            "verification_status": verification_status,
            "has_verification_profile": verification_profile is not None
        }
        
        if verification_profile:
            data["verification_profile"] = verification_profile.to_dict()
        
        return jsonify(data), 200
    
    except Exception as e:
        logger.error(f"Error in dashboard: {e}")
        return jsonify({"error": "Failed to load dashboard data"}), 500

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
@require_mfa
def update_profile():
    """Update user profile."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    try:
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Log the profile update attempt
        log_audit_event(
            action="profile_update_initiated",
            user_id=current_user_id,
            details={"changed_fields": list(data.keys())}
        )
        
        # Update fields if they exist in the request
        if 'email' in data:
            # Check if email already exists for another user
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != current_user_id:
                log_audit_event(
                    action="profile_update",
                    user_id=current_user_id,
                    status="failure",
                    details={"reason": "Email already in use", "attempted_email": data['email']}
                )
                return jsonify({"error": "Email already in use"}), 409
            old_email = user.email
            user.email = data['email']
            log_audit_event(
                action="email_changed",
                user_id=current_user_id,
                details={"old_email": old_email, "new_email": data['email']}
            )
        
        if 'username' in data:
            # Check if username already exists for another user
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user and existing_user.id != current_user_id:
                log_audit_event(
                    action="profile_update",
                    user_id=current_user_id,
                    status="failure",
                    details={"reason": "Username already in use", "attempted_username": data['username']}
                )
                return jsonify({"error": "Username already in use"}), 409
            old_username = user.username
            user.username = data['username']
            log_audit_event(
                action="username_changed",
                user_id=current_user_id,
                details={"old_username": old_username, "new_username": data['username']}
            )
        
        if 'password' in data:
            # Validate password
            password_validation = validate_password(data['password'])
            if not password_validation['valid']:
                log_audit_event(
                    action="password_change",
                    user_id=current_user_id,
                    status="failure",
                    details={"reason": "Invalid password format"}
                )
                return jsonify({"error": password_validation['message']}), 400
            
            # Verify current password if provided
            if 'current_password' in data:
                if not user.check_password(data['current_password']):
                    log_audit_event(
                        action="password_change",
                        user_id=current_user_id,
                        status="failure",
                        details={"reason": "Invalid current password"}
                    )
                    return jsonify({"error": "Current password is incorrect"}), 401
            else:
                log_audit_event(
                    action="password_change",
                    user_id=current_user_id,
                    status="failure",
                    details={"reason": "Current password not provided"}
                )
                return jsonify({"error": "Current password is required to change password"}), 400
            
            user.set_password(data['password'])
            log_audit_event(
                action="password_changed",
                user_id=current_user_id
            )
        
        db.session.commit()
        
        log_audit_event(
            action="profile_updated",
            user_id=current_user_id,
            status="success"
        )
        
        return jsonify({"message": "Profile updated successfully", "user": user.to_dict()}), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating profile: {e}")
        
        log_audit_event(
            action="profile_update",
            user_id=current_user_id,
            status="failure",
            details={"error": str(e)}
        )
        
        return jsonify({"error": "Failed to update profile"}), 500

@user_bp.route('/all', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_all_users():
    """Get all users (admin only)."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Get paginated users
        pagination = User.query.paginate(page=page, per_page=per_page)
        
        users = [user.to_dict() for user in pagination.items]
        
        return jsonify({
            "users": users,
            "total": pagination.total,
            "pages": pagination.pages,
            "page": page
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        return jsonify({"error": "Failed to retrieve users"}), 500

@user_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get a specific user."""
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'user')
    
    # Only allow users to view their own profile unless they're admin
    if current_user_id != user_id and role != 'admin':
        return jsonify({"error": "Unauthorized access"}), 403
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({"user": user.to_dict()}), 200
    
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return jsonify({"error": "Failed to retrieve user"}), 500
