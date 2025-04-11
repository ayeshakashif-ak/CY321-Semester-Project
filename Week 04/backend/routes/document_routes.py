"""
Routes for secure document handling and validation.
"""
import logging
import base64
import hashlib
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models import User, VerificationProfile
from app.utils.auth_utils import role_required
from app.utils.security_utils import log_audit_event, require_mfa, compute_document_hash, verify_document_integrity
from app.utils.verification_utils import simulate_ai_verification

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
doc_bp = Blueprint('documents', __name__, url_prefix='/api/documents')

@doc_bp.route('/upload', methods=['POST'])
@jwt_required()
@require_mfa
def upload_documents():
    """
    Upload identity verification documents securely.
    
    This endpoint accepts front and back images of ID documents
    and a selfie for biometric verification. All documents are
    encrypted before storage.
    """
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    # Validate required document fields
    required_fields = ['id_front', 'id_type', 'full_name', 'id_number', 'date_of_birth']
    if not all(field in data for field in required_fields):
        return jsonify({
            "error": "Missing required fields",
            "required": required_fields
        }), 400
    
    try:
        # Check if user already has a verification profile
        existing_profile = VerificationProfile.query.filter_by(user_id=current_user_id).first()
        
        if existing_profile and existing_profile.verification_status != 'rejected':
            log_audit_event(
                action="document_upload",
                user_id=current_user_id,
                status="failure",
                details={"reason": f"Verification already {existing_profile.verification_status}"}
            )
            return jsonify({
                "error": f"You already have a {existing_profile.verification_status} verification profile",
                "status": existing_profile.verification_status
            }), 400
        
        # Create or update verification profile
        if existing_profile:
            profile = existing_profile
            # Reset status if previously rejected
            profile.verification_status = 'pending'
        else:
            profile = VerificationProfile(user_id=current_user_id)
        
        # Set basic information (will be encrypted by the model)
        profile.full_name = data['full_name']
        profile.id_type = data['id_type']
        profile.id_number = data['id_number']
        
        # Parse and set date of birth
        from datetime import datetime
        try:
            profile.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        
        # Process ID document front image
        if 'id_front' in data:
            id_front_data = data['id_front']
            if not id_front_data.startswith('data:image/'):
                return jsonify({"error": "ID front must be a base64 encoded image"}), 400
            
            # Compute document hash for integrity verification
            doc_hash = compute_document_hash(id_front_data)
            profile.document_hash = doc_hash
            
            # Store encrypted document
            profile.store_document_front(id_front_data)
        
        # Process ID document back image (optional)
        if 'id_back' in data:
            id_back_data = data['id_back']
            if not id_back_data.startswith('data:image/'):
                return jsonify({"error": "ID back must be a base64 encoded image"}), 400
            
            # Store encrypted document
            profile.store_document_back(id_back_data)
        
        # Process selfie image (optional but recommended)
        if 'selfie' in data:
            selfie_data = data['selfie']
            if not selfie_data.startswith('data:image/'):
                return jsonify({"error": "Selfie must be a base64 encoded image"}), 400
            
            # Store encrypted selfie
            profile.store_selfie(selfie_data)
        
        # Set verification status
        profile.verification_status = 'pending'
        
        # If configured, perform automated AI verification
        if current_app.config.get('ENABLE_AUTO_VERIFICATION', False):
            # This would call an actual AI service in production
            verification_result = simulate_ai_verification(profile)
            profile.risk_score = verification_result.get('risk_score')
            profile.verification_notes = verification_result.get('notes')
            
            # Auto-approve low risk scores if configured
            auto_approve_threshold = current_app.config.get('AUTO_APPROVE_THRESHOLD', 0)
            if profile.risk_score is not None and profile.risk_score <= auto_approve_threshold:
                profile.verification_status = 'verified'
                profile.verified_at = datetime.utcnow()
                profile.verified_by_admin_id = None  # Indicate automated verification
        
        # Save to database
        db.session.add(profile)
        db.session.commit()
        
        # Log successful document upload
        log_audit_event(
            action="document_upload",
            user_id=current_user_id,
            resource_type="verification_profile",
            resource_id=profile.id,
            details={"id_type": profile.id_type}
        )
        
        return jsonify({
            "message": "Documents uploaded successfully",
            "verification_status": profile.verification_status,
            "profile_id": profile.id
        }), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error uploading documents: {e}")
        
        log_audit_event(
            action="document_upload",
            user_id=current_user_id,
            status="failure",
            details={"error": str(e)}
        )
        
        return jsonify({"error": "Failed to upload documents"}), 500

