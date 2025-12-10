import sys
import os

# Add the parent directory to the path so we can import backend
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# Set environment for production
os.environ.setdefault('FLASK_ENV', 'production')

try:
    from backend.app import app
    print("✓ Flask app imported successfully")
except Exception as e:
    print(f"❌ Error importing Flask app: {e}")
    import traceback
    traceback.print_exc()
    raise

# Vercel serverless function handler
# The 'app' variable is what Vercel will use
