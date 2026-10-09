"""Production WSGI entry point; static files must be served by the same origin."""
from .app import create_app

application = create_app()
