def register_blueprints(app):
    """Register all blueprints with the Flask application."""
    from app.routes.auth_routes import auth_bp
    from app.routes.user_routes import user_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.verification_routes import verification_bp
    from app.routes.mfa_routes import mfa_bp
    from app.routes.document_routes import doc_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(verification_bp, url_prefix='/api/verification')
    app.register_blueprint(mfa_bp)  # MFA routes have their own prefix
    app.register_blueprint(doc_bp)  # Document routes have their own prefix
