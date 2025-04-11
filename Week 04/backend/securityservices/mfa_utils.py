"""
MFA utilities for secure authentication.
"""
import io
import base64
import secrets
from datetime import datetime, timedelta
import pyotp
import qrcode
from flask import current_app

from app import db
from app.models import MFASession

def generate_totp_secret():
    """Generate a new TOTP secret."""
    return pyotp.random_base32()

def get_totp_uri(secret, email, issuer="AI Identity Verification"):
    """Generate a TOTP URI for QR code."""
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name=issuer
    )

def verify_totp(secret, token):
    """Verify a TOTP token against a secret."""
    if not secret or not token:
        return False
    
    totp = pyotp.TOTP(secret)
    return totp.verify(token)

def generate_totp_qr_code(uri):
    """Generate a QR code for the TOTP URI."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert image to base64 for web display
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def is_valid_backup_code(user, code):
    """Check if a backup code is valid for a user."""
    return user.verify_backup_code(code)

def create_mfa_session(user_id):
    """Create a temporary MFA session token."""
    # Clean up expired sessions
    now = datetime.utcnow()
    MFASession.query.filter(
        (MFASession.user_id == user_id) & 
        ((MFASession.expires_at < now) | (MFASession.used == True))
    ).delete()
    db.session.commit()
    
    # Create new session
    expires_delta = current_app.config.get('MFA_TOKEN_VALIDITY', 300)  # Default 5 minutes
    session = MFASession(
        user_id=user_id,
        expires_at=datetime.utcnow() + timedelta(seconds=expires_delta)
    )
    
    db.session.add(session)
    db.session.commit()
    
    return session.token

def verify_mfa_session(token):
    """Verify an MFA session token."""
    if not token:
        return None
    
    session = MFASession.query.filter_by(token=token, used=False).first()
    
    if not session or session.is_expired():
        return None
    
    return session.user_id