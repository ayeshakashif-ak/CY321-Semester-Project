"""
Security utilities for audit logging and secure operations.
"""
import hashlib
import json
from flask import request, current_app, g
from app import db
from app.models import AuditLog

def log_audit_event(action, user_id=None, resource_type=None, resource_id=None,
                    details=None, status="success"):
    """
    Log an audit event for security tracking.
    
    Args:
        action (str): The action being performed (e.g., "login", "access_document")
        user_id (int, optional): User ID performing the action
        resource_type (str, optional): Type of resource being acted upon
        resource_id (int, optional): ID of resource being acted upon
        details (dict, optional): Additional details about the action
        status (str, optional): Status of the action (success, failure)
    """
    # If no user_id provided but we have a current user, use that
    if user_id is None and hasattr(g, 'current_user_id'):
        user_id = g.current_user_id
        
    # Format details as JSON if it's a dict
    details_str = None
    if details:
        if isinstance(details, dict):
            # Remove sensitive data
            sanitized = details.copy()
            for key in ['password', 'token', 'secret', 'document', 'image']:
                if key in sanitized:
                    sanitized[key] = '[REDACTED]'
            details_str = json.dumps(sanitized)
        else:
            details_str = str(details)
            
    # Create log entry
    log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details_str,
        ip_address=request.remote_addr if request else None,
        user_agent=request.user_agent.string if request and request.user_agent else None,
        status=status
    )
    
    # Add to session and commit
    db.session.add(log)
    db.session.commit()
    
    # Log to application logs if enabled
    if current_app.config.get('SECURITY_LOG_TO_STDOUT', False):
        current_app.logger.info(f"AUDIT: {action} | User: {user_id} | "
                               f"Resource: {resource_type}:{resource_id} | "
                               f"Status: {status}")
    
    return log

def compute_document_hash(document_data):
    """
    Compute a secure hash of document data for integrity verification.
    
    Args:
        document_data (bytes or str): Document data to hash
        
    Returns:
        str: SHA-256 hash of the data
    """
    if isinstance(document_data, str):
        document_data = document_data.encode()
        
    return hashlib.sha256(document_data).hexdigest()

def verify_document_integrity(document_data, stored_hash):
    """
    Verify document integrity by comparing hashes.
    
    Args:
        document_data (bytes or str): Document data to verify
        stored_hash (str): Previously stored hash
        
    Returns:
        bool: True if the document is verified, False otherwise
    """
    if not document_data or not stored_hash:
        return False
        
    current_hash = compute_document_hash(document_data)
    return current_hash == stored_hash

def require_mfa(view_function):
    """
    Decorator to require MFA verification for sensitive endpoints.
    
    This should be used after the jwt_required decorator.
    """
    from functools import wraps
    from flask_jwt_extended import get_jwt_identity
    from app.models import User, MFASession
    
    @wraps(view_function)
    def decorated(*args, **kwargs):
        # Get current user from JWT
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return {"error": "User not found"}, 404
        
        # Check if MFA is required
        if user.requires_mfa():
            # Check for MFA session token
            mfa_token = request.headers.get('X-MFA-TOKEN')
            if not mfa_token:
                return {
                    "error": "MFA verification required",
                    "requires_mfa": True
                }, 403
                
            # Verify MFA session
            session = MFASession.query.filter_by(
                token=mfa_token,
                user_id=current_user_id,
                used=False
            ).first()
            
            if not session or session.is_expired():
                return {
                    "error": "Invalid or expired MFA session",
                    "requires_mfa": True
                }, 403
                
            # Mark session as used
            session.mark_used()
            db.session.commit()
        
        # If MFA not required or verification successful, proceed
        return view_function(*args, **kwargs)
    
    return decorated