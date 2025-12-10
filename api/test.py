"""
Simple test endpoint to debug Vercel deployment
"""
import sys
import os
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/test')
def test():
    return jsonify({
        "status": "ok",
        "message": "Flask is working!",
        "python_version": sys.version,
        "mongodb_uri_set": "MONGODB_URI" in os.environ,
        "mongodb_uri_length": len(os.environ.get("MONGODB_URI", "")) if "MONGODB_URI" in os.environ else 0
    })

if __name__ == "__main__":
    app.run()

