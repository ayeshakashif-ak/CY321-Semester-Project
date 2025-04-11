import logging
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import User, VerificationProfile
from app.utils.auth_utils import role_required
from app.utils.verification_utils import simulate_ai_verification

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
verification_bp = Blueprint('verification', __name__)

@verification_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit_verification():
    """Submit verification profile for the current user."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    # Validate required fields
    required_fields = ['full_name', 'id_type', 'id_number', 'date_of_birth']
    if not all(field in data for field in required_fields):
        return jsonify({"error": f"Missing required fields. Required: {', '.join(required_fields)}"}), 400
    
    try:
        # Check if user already has a verification profile
        existing_profile = VerificationProfile.query.filter_by(user_id=current_user_id).first()
        if existing_profile:
            # If already verified or pending, don't allow resubmission
            if existing_profile.verification_status in ['verified', 'pending']:
                return jsonify({
                    "error": f"You already have a {existing_profile.verification_status} verification profile."
                }), 409
            
            # Update existing profile if rejected
            for field in data:
                if hasattr(existing_profile, field):
                    setattr(existing_profile, field, data[field])
            
            existing_profile.verification_status = 'pending'
            existing_profile.verification_notes = None
            existing_profile.verified_at = None
            db.session.commit()
            
            return jsonify({
                "message": "Verification profile resubmitted successfully",
                "profile": existing_profile.to_dict()
            }), 200
        
        # Parse date of birth
        try:
            date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid date format for date_of_birth. Use YYYY-MM-DD."}), 400
        
        # Create new verification profile
        new_profile = VerificationProfile(
            user_id=current_user_id,
            full_name=data['full_name'],
            id_type=data['id_type'],
            id_number=data['id_number'],
            date_of_birth=date_of_birth,
            verification_status='pending'
        )
        
        db.session.add(new_profile)
        db.session.commit()
        
        return jsonify({
            "message": "Verification profile submitted successfully",
            "profile": new_profile.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error submitting verification profile: {e}")
        return jsonify({"error": "Failed to submit verification profile"}), 500

@verification_bp.route('/status', methods=['GET'])
@jwt_required()
def get_verification_status():
    """Get verification status for the current user."""
    current_user_id = get_jwt_identity()
    
    try:
        profile = VerificationProfile.query.filter_by(user_id=current_user_id).first()
        
        if not profile:
            return jsonify({
                "verification_status": "not_submitted",
                "message": "No verification profile found"
            }), 200
        
        return jsonify({
            "verification_status": profile.verification_status,
            "profile": profile.to_dict()
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting verification status: {e}")
        return jsonify({"error": "Failed to retrieve verification status"}), 500

@verification_bp.route('/verify/<int:profile_id>', methods=['POST'])
@jwt_required()
@role_required(['admin', 'verifier'])
def verify_profile(profile_id):
    """Verify a user's profile (admin and verifier only)."""
    data = request.get_json() or {}
    
    # Get decision from request
    decision = data.get('decision')
    if decision not in ['approve', 'reject', 'ai_verify']:
        return jsonify({"error": "Invalid decision. Must be 'approve', 'reject', or 'ai_verify'."}), 400
    
    try:
        profile = VerificationProfile.query.get(profile_id)
        if not profile:
            return jsonify({"error": "Verification profile not found"}), 404
        
        if profile.verification_status != 'pending':
            return jsonify({"error": f"Profile is already {profile.verification_status}"}), 400
        
        if decision == 'ai_verify':
            # Simulate AI verification
            ai_result = simulate_ai_verification(profile)
            profile.verification_status = ai_result['status']
            profile.verification_notes = ai_result['notes']
        else:
            # Manual verification
            profile.verification_status = 'verified' if decision == 'approve' else 'rejected'
            profile.verification_notes = data.get('notes')
        
        # Update verification timestamp if approved
        if profile.verification_status == 'verified':
            profile.verified_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": f"Profile {profile.verification_status}",
            "profile": profile.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error verifying profile: {e}")
        return jsonify({"error": "Failed to verify profile"}), 500

@verification_bp.route('/profiles/<int:profile_id>', methods=['GET'])
@jwt_required()
def get_verification_profile(profile_id):
    """Get a specific verification profile."""
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'user')
    
    try:
        profile = VerificationProfile.query.get(profile_id)
        if not profile:
            return jsonify({"error": "Verification profile not found"}), 404
        
        # Only allow users to view their own profile unless they're admin or verifier
        if current_user_id != profile.user_id and role not in ['admin', 'verifier']:
            return jsonify({"error": "Unauthorized access"}), 403
        
        # Get user data
        user = User.query.get(profile.user_id)
        
        response_data = profile.to_dict()
        response_data['user'] = user.to_dict() if user else None
        
        return jsonify(response_data), 200
    
    except Exception as e:
        logger.error(f"Error getting verification profile: {e}")
        return jsonify({"error": "Failed to retrieve verification profile"}), 500
