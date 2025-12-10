"""
Debug endpoint for Vercel deployment
"""
import sys
import os
import traceback

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/debug')
def debug():
    try:
        # Test basic Flask
        result = {
            "flask_working": True,
            "python_version": sys.version,
            "mongodb_uri_set": "MONGODB_URI" in os.environ,
        }
        
        # Try to import backend modules
        try:
            from backend.utils.db import get_client, get_db
            result["backend_import"] = "success"
            
            # Try to get MongoDB client
            try:
                client = get_client()
                result["mongodb_client"] = "created"
                
                # Try to ping MongoDB
                try:
                    client.admin.command('ping')
                    result["mongodb_ping"] = "success"
                    
                    # Try to get database
                    db = get_db()
                    result["database_name"] = db.name
                    result["collections"] = db.list_collection_names()
                    
                except Exception as e:
                    result["mongodb_ping"] = f"failed: {str(e)}"
                    
            except Exception as e:
                result["mongodb_client"] = f"failed: {str(e)}"
                result["mongodb_error"] = traceback.format_exc()
                
        except Exception as e:
            result["backend_import"] = f"failed: {str(e)}"
            result["import_error"] = traceback.format_exc()
            
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

