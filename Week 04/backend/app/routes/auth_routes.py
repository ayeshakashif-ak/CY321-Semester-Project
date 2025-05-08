import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    get_jwt_identity, jwt_required, get_jwt
)
from app.firebase import get_firestore
from app.utils.auth_utils import (
    register_user, login_user, get_user_info, role_required,
    validate_password, validate_email, validate_username
)
from app.utils.security_utils import log_audit_event
from app.utils.mfa_utils import create_mfa_session
import bcrypt
import secrets
import re
import google.api_core.exceptions
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        response, status_code = register_user(data)
        return jsonify(response), status_code
    except Exception as e:
        logger.error(f"Unexpected error during registration: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred during registration'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT token or MFA session token if MFA is required."""
    try:
        data = request.get_json()
        logger.info(f"Login request received for email: {data.get('email') if data else None}")
        
        if not data:
            logger.warning("No data in login request")
            return jsonify({'error': 'No data provided'}), 400
            
        response, status_code = login_user(data)
        
        # Check if this is a successful response requiring MFA
        if status_code == 200 and response.get('requires_mfa'):
            # Return MFA session information - don't generate JWT yet
            logger.info(f"User requires MFA verification, returning session token")
            return jsonify({
                'requires_mfa': True,
                'mfa_session_token': response.get('mfa_session_token'),
                'user_id': response.get('user_id'),
                'email': response.get('email')
            }), 200
            
        logger.info(f"Login processed with status: {status_code}")
        return jsonify(response), status_code
    except Exception as e:
        import traceback
        logger.error(f"Error during login: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'An unexpected error occurred during login'}), 500

@auth_bp.route('/verify-mfa', methods=['POST'])
def verify_mfa():
    """Verify MFA token."""
    data = request.get_json()
    
    if not all(k in data for k in ('mfa_session_token', 'token')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Special handling for MFA setup
    if data['mfa_session_token'] == 'setup':
        # This is a MFA setup verification
        try:
            # Get the token from the request
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({"error": "Missing or invalid Authorization header"}), 401

            token = auth_header.split(' ')[1]
            
            # Decode the token to get user ID
            from flask_jwt_extended import decode_token
            try:
                decoded_token = decode_token(token)
                user_id = decoded_token['sub']
            except Exception as e:
                return jsonify({"error": "Invalid token"}), 401
                
            # Get user data
            db = get_firestore()
            user_ref = db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                return jsonify({"error": "User not found"}), 404

            user_data = user_doc.to_dict()
            
            # Verify TOTP token
            if not user_data.get('mfa_secret'):
                return jsonify({"error": "MFA not set up for user"}), 400
            
            from app.models import decrypt_data
            mfa_secret = decrypt_data(user_data.get('mfa_secret'))
            if not mfa_secret:
                return jsonify({"error": "Invalid MFA configuration"}), 400
            
            import pyotp
            totp = pyotp.TOTP(mfa_secret)
            if not totp.verify(data['token']):
                return jsonify({"error": "Invalid verification code"}), 400
            
            # Enable MFA for the user
            user_ref.update({
                'mfa_enabled': True,
                'mfa_verified': True
            })
            
            # Log the successful setup
            log_audit_event(
                user_id=user_id,
                action="mfa_setup_complete",
                resource_type="user",
                resource_id=user_id,
                details={"success": True}
            )
            
            # Return the same token that was used to authenticate 
            # since we're not creating a new session for setup verification
            return jsonify({
                'token': token,
                'user': {
                    'id': user_id,
                    'email': user_data['email'],
                    'role': user_data['role'],
                    'mfa_enabled': True
                }
            }), 200
        except Exception as e:
            import traceback
            logger.error(f"Error during MFA setup verification: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({'error': 'An error occurred during MFA setup verification'}), 500
    
    # Normal MFA verification flow
    db = get_firestore()
    
    # Find MFA session
    mfa_sessions_ref = db.collection('mfa_sessions')
    mfa_query = mfa_sessions_ref.where('token', '==', data['mfa_session_token']).limit(1).get()
    
    if not mfa_query:
        return jsonify({'error': 'Invalid MFA session'}), 400
    
    mfa_session = mfa_query[0].to_dict()
    
    # Check if session is expired or used
    now = datetime.utcnow()
    expires_at = mfa_session.get('expires_at')
    
    # Handle timezone-aware datetimes from Firestore
    if expires_at:
        if hasattr(expires_at, 'tzinfo') and expires_at.tzinfo is not None:
            # Convert to naive datetime for comparison
            naive_expires_at = datetime(
                year=expires_at.year,
                month=expires_at.month,
                day=expires_at.day,
                hour=expires_at.hour,
                minute=expires_at.minute,
                second=expires_at.second,
                microsecond=expires_at.microsecond
            )
            if now > naive_expires_at:
                return jsonify({'error': 'MFA session expired'}), 400
        else:
            # Already naive datetime
            if now > expires_at:
                return jsonify({'error': 'MFA session expired'}), 400
    
    if mfa_session.get('used', False):
        return jsonify({'error': 'MFA session already used'}), 400
    
    # Get user
    user_ref = db.collection('users').document(mfa_session['user_id'])
    user_doc = user_ref.get()
    if not user_doc.exists:
        return jsonify({'error': 'User not found'}), 404
    
    user_data = user_doc.to_dict()
    
    # Verify TOTP token
    if not user_data.get('mfa_secret'):
        return jsonify({'error': 'MFA not set up for user'}), 400
    
    from app.models import decrypt_data
    mfa_secret = decrypt_data(user_data['mfa_secret'])
    if not mfa_secret:
        return jsonify({'error': 'Invalid MFA configuration'}), 400
    
    import pyotp
    totp = pyotp.TOTP(mfa_secret)
    if not totp.verify(data['token']):
        return jsonify({'error': 'Invalid MFA token'}), 400
    
    # Mark MFA session as used
    mfa_query[0].reference.update({'used': True})
    
    # Generate token
    from app.utils.auth_utils import generate_token
    token = generate_token(user_doc.id, user_data['role'])
    
    # Log successful MFA verification
    log_audit_event(
        user_id=user_doc.id,
        action='mfa_verify',
        resource_type='user',
        resource_id=user_doc.id,
        details='MFA verification successful',
        status='success'
    )
    
    return jsonify({
        'token': token,
        'user': {
            'id': user_doc.id,
            'email': user_data['email'],
            'role': user_data['role'],
            'mfa_enabled': user_data.get('mfa_enabled', False)
        }
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user and invalidate token."""
    try:
        token = request.headers.get('Authorization')
        logger.info(f"Logout attempt with Authorization header: {token[:15]}... if present")
        
        if not token:
            logger.warning("No Authorization header in logout request")
            return jsonify({'error': 'No token provided'}), 401
        
        # Add token to blacklist
        db = get_firestore()
        
        # Extract JWT token from Authorization header
        if token.startswith('Bearer '):
            token = token[7:]  # Remove 'Bearer ' prefix
        
        # Get JWT claims and user ID
        claims = get_jwt()
        user_id = get_jwt_identity()
        jti = claims.get('jti', '')
        
        logger.info(f"Processing logout for user_id: {user_id}, jti: {jti}")
        
        # Add token to blacklist using JTI as the document ID
        blacklisted_token = {
            'token': token,
            'jti': jti,
            'blacklisted_at': datetime.utcnow(),
            'user_id': user_id
        }
        
        if jti:
            db.collection('blacklisted_tokens').document(jti).set(blacklisted_token)
        else:
            db.collection('blacklisted_tokens').document().set(blacklisted_token)
        
        # Log logout event
        log_audit_event(
            user_id=user_id,
            action='logout',
            resource_type='user',
            resource_id=user_id,
            details='User logged out successfully',
            status='success'
        )
        
        logger.info(f"User {user_id} successfully logged out")
        return jsonify({'message': 'Successfully logged out'}), 200
        
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'An error occurred during logout'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh an access token."""
    try:
        current_user_id = get_jwt_identity()
        db = get_firestore()
        user_doc = db.collection('users').document(current_user_id).get()
        
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404
        
        user_data = user_doc.to_dict()
        if not user_data.get('is_active', True):
            return jsonify({"error": "Account is deactivated"}), 403
        
        # Create new access token
        from flask_jwt_extended import create_access_token
        access_token = create_access_token(
            identity=current_user_id,
            additional_claims={"role": user_data['role']}
        )
        
        return jsonify({"access_token": access_token}), 200
    
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        return jsonify({"error": "Token refresh failed"}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get the current user's profile."""
    try:
        current_user_id = get_jwt_identity()
        response, status_code = get_user_info(current_user_id)
        return jsonify(response), status_code
    
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        return jsonify({"error": "Failed to get user profile"}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update the current user's profile."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        db = get_firestore()
        user_ref = db.collection('users').document(current_user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404
        
        user_data = user_doc.to_dict()
        
        # Fields that can be updated
        update_data = {}
        
        # Update basic profile info
        if 'firstName' in data:
            update_data['first_name'] = data['firstName']
        
        if 'lastName' in data:
            update_data['last_name'] = data['lastName']
        
        if 'email' in data:
            # Only update email if it's different
            if data['email'] != user_data.get('email'):
                # Validate email format
                if not validate_email(data['email']):
                    return jsonify({"error": "Invalid email format"}), 400
                
                # Check if email is already in use by another user
                email_query = db.collection('users').where('email', '==', data['email']).limit(1).get()
                if email_query and len(email_query) > 0:
                    other_user_id = email_query[0].id
                    if other_user_id != current_user_id:
                        return jsonify({"error": "Email is already in use"}), 400
                
                update_data['email'] = data['email']
        
        # Handle password change if provided
        if 'currentPassword' in data and 'newPassword' in data:
            # Verify current password
            stored_password_hash = user_data.get('password_hash')
            
            # Check if we're using the old 'password' field instead of 'password_hash'
            if not stored_password_hash and 'password' in user_data:
                stored_password_hash = user_data.get('password')
                logger.info("Using legacy 'password' field instead of 'password_hash'")
            
            # Handle the case where the password might be stored in different formats
            password_verified = False
            
            if stored_password_hash:
                try:
                    # First try direct check with Werkzeug's check_password_hash
                    logger.debug(f"Attempting Werkzeug password verification")
                    # Use the imported check_password_hash, not a local reference
                    password_verified = check_password_hash(stored_password_hash, data['currentPassword'])
                except Exception as pwd_err:
                    logger.warning(f"Error using check_password_hash: {pwd_err}")
                
                # If Werkzeug verification fails, try with bcrypt directly
                if not password_verified:
                    try:
                        logger.debug(f"Attempting bcrypt password verification")
                        # Try various common encoding patterns
                        if isinstance(stored_password_hash, str):
                            if stored_password_hash.startswith('$2b$') or stored_password_hash.startswith('$2a$'):
                                # This is likely a bcrypt hash
                                password_verified = bcrypt.checkpw(
                                    data['currentPassword'].encode(),
                                    stored_password_hash.encode()
                                )
                            elif stored_password_hash.startswith('pbkdf2:sha256:'):
                                # This is a Werkzeug hash - do not create local reference
                                password_verified = check_password_hash(stored_password_hash, data['currentPassword'])
                    except Exception as bcrypt_err:
                        logger.error(f"Error using bcrypt verification: {bcrypt_err}")
            
            # Debug output for troubleshooting
            logger.info(f"Password verification result: {password_verified}")
            
            if not password_verified:
                return jsonify({"error": "Current password is incorrect"}), 400
            
            # Validate new password strength
            password_validation = validate_password(data['newPassword'])
            if not password_validation.get('valid', False):
                return jsonify({"error": password_validation.get('message', "Password does not meet security requirements")}), 400
            
            # Use consistent hashing method for new password
            # Generate new password hash using Werkzeug's method to be consistent with registration
            new_password_hash = generate_password_hash(data['newPassword'])
            update_data['password'] = new_password_hash  # Store in the same field used during registration
        
        # Update user document if we have data to update
        if update_data:
            # Add timestamp for when the profile was last updated
            update_data['updated_at'] = datetime.utcnow()
            
            user_ref.update(update_data)
            
            # Log the profile update event
            log_audit_event(
                user_id=current_user_id,
                action='update_profile',
                resource_type='user',
                resource_id=current_user_id,
                details='User profile updated',
                status='success'
            )
            
            # Get updated user data to return
            updated_user_doc = user_ref.get()
            updated_user_data = updated_user_doc.to_dict()
            
            return jsonify({
                "message": "Profile updated successfully",
                "user": {
                    "id": current_user_id,
                    "email": updated_user_data['email'],
                    "firstName": updated_user_data.get('first_name', ''),
                    "lastName": updated_user_data.get('last_name', ''),
                    "role": updated_user_data['role'],
                    "mfa_enabled": updated_user_data.get('mfa_enabled', False)
                }
            }), 200
        else:
            return jsonify({"message": "No changes to update"}), 200
        
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to update profile"}), 500

@auth_bp.route('/account', methods=['DELETE'])
@jwt_required()
def delete_account():
    """Delete the current user's account."""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'password' not in data:
            return jsonify({"error": "Password required for account deletion"}), 400
        
        # Get the user from database
        db = get_firestore()
        user_ref = db.collection('users').document(current_user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404
        
        user_data = user_doc.to_dict()
        
        # Verify password
        stored_password_hash = user_data.get('password_hash')
        password_verified = False
        
        if stored_password_hash:
            try:
                # Try Werkzeug's check_password_hash first
                password_verified = check_password_hash(stored_password_hash, data['password'])
            except Exception as pwd_err:
                logger.warning(f"Error using check_password_hash: {pwd_err}")
                try:
                    # Fallback to bcrypt comparison if Werkzeug fails
                    password_verified = bcrypt.checkpw(
                        data['password'].encode(), 
                        stored_password_hash.encode() if isinstance(stored_password_hash, str) else stored_password_hash
                    )
                except Exception as bcrypt_err:
                    logger.error(f"Error using bcrypt verification: {bcrypt_err}")
        
        if not password_verified:
            return jsonify({"error": "Incorrect password"}), 401
        
        # Log deletion event before account is gone
        log_audit_event(
            user_id=current_user_id,
            action='account_deleted',
            resource_type='user',
            resource_id=current_user_id,
            details='User account deleted',
            status='success'
        )
        
        # Perform deletion
        # 1. First, get all user's documents and delete them
        user_docs = db.collection('documents').where('user_id', '==', current_user_id).stream()
        for doc in user_docs:
            doc.reference.delete()
            
        # 2. Delete any MFA sessions
        mfa_sessions = db.collection('mfa_sessions').where('user_id', '==', current_user_id).stream()
        for session in mfa_sessions:
            session.reference.delete()
            
        # 3. Finally, delete the user account
        user_ref.delete()
        
        # Add token to blacklist to force logout
        token = request.headers.get('Authorization')
        if token and token.startswith('Bearer '):
            token = token[7:]  # Remove 'Bearer ' prefix
            
            claims = get_jwt()
            jti = claims.get('jti', '')
            
            blacklisted_token = {
                'token': token,
                'jti': jti,
                'blacklisted_at': datetime.utcnow(),
                'user_id': current_user_id,
                'reason': 'account_deletion'
            }
            
            if jti:
                db.collection('blacklisted_tokens').document(jti).set(blacklisted_token)
            else:
                db.collection('blacklisted_tokens').document().set(blacklisted_token)
        
        return jsonify({"success": True, "message": "Your account has been permanently deleted"}), 200
        
    except Exception as e:
        logger.error(f"Error deleting account: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to delete account"}), 500

@auth_bp.route('/activity', methods=['GET'])
@jwt_required()
def get_account_activity():
    """Get the current user's account activity history."""
    try:
        current_user_id = get_jwt_identity()
        
        db = get_firestore()
        
        try:
            # First try with sorting (requires composite index)
            audit_logs = db.collection('audit_logs') \
                            .where('user_id', '==', current_user_id) \
                            .order_by('timestamp', direction='DESCENDING') \
                            .limit(50) \
                            .stream()
            
            activities = []
            
            # Process audit logs
            for log in audit_logs:
                log_data = log.to_dict()
                
                # Format the timestamp
                timestamp = log_data.get('timestamp')
                formatted_date = timestamp.strftime('%Y-%m-%d %H:%M:%S') if timestamp else 'Unknown'
                
                # Format the activity entry
                activity = {
                    'date': formatted_date,
                    'action': log_data.get('action', 'Unknown action'),
                    'ip': log_data.get('ip_address', 'Unknown'),
                    'location': log_data.get('location', 'Unknown'),
                    'device': log_data.get('user_agent', 'Unknown device')
                }
                
                activities.append(activity)
                
        except google.api_core.exceptions.FailedPrecondition as index_error:
            # If composite index doesn't exist, fetch without sorting
            logger.warning("Composite index not available, falling back to simple query: %s", str(index_error))
            
            # Use a simpler query that doesn't require a composite index
            audit_logs = db.collection('audit_logs') \
                            .where('user_id', '==', current_user_id) \
                            .limit(50) \
                            .stream()
            
            activities = []
            
            # Process audit logs and sort them in memory
            logs_data = []
            for log in audit_logs:
                logs_data.append(log.to_dict())
            
            # Sort in memory by timestamp (descending)
            logs_data.sort(key=lambda x: x.get('timestamp', datetime.min), reverse=True)
            
            # Format the activities
            for log_data in logs_data:
                timestamp = log_data.get('timestamp')
                formatted_date = timestamp.strftime('%Y-%m-%d %H:%M:%S') if timestamp else 'Unknown'
                
                activity = {
                    'date': formatted_date,
                    'action': log_data.get('action', 'Unknown action'),
                    'ip': log_data.get('ip_address', 'Unknown'),
                    'location': log_data.get('location', 'Unknown'),
                    'device': log_data.get('user_agent', 'Unknown device')
                }
                
                activities.append(activity)
            
            # Add a message suggesting to create the index
            logger.info("Recommend creating the composite index for better performance: %s", 
                       "https://console.firebase.google.com/project/docudino-242f8/firestore/indexes")
        
        return jsonify({'activities': activities}), 200
        
    except Exception as e:
        logger.error(f"Error retrieving account activity: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to retrieve account activity"}), 500

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
