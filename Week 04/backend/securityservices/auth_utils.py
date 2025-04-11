import re
import logging
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt

# Configure logging
logger = logging.getLogger(__name__)

def validate_password(password):
    """
    Validate password strength.
    
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    
    Returns:
    - dict: {"valid": bool, "message": str}
    """
    # Check length
    if len(password) < 8:
        return {"valid": False, "message": "Password must be at least 8 characters long"}
    
    # Check for uppercase letter
    if not re.search(r'[A-Z]', password):
        return {"valid": False, "message": "Password must contain at least one uppercase letter"}
    
    # Check for lowercase letter
    if not re.search(r'[a-z]', password):
        return {"valid": False, "message": "Password must contain at least one lowercase letter"}
    
    # Check for number
    if not re.search(r'[0-9]', password):
        return {"valid": False, "message": "Password must contain at least one number"}
    
    # Check for special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return {"valid": False, "message": "Password must contain at least one special character"}
    
    return {"valid": True, "message": "Password is strong"}

def validate_email(email):
    """Validate email format."""
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_pattern, email))

def validate_username(username):
    """
    Validate username format.
    
    Requirements:
    - 3-64 characters
    - Only letters, numbers, and underscores
    """
    username_pattern = r'^[a-zA-Z0-9_]{3,64}$'
    return bool(re.match(username_pattern, username))

def role_required(required_roles):
    """
    Decorator to check if user has required role.
    
    Args:
        required_roles: String or list of strings representing required roles
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Get role from JWT
            claims = get_jwt()
            user_role = claims.get('role', 'user')
            
            # Convert required_roles to list if it's a string
            roles = [required_roles] if isinstance(required_roles, str) else required_roles
            
            # Check if user has required role
            if user_role not in roles:
                logger.warning(f"Role access denied. User role: {user_role}, Required roles: {roles}")
                return jsonify({"error": "Insufficient permissions"}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator
