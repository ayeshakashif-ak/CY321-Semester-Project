"""
Routes for multi-factor authentication (MFA) functionality.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models import User, MFASession
from app.utils.mfa_utils import (
    generate_totp_qr_code, verify_totp, create_mfa_session
)
from app.utils.security_utils import log_audit_event

# Blueprint registration
mfa_bp = Blueprint('mfa', __name__, url_prefix='/api/mfa')

@mfa_bp.route('/setup', methods=['POST'])
@jwt_required()
def setup_mfa():
    """
    Begin MFA setup process for a user.
    
    This endpoint generates and returns the TOTP secret and QR code
    but does not enable MFA until verification.
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Generate new secret if needed
    secret = user.generate_mfa_secret()
    
    # Generate QR code URI for authenticator app
    uri = user.get_totp_uri()
    qr_code = generate_totp_qr_code(uri)
    
    # Update but don't enable MFA yet (requires verification)
    db.session.commit()
    
    # Log the attempt
    log_audit_event(
        action="mfa_setup_initiated",
        user_id=current_user_id,
        details={"success": True}
    )
    
    return jsonify({
        "secret": secret,
        "qr_code": qr_code,
        "message": "Scan this QR code with your authenticator app, then verify with a code"
    }), 200

@mfa_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_mfa_setup():
    """
    Verify and enable MFA for a user after setup.
    
    This endpoint verifies the provided TOTP token against
    the user's MFA secret and enables MFA if valid.
    """
    data = request.get_json()
    if not data or 'token' not in data:
        return jsonify({"error": "Token is required"}), 400
    
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Verify the provided token
    token = data['token']
    if not user.verify_totp(token):
        log_audit_event(
            action="mfa_setup_verification",
            user_id=current_user_id,
            status="failure",
            details={"reason": "Invalid token"}
        )
        return jsonify({"error": "Invalid verification code"}), 400
    
    # Enable MFA for the user
    user.mfa_enabled = True
    user.mfa_verified = True
    
    # Generate backup codes if not generating later
    backup_codes = data.get('generate_backup_codes', True)
    codes = None
    
    if backup_codes:
        codes = user.generate_backup_codes(count=10)
    
    # Save changes
    db.session.commit()
    
    # Log the successful setup
    log_audit_event(
        action="mfa_setup_complete",
        user_id=current_user_id,
        details={"backup_codes_generated": backup_codes}
    )
    
    result = {
        "success": True,
        "message": "MFA has been successfully enabled for your account"
    }
    
    if codes:
        result["backup_codes"] = codes
        result["message"] += ". Please save these backup codes in a safe place."
    
    return jsonify(result), 200

@mfa_bp.route('/disable', methods=['POST'])
@jwt_required()
def disable_mfa():
    """Disable MFA for a user account."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    # Require password verification for security
    password = data.get('password')
    if not password:
        return jsonify({"error": "Password is required to disable MFA"}), 400
    
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Verify password
    if not user.check_password(password):
        log_audit_event(
            action="mfa_disable_attempt",
            user_id=current_user_id,
            status="failure",
            details={"reason": "Invalid password"}
        )
        return jsonify({"error": "Invalid password"}), 401
    
    # Check if user is in a role that requires MFA
    required_roles = current_app.config.get('MFA_REQUIRED_FOR_ROLES', [])
    if user.role in required_roles:
        log_audit_event(
            action="mfa_disable_attempt",
            user_id=current_user_id,
            status="failure",
            details={"reason": "MFA required for role"}
        )
        return jsonify({
            "error": "MFA cannot be disabled for your account role"
        }), 403
    
    # Disable MFA
    user.mfa_enabled = False
    user.mfa_verified = False
    user.mfa_secret = None
    user.mfa_backup_codes = None
    
    # Save changes
    db.session.commit()
    
    # Log the action
    log_audit_event(
        action="mfa_disabled",
        user_id=current_user_id
    )
    
    return jsonify({
        "success": True,
        "message": "MFA has been disabled for your account"
    }), 200

@mfa_bp.route('/verify-token', methods=['POST'])
@jwt_required()
def verify_mfa_token():
    """
    Verify a TOTP token for MFA and create a session.
    
    This endpoint is used during the login flow when MFA is enabled.
    """
    data = request.get_json()
    if not data or 'token' not in data:
        return jsonify({"error": "Token is required"}), 400
    
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Check if MFA is enabled
    if not user.mfa_enabled:
        return jsonify({"error": "MFA is not enabled for this account"}), 400
    
    # Verify the token or backup code
    token = data['token']
    token_type = data.get('token_type', 'totp')
    verified = False
    
    if token_type == 'totp':
        verified = user.verify_totp(token)
    elif token_type == 'backup':
        verified = user.verify_backup_code(token)
    
    if not verified:
        log_audit_event(
            action="mfa_verification",
            user_id=current_user_id,
            status="failure",
            details={"token_type": token_type}
        )
        return jsonify({"error": "Invalid verification code"}), 400
    
    # Create MFA session
    mfa_token = create_mfa_session(current_user_id)
    
    # Log successful verification
    log_audit_event(
        action="mfa_verification",
        user_id=current_user_id,
        details={"token_type": token_type}
    )
    
    return jsonify({
        "success": True,
        "mfa_token": mfa_token,
        "message": "MFA verification successful"
    }), 200

@mfa_bp.route('/status', methods=['GET'])
@jwt_required()
def mfa_status():
    """Get the MFA status for the current user."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "mfa_enabled": user.mfa_enabled,
        "mfa_verified": user.mfa_verified,
        "requires_mfa": user.requires_mfa()
    }), 200

@mfa_bp.route('/generate-backup-codes', methods=['POST'])
@jwt_required()
def generate_backup_codes():
    """Generate new backup codes for MFA recovery."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    # Require password verification for security
    password = data.get('password')
    if not password:
        return jsonify({"error": "Password is required to generate backup codes"}), 400
    
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Verify password
    if not user.check_password(password):
        log_audit_event(
            action="backup_codes_generation",
            user_id=current_user_id,
            status="failure",
            details={"reason": "Invalid password"}
        )
        return jsonify({"error": "Invalid password"}), 401
    
    # Check if MFA is enabled
    if not user.mfa_enabled:
        return jsonify({"error": "MFA is not enabled for this account"}), 400
    
    # Generate new backup codes
    count = data.get('count', 10)
    codes = user.generate_backup_codes(count=count)
    
    # Save changes
    db.session.commit()
    
    # Log the action
    log_audit_event(
        action="backup_codes_generated",
        user_id=current_user_id,
        details={"count": count}
    )
    
    return jsonify({
        "success": True,
        "backup_codes": codes,
        "message": "New backup codes have been generated. Please save these in a safe place."
    }), 200