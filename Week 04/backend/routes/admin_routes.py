import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, VerificationProfile
from app.utils.auth_utils import role_required
from app.utils.security_utils import log_audit_event, require_mfa

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@role_required('admin')
def admin_dashboard():
    """Admin dashboard with system statistics."""
    try:
        # Count statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        
        # Verification stats
        pending_verifications = VerificationProfile.query.filter_by(verification_status='pending').count()
        verified_users = VerificationProfile.query.filter_by(verification_status='verified').count()
        rejected_users = VerificationProfile.query.filter_by(verification_status='rejected').count()
        
        # User role distribution
        admin_count = User.query.filter_by(role='admin').count()
        user_count = User.query.filter_by(role='user').count()
        verifier_count = User.query.filter_by(role='verifier').count()
        
        return jsonify({
            "user_stats": {
                "total": total_users,
                "active": active_users,
                "inactive": total_users - active_users
            },
            "verification_stats": {
                "pending": pending_verifications,
                "verified": verified_users,
                "rejected": rejected_users,
                "total": pending_verifications + verified_users + rejected_users
            },
            "role_distribution": {
                "admin": admin_count,
                "user": user_count,
                "verifier": verifier_count
            }
        }), 200
    
    except Exception as e:
        logger.error(f"Error in admin dashboard: {e}")
        return jsonify({"error": "Failed to load admin dashboard data"}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@role_required('admin')
@require_mfa
def update_user(user_id):
    """Update user details (admin only)."""
    data = request.get_json()
    current_admin_id = get_jwt_identity()
    
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    try:
        user = User.query.get(user_id)
        if not user:
            log_audit_event(
                action="admin_update_user",
                user_id=current_admin_id,
                resource_type="user",
                resource_id=user_id,
                status="failure",
                details={"reason": "User not found"}
            )
            return jsonify({"error": "User not found"}), 404
        
        # Log the admin action
        log_audit_event(
            action="admin_update_user_initiated",
            user_id=current_admin_id,
            resource_type="user",
            resource_id=user_id,
            details={"changed_fields": list(data.keys())}
        )
        
        # Update fields if they exist in the request
        if 'email' in data:
            # Check if email already exists for another user
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user_id:
                log_audit_event(
                    action="admin_update_user",
                    user_id=current_admin_id,
                    resource_type="user",
                    resource_id=user_id,
                    status="failure",
                    details={"reason": "Email already in use", "attempted_email": data['email']}
                )
                return jsonify({"error": "Email already in use"}), 409
            old_email = user.email
            user.email = data['email']
            log_audit_event(
                action="admin_changed_user_email",
                user_id=current_admin_id,
                resource_type="user",
                resource_id=user_id,
                details={"old_email": old_email, "new_email": data['email']}
            )
        
        if 'username' in data:
            # Check if username already exists for another user
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user and existing_user.id != user_id:
                log_audit_event(
                    action="admin_update_user",
                    user_id=current_admin_id,
                    resource_type="user",
                    resource_id=user_id,
                    status="failure",
                    details={"reason": "Username already in use", "attempted_username": data['username']}
                )
                return jsonify({"error": "Username already in use"}), 409
            old_username = user.username
            user.username = data['username']
            log_audit_event(
                action="admin_changed_user_username",
                user_id=current_admin_id,
                resource_type="user",
                resource_id=user_id,
                details={"old_username": old_username, "new_username": data['username']}
            )
        
        if 'role' in data:
            # Validate role
            if data['role'] not in ['admin', 'user', 'verifier']:
                log_audit_event(
                    action="admin_update_user",
                    user_id=current_admin_id,
                    resource_type="user",
                    resource_id=user_id,
                    status="failure",
                    details={"reason": "Invalid role", "attempted_role": data['role']}
                )
                return jsonify({"error": "Invalid role"}), 400
            old_role = user.role
            user.role = data['role']
            log_audit_event(
                action="admin_changed_user_role",
                user_id=current_admin_id,
                resource_type="user",
                resource_id=user_id,
                details={"old_role": old_role, "new_role": data['role']}
            )
        
        if 'is_active' in data:
            old_status = user.is_active
            user.is_active = bool(data['is_active'])
            log_audit_event(
                action="admin_changed_user_status",
                user_id=current_admin_id,
                resource_type="user",
                resource_id=user_id,
                details={"old_status": old_status, "new_status": user.is_active}
            )
        
        db.session.commit()
        
        log_audit_event(
            action="admin_update_user_success",
            user_id=current_admin_id,
            resource_type="user",
            resource_id=user_id
        )
        
        return jsonify({"message": "User updated successfully", "user": user.to_dict()}), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating user: {e}")
        
        log_audit_event(
            action="admin_update_user",
            user_id=current_admin_id,
            resource_type="user",
            resource_id=user_id,
            status="failure",
            details={"error": str(e)}
        )
        
        return jsonify({"error": "Failed to update user"}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
@require_mfa
def delete_user(user_id):
    """Delete a user (admin only)."""
    current_admin_id = get_jwt_identity()
    
    try:
        user = User.query.get(user_id)
        if not user:
            log_audit_event(
                action="admin_delete_user",
                user_id=current_admin_id,
                resource_type="user",
                resource_id=user_id,
                status="failure",
                details={"reason": "User not found"}
            )
            return jsonify({"error": "User not found"}), 404
        
        # Check if admin is trying to delete themselves
        if user_id == current_admin_id:
            log_audit_event(
                action="admin_delete_user",
                user_id=current_admin_id,
                resource_type="user",
                resource_id=user_id,
                status="failure",
                details={"reason": "Cannot delete self"}
            )
            return jsonify({"error": "Cannot delete your own account"}), 403
        
        # Log the delete attempt
        log_audit_event(
            action="admin_delete_user_initiated",
            user_id=current_admin_id,
            resource_type="user",
            resource_id=user_id,
            details={"username": user.username, "email": user.email, "role": user.role}
        )
        
        # Delete all verification profiles
        VerificationProfile.query.filter_by(user_id=user_id).delete()
        
        # Delete user
        db.session.delete(user)
        db.session.commit()
        
        # Log successful deletion
        log_audit_event(
            action="admin_delete_user_success",
            user_id=current_admin_id,
            resource_type="user",
            resource_id=user_id
        )
        
        return jsonify({"message": "User deleted successfully"}), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting user: {e}")
        
        log_audit_event(
            action="admin_delete_user",
            user_id=current_admin_id,
            resource_type="user",
            resource_id=user_id,
            status="failure",
            details={"error": str(e)}
        )
        
        return jsonify({"error": "Failed to delete user"}), 500

@admin_bp.route('/users', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_user():
    """Create a new user (admin only)."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    # Validate required fields
    if not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({"error": "Username, email, and password are required"}), 400
    
    # Check if username already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already exists"}), 409
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already exists"}), 409
    
    try:
        # Create new user
        role = data.get('role', 'user')
        if role not in ['admin', 'user', 'verifier']:
            return jsonify({"error": "Invalid role"}), 400
        
        new_user = User(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            role=role
        )
        
        if 'is_active' in data:
            new_user.is_active = bool(data['is_active'])
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({"message": "User created successfully", "user": new_user.to_dict()}), 201
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating user: {e}")
        return jsonify({"error": "Failed to create user"}), 500

@admin_bp.route('/pending-verifications', methods=['GET'])
@jwt_required()
@role_required(['admin', 'verifier'])
def get_pending_verifications():
    """Get all pending verification requests."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Get paginated verification profiles
        pagination = VerificationProfile.query.filter_by(verification_status='pending') \
            .paginate(page=page, per_page=per_page)
        
        profiles = []
        for profile in pagination.items:
            user = User.query.get(profile.user_id)
            profile_data = profile.to_dict()
            profile_data['user'] = user.to_dict() if user else None
            profiles.append(profile_data)
        
        return jsonify({
            "verification_profiles": profiles,
            "total": pagination.total,
            "pages": pagination.pages,
            "page": page
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching verification profiles: {e}")
        return jsonify({"error": "Failed to retrieve verification profiles"}), 500
