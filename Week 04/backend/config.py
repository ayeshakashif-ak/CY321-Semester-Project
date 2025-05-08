import os
import secrets
from datetime import timedelta

# Security constants at module level
SESSION_TIMEOUT = 3600  # 1 hour session timeout
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = timedelta(minutes=15)


class Config:
    """Base config class."""
    SECRET_KEY = os.environ.get("SESSION_SECRET", secrets.token_hex(32))
    
    # Firebase Configuration
    FIREBASE_CREDENTIALS_PATH = os.environ.get("FIREBASE_CREDENTIALS_PATH")
    GOOGLE_APPLICATION_CREDENTIALS = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    
    # JWT Settings
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", secrets.token_hex(32))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 3600))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        seconds=int(os.environ.get("JWT_REFRESH_TOKEN_EXPIRES", 604800))
    )
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    
    # Security Settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    REMEMBER_COOKIE_SECURE = True
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_DURATION = 3600
    
    # Login Security
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION = timedelta(minutes=15)
    
    # Content Security Policy
    CONTENT_SECURITY_POLICY = {
        'default-src': "'self'",
        'script-src': "'self'",
        'style-src': "'self'",
        'img-src': "'self' data:",
        'font-src': "'self'",
        'connect-src': "'self'",
    }
    
    # MFA Settings
    MFA_ENABLED = True
    MFA_REQUIRED_FOR_ROLES = ['admin']  # Roles that require MFA
    MFA_TOKEN_VALIDITY = 300  # seconds


class DevelopmentConfig(Config):
    """Development config."""
    DEBUG = True
    DEVELOPMENT = True
    SESSION_COOKIE_SECURE = False  # Allow non-HTTPS in development


class ProductionConfig(Config):
    """Production config."""
    DEBUG = False
    DEVELOPMENT = False
    
    # Ensure no default values in production
    @classmethod
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        if not os.environ.get("SESSION_SECRET"):
            raise ValueError("Production environment requires SESSION_SECRET environment variable")
        if not os.environ.get("JWT_SECRET_KEY"):
            raise ValueError("Production environment requires JWT_SECRET_KEY environment variable")


# Configuration dictionary
config_dict = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig
}


def get_config():
    """Return the appropriate configuration object based on the environment."""
    env = os.environ.get("FLASK_ENV", "development")
    return config_dict.get(env, config_dict["default"])