@doc_bp.route('/verify/<int:profile_id>', methods=['POST'])
@jwt_required()
@role_required(['admin', 'verifier'])
@require_mfa
def verify_document(profile_id):
    """
    Verify a user's document (admin or verifier only).
    
    This endpoint allows admins and verifiers to review and
    approve or reject verification profiles.
    """
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    # Validate decision
    decision = data.get('decision')
    if not decision or decision not in ['approve', 'reject']:
        return jsonify({"error": "Decision must be 'approve' or 'reject'"}), 400
    
    try:
        # Get verification profile
        profile = VerificationProfile.query.get(profile_id)
        if not profile:
            log_audit_event(
                action="document_verification",
                user_id=current_user_id,
                resource_type="verification_profile",
                resource_id=profile_id,
                status="failure",
                details={"reason": "Profile not found"}
            )
            return jsonify({"error": "Verification profile not found"}), 404
        
        # Check if profile is already verified/rejected
        if profile.verification_status != 'pending':
            log_audit_event(
                action="document_verification",
                user_id=current_user_id,
                resource_type="verification_profile",
                resource_id=profile_id,
                status="failure",
                details={"reason": f"Already {profile.verification_status}"}
            )
            return jsonify({
                "error": f"Profile is already {profile.verification_status}",
                "status": profile.verification_status
            }), 400
        
        # Update verification status
        if decision == 'approve':
            profile.verification_status = 'verified'
        else:
            profile.verification_status = 'rejected'
        
        # Add notes if provided
        if 'notes' in data:
            profile.verification_notes = data['notes']
        
        # Set verification metadata
        from datetime import datetime
        profile.verified_at = datetime.utcnow()
        profile.verified_by_admin_id = current_user_id
        
        # Save changes
        db.session.commit()
        
        # Log the verification decision
        log_audit_event(
            action=f"document_{decision}d",
            user_id=current_user_id,
            resource_type="verification_profile",
            resource_id=profile_id,
            details={
                "user_id": profile.user_id,
                "notes": profile.verification_notes
            }
        )
        
        return jsonify({
            "message": f"Verification profile {decision}d successfully",
            "profile_id": profile.id,
            "status": profile.verification_status
        }), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error verifying document: {e}")
        
        log_audit_event(
            action="document_verification",
            user_id=current_user_id,
            resource_type="verification_profile",
            resource_id=profile_id,
            status="failure",
            details={"error": str(e)}
        )
        
        return jsonify({"error": "Failed to verify document"}), 500

@doc_bp.route('/status', methods=['GET'])
@jwt_required()
def get_verification_status():
    """Get the current user's verification status."""
    current_user_id = get_jwt_identity()
    
    try:
        # Find user's verification profile
        profile = VerificationProfile.query.filter_by(user_id=current_user_id).first()
        
        if not profile:
            return jsonify({
                "has_profile": False,
                "verification_status": "not_submitted"
            }), 200
        
        return jsonify({
            "has_profile": True,
            "verification_status": profile.verification_status,
            "submitted_at": profile.created_at.isoformat() if profile.created_at else None,
            "verified_at": profile.verified_at.isoformat() if profile.verified_at else None,
            "notes": profile.verification_notes
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting verification status: {e}")
        return jsonify({"error": "Failed to get verification status"}), 500

@doc_bp.route('/retrieve/<int:profile_id>', methods=['GET'])
@jwt_required()
@role_required(['admin', 'verifier'])
@require_mfa
def retrieve_document(profile_id):
    """
    Retrieve document images for verification (admin or verifier only).
    
    This endpoint allows authorized personnel to retrieve decrypted
    documents for verification purposes. This action is logged
    for security and compliance.
    """
    current_user_id = get_jwt_identity()
    
    try:
        # Get verification profile
        profile = VerificationProfile.query.get(profile_id)
        if not profile:
            log_audit_event(
                action="document_retrieval",
                user_id=current_user_id,
                resource_type="verification_profile",
                resource_id=profile_id,
                status="failure",
                details={"reason": "Profile not found"}
            )
            return jsonify({"error": "Verification profile not found"}), 404
        
        # Log the document access
        log_audit_event(
            action="document_retrieval",
            user_id=current_user_id,
            resource_type="verification_profile",
            resource_id=profile_id,
            details={"user_id": profile.user_id}
        )
        
        # Get decrypted documents
        result = profile.to_dict(include_documents=True)
        
        # Check document integrity if hash exists
        if profile.document_hash and profile.id_document_front:
            front_doc = profile.get_document_front()
            is_valid = verify_document_integrity(front_doc, profile.document_hash)
            result['document_integrity_valid'] = is_valid
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Error retrieving documents: {e}")
        
        log_audit_event(
            action="document_retrieval",
            user_id=current_user_id,
            resource_type="verification_profile",
            resource_id=profile_id,
            status="failure",
            details={"error": str(e)}
        )
        
        return jsonify({"error": "Failed to retrieve documents"}), 500