"""
Security middleware for Flask application.
"""
import uuid
from functools import wraps
from flask import g, request, current_app

class SecurityMiddleware:
    """
    Middleware to add security headers and features to Flask application.
    
    This middleware adds various security headers to responses, including:
    - Content-Security-Policy: Prevents XSS and data injection attacks
    - X-Content-Type-Options: Prevents MIME type sniffing
    - X-Frame-Options: Prevents clickjacking
    - X-XSS-Protection: Additional XSS protection for older browsers
    - Strict-Transport-Security: Enforces HTTPS
    - Referrer-Policy: Controls referrer information
    - Request-ID: Adds unique request ID for tracing
    """
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize the middleware with a Flask application."""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
    
    def before_request(self):
        """Process before each request."""
        # Generate a unique request ID for tracing
        g.request_id = str(uuid.uuid4())
        
        # Store IP address and user agent for audit logging
        g.ip_address = request.remote_addr
        g.user_agent = request.user_agent.string if request.user_agent else None
    
    def after_request(self, response):
        """Process after each request to add security headers."""
        # Add security headers
        
        # Content Security Policy
        csp = current_app.config.get('CONTENT_SECURITY_POLICY', {})
        if csp:
            csp_values = []
            for directive, value in csp.items():
                csp_values.append(f"{directive} {value}")
            response.headers['Content-Security-Policy'] = '; '.join(csp_values)
        
        # Prevent MIME type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'
        
        # Prevent clickjacking
        response.headers['X-Frame-Options'] = 'DENY'
        
        # Add XSS protection header for older browsers
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Enable HSTS (HTTP Strict Transport Security)
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Control referrer information
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Add request ID for tracing
        if hasattr(g, 'request_id'):
            response.headers['X-Request-ID'] = g.request_id
        
        return response


def rate_limit(limit=100, per=60):
    """
    Rate limiting decorator for API endpoints.
    
    Args:
        limit (int): Maximum number of requests
        per (int): Time period in seconds
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # In a production environment, this would use Redis or similar
            # to track request counts per user/IP and time window
            
            # Example implementation using in-memory tracking (not for production)
            # In production, use a proper rate limiting solution
            
            # For now, just continue without actual rate limiting
            return f(*args, **kwargs)
        return decorated_function
    return decorator