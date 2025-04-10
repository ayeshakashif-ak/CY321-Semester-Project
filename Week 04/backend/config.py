import os


class Config:
    # Database URI (PostgreSQL)
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL',
                                        'postgresql://postgres:your_password@localhost/docudino_d')

    # Disable modification tracking (helps performance)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
