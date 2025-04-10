import os


class Config:
    # Database URI (PostgreSQL)
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL',
                                        'postgresql://postgres:your_password@localhost/docudino_d')

    # Disable modification tracking (helps performance)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
  # JWT Secret Key for Flask-JWT-Extended (used to sign JWT tokens)
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-very-secure-key')

    # Optional: Enable SSL for production environments
    # SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://username:password@localhost/dbname?sslmode=require')

