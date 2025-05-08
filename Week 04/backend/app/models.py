"""
Document schemas for Firestore collections.
"""
import os
import secrets
import pyotp
from datetime import datetime, timedelta
from enum import Enum
from werkzeug.security import generate_password_hash, check_password_hash
from cryptography.fernet import Fernet

class RoleEnum(str, Enum):
    ADMIN = 'admin'
    USER = 'user'
    VERIFIER = 'verifier'

# Create encryption key
def get_encryption_key():
    """Get or create encryption key for sensitive data."""
    key = os.environ.get('ENCRYPTION_KEY')
    if not key:
        # In production, this should be set as an environment variable
        # For development, we generate a key and store it
        key = Fernet.generate_key().decode()
        # In a real app, save this key securely
    return key

# Initialize encryption
encryption_key = get_encryption_key()
cipher_suite = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)

def encrypt_data(data):
    """Encrypt sensitive data."""
    if not data:
        return None
    return cipher_suite.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data):
    """Decrypt sensitive data."""
    if not encrypted_data:
        return None
    try:
        return cipher_suite.decrypt(encrypted_data.encode()).decode()
    except Exception:
        return None

# Document schemas
USER_SCHEMA = {
    'email': str,
    'password': str,  # Hashed password
    'firstName': str,
    'lastName': str,
    'role': str,  # RoleEnum
    'is_active': bool,
    'mfa_enabled': bool,
    'mfa_verified': bool,
    'mfa_secret': str,  # Encrypted
    'mfa_backup_codes': list,  # List of dicts with 'code' and 'used' fields
    'created_at': datetime,
    'last_login': datetime,
    'login_attempts': int,
    'last_login_attempt': datetime,
    'account_locked_until': datetime,
    'password_changed_at': datetime,
    'security_questions': list,
    'session_tokens': list
}

VERIFICATION_PROFILE_SCHEMA = {
    'user_id': str,
    'full_name': str,  # Encrypted
    'id_type': str,  # Encrypted
    'id_number': str,  # Encrypted
    'date_of_birth': datetime,
    'verification_status': str,  # pending, verified, rejected
    'verification_notes': str,
    'created_at': datetime,
    'verified_at': datetime,
    'verified_by_admin_id': str,
    'document_hash': str,
    'risk_score': float,
    'id_document_front': str,  # Encrypted base64 image
    'id_document_back': str,  # Encrypted base64 image
    'selfie_image': str  # Encrypted base64 image
}

MFA_SESSION_SCHEMA = {
    'user_id': str,
    'token': str,
    'created_at': datetime,
    'expires_at': datetime,
    'used': bool
}

AUDIT_LOG_SCHEMA = {
    'user_id': str,
    'action': str,
    'resource_type': str,
    'resource_id': str,
    'details': str,
    'ip_address': str,
    'user_agent': str,
    'status': str,
    'created_at': datetime
}

BLACKLISTED_TOKEN_SCHEMA = {
    'token': str,
    'blacklisted_on': datetime
}

# Helper functions for document operations
def create_user_document(data):
    """Create a new user document with proper encryption."""
    document = {}
    for field, field_type in USER_SCHEMA.items():
        if field in data:
            if field in ['mfa_secret']:
                document[field] = encrypt_data(data[field])
            elif field in ['password']:
                document[field] = generate_password_hash(data[field])
            else:
                document[field] = data[field]
    
    # Set default values for required fields
    document.setdefault('role', RoleEnum.USER.value)
    document.setdefault('is_active', True)
    document.setdefault('mfa_enabled', False)
    document.setdefault('mfa_verified', False)
    document.setdefault('created_at', datetime.utcnow())
    document.setdefault('login_attempts', 0)
    document.setdefault('security_questions', [])
    document.setdefault('session_tokens', [])
    
    return document

def create_verification_profile_document(data):
    """Create a new verification profile document with proper encryption."""
    document = {}
    for field, field_type in VERIFICATION_PROFILE_SCHEMA.items():
        if field in data:
            if field in ['full_name', 'id_type', 'id_number']:
                document[field] = encrypt_data(data[field])
            elif field in ['id_document_front', 'id_document_back', 'selfie_image']:
                document[field] = encrypt_data(data[field]) if data[field] else None
            else:
                document[field] = data[field]
    
    # Set default values for required fields
    document.setdefault('verification_status', 'pending')
    document.setdefault('created_at', datetime.utcnow())
    
    return document

def create_mfa_session_document(user_id):
    """Create a new MFA session document."""
    expires_delta = timedelta(minutes=5)  # 5 minutes validity
    return {
        'user_id': user_id,
        'token': secrets.token_urlsafe(32),
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + expires_delta,
        'used': False
    }

def create_audit_log_document(data):
    """Create a new audit log document."""
    document = {}
    for field, field_type in AUDIT_LOG_SCHEMA.items():
        if field in data:
            document[field] = data[field]
    
    # Set default values
    document.setdefault('status', 'success')
    document.setdefault('created_at', datetime.utcnow())
    
    return document

def create_blacklisted_token_document(token):
    """Create a new blacklisted token document."""
    return {
        'token': token,
        'blacklisted_on': datetime.utcnow()
    }
