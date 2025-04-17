import os
from datetime import timedelta


class Config:
    """Base config class."""
    SECRET_KEY = os.environ.get("SESSION_SECRET", "default-secret-key")
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    
    # JWT Settings
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "default-jwt-secret-key")
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


class ProductionConfig(Config):
    """Production config."""
    DEBUG = False
    DEVELOPMENT = False


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
