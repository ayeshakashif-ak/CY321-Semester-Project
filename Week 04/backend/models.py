import os
import secrets
import pyotp
from datetime import datetime, timedelta
from enum import Enum
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.ext.hybrid import hybrid_property
from cryptography.fernet import Fernet
from app import db

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

class User(db.Model):
    """User model for authentication and user management."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default=RoleEnum.USER.value, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # MFA fields
    _mfa_secret = db.Column(db.String(256), nullable=True)
    mfa_enabled = db.Column(db.Boolean, default=False)
    mfa_verified = db.Column(db.Boolean, default=False)
    mfa_backup_codes = db.Column(db.Text, nullable=True)  # Store encrypted backup codes
    
    # Relationships
    verification_profiles = db.relationship('VerificationProfile', 
                                           foreign_keys='VerificationProfile.user_id',
                                           backref='user', lazy='dynamic')
    
    def __init__(self, username, email, password, role=RoleEnum.USER.value):
        self.username = username
        self.email = email
        self.set_password(password)
        self.role = role
    
    def set_password(self, password):
        """Set password hash."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash."""
        return check_password_hash(self.password_hash, password)
    
    def update_last_login(self):
        """Update the last login time."""
        self.last_login = datetime.utcnow()
    
    @hybrid_property
    def mfa_secret(self):
        """Decrypt and return MFA secret."""
        if self._mfa_secret:
            try:
                return cipher_suite.decrypt(self._mfa_secret.encode()).decode()
            except Exception:
                return None
        return None
    
    @mfa_secret.setter
    def mfa_secret(self, value):
        """Encrypt and store MFA secret."""
        if value:
            self._mfa_secret = cipher_suite.encrypt(value.encode()).decode()
        else:
            self._mfa_secret = None
    
    def generate_mfa_secret(self):
        """Generate a new MFA secret."""
        if not self.mfa_secret:
            self.mfa_secret = pyotp.random_base32()
        return self.mfa_secret
    
    def get_totp_uri(self):
        """Generate TOTP URI for QR code."""
        if self.mfa_secret:
            return pyotp.totp.TOTP(self.mfa_secret).provisioning_uri(
                name=self.email, 
                issuer_name="AI Identity Verification"
            )
        return None
    
    def verify_totp(self, token):
        """Verify TOTP token."""
        if not self.mfa_secret or not self.mfa_enabled:
            return False
        
        totp = pyotp.TOTP(self.mfa_secret)
        return totp.verify(token)
    
    def generate_backup_codes(self, count=10):
        """Generate backup codes for MFA recovery."""
        backup_codes = [secrets.token_hex(5).upper() for _ in range(count)]
        # Encrypt backup codes
        encrypted_codes = cipher_suite.encrypt(
            '\n'.join(backup_codes).encode()
        ).decode()
        self.mfa_backup_codes = encrypted_codes
        return backup_codes
    
    def verify_backup_code(self, code):
        """Verify a backup code and remove it if valid."""
        if not self.mfa_backup_codes:
            return False
        
        try:
            decrypted_codes = cipher_suite.decrypt(
                self.mfa_backup_codes.encode()
            ).decode()
            codes = decrypted_codes.split('\n')
            
            if code in codes:
                # Remove used code and update
                codes.remove(code)
                if codes:
                    self.mfa_backup_codes = cipher_suite.encrypt(
                        '\n'.join(codes).encode()
                    ).decode()
                else:
                    self.mfa_backup_codes = None
                return True
            return False
        except Exception:
            return False
    
    def requires_mfa(self):
        """Check if user requires MFA based on role."""
        from flask import current_app
        if not current_app.config.get('MFA_ENABLED', False):
            return False
        
        required_roles = current_app.config.get('MFA_REQUIRED_FOR_ROLES', [])
        return self.role in required_roles or self.mfa_enabled
        
    def to_dict(self):
        """Convert user object to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'mfa_enabled': self.mfa_enabled,
            'mfa_verified': self.mfa_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'

class VerificationProfile(db.Model):
    """Model for storing identity verification data."""
    __tablename__ = 'verification_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    _full_name = db.Column(db.String(256), nullable=False)  # Encrypted
    _id_type = db.Column(db.String(256), nullable=False)    # Encrypted
    _id_number = db.Column(db.String(256), nullable=False)  # Encrypted
    date_of_birth = db.Column(db.Date, nullable=False)
    verification_status = db.Column(db.String(20), default='pending')  # pending, verified, rejected
    verification_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    verified_at = db.Column(db.DateTime, nullable=True)
    verified_by_admin_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    document_hash = db.Column(db.String(128), nullable=True)  # Store hash of document for validation
    risk_score = db.Column(db.Float, nullable=True)  # AI-driven risk assessment score
    
    # Relationship for the admin/verifier who verified this profile
    verified_by = db.relationship('User', foreign_keys=[verified_by_admin_id])
    
    # Document data
    id_document_front = db.Column(db.Text, nullable=True)  # Encrypted base64 image
    id_document_back = db.Column(db.Text, nullable=True)   # Encrypted base64 image
    selfie_image = db.Column(db.Text, nullable=True)       # Encrypted base64 image
    
    @hybrid_property
    def full_name(self):
        """Decrypt full name."""
        if self._full_name:
            try:
                return cipher_suite.decrypt(self._full_name.encode()).decode()
            except Exception:
                return "[Encrypted]"
        return None
    
    @full_name.setter
    def full_name(self, value):
        """Encrypt full name."""
        if value:
            self._full_name = cipher_suite.encrypt(value.encode()).decode()
        else:
            self._full_name = None
    
    @hybrid_property
    def id_type(self):
        """Decrypt ID type."""
        if self._id_type:
            try:
                return cipher_suite.decrypt(self._id_type.encode()).decode()
            except Exception:
                return "[Encrypted]"
        return None
        
    @id_type.setter
    def id_type(self, value):
        """Encrypt ID type."""
        if value:
            self._id_type = cipher_suite.encrypt(value.encode()).decode()
        else:
            self._id_type = None
    
    @hybrid_property
    def id_number(self):
        """Decrypt ID number."""
        if self._id_number:
            try:
                return cipher_suite.decrypt(self._id_number.encode()).decode()
            except Exception:
                return "[Encrypted]"
        return None
        
    @id_number.setter
    def id_number(self, value):
        """Encrypt ID number."""
        if value:
            self._id_number = cipher_suite.encrypt(value.encode()).decode()
        else:
            self._id_number = None
    
    def encrypt_document(self, document_data):
        """Encrypt document data (base64 image)."""
        if document_data:
            return cipher_suite.encrypt(document_data.encode()).decode()
        return None
    
    def decrypt_document(self, encrypted_data):
        """Decrypt document data."""
        if encrypted_data:
            try:
                return cipher_suite.decrypt(encrypted_data.encode()).decode()
            except Exception:
                return None
        return None
    
    def store_document_front(self, base64_image):
        """Store encrypted front of ID document."""
        self.id_document_front = self.encrypt_document(base64_image)
        
    def store_document_back(self, base64_image):
        """Store encrypted back of ID document."""
        self.id_document_back = self.encrypt_document(base64_image)
    
    def store_selfie(self, base64_image):
        """Store encrypted selfie image."""
        self.selfie_image = self.encrypt_document(base64_image)
    
    def get_document_front(self):
        """Get decrypted front of ID document."""
        return self.decrypt_document(self.id_document_front)
        
    def get_document_back(self):
        """Get decrypted back of ID document."""
        return self.decrypt_document(self.id_document_back)
    
    def get_selfie(self):
        """Get decrypted selfie image."""
        return self.decrypt_document(self.selfie_image)
        
    def to_dict(self, include_documents=False):
        """Convert verification profile to dictionary."""
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'full_name': self.full_name,
            'id_type': self.id_type,
            'id_number': self.id_number,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'verification_status': self.verification_status,
            'verification_notes': self.verification_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'verified_by_admin_id': self.verified_by_admin_id,
            'risk_score': self.risk_score
        }
        
        # Include documents only if explicitly requested (for security)
        if include_documents:
            result.update({
                'id_document_front': self.get_document_front(),
                'id_document_back': self.get_document_back(),
                'selfie_image': self.get_selfie()
            })
            
        return result
    
    def __repr__(self):
        return f'<VerificationProfile {self.id} - User {self.user_id}>'

class BlacklistedToken(db.Model):
    """Model for storing blacklisted JWT tokens."""
    __tablename__ = 'blacklisted_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(500), nullable=False, unique=True)
    blacklisted_on = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<BlacklistedToken {self.id}>'


class MFASession(db.Model):
    """Model for storing MFA verification sessions."""
    __tablename__ = 'mfa_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(128), nullable=False, unique=True, 
                     default=lambda: secrets.token_urlsafe(64))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    
    # Define a relationship to the User model
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('mfa_sessions', lazy='dynamic'))
    
    def is_expired(self):
        """Check if the MFA session is expired."""
        return datetime.utcnow() > self.expires_at
    
    def mark_used(self):
        """Mark this MFA session as used."""
        self.used = True
    
    def __repr__(self):
        return f'<MFASession {self.id} - User {self.user_id}>'


class AuditLog(db.Model):
    """Model for storing security audit logs."""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(50), nullable=True)
    resource_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)  # IPv6 can be up to 45 chars
    user_agent = db.Column(db.String(256), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='success')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Define a relationship to the User model
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('audit_logs', lazy='dynamic'))
    
    def __repr__(self):
        return f'<AuditLog {self.id} - {self.action}>'
