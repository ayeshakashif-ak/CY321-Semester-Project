import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Firebase service account key path from environment variable
FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', 
    os.path.join(os.path.dirname(__file__), '..', 'docudino-242f8-firebase-adminsdk-fbsvc-76c1451caa.json'))

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    raise

def get_firestore():
    """Get Firestore client instance."""
    return db 