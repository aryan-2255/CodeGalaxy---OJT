import os
from typing import Any, Dict

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError


load_dotenv()

_client: MongoClient | None = None


def get_client() -> MongoClient:
    """
    Return a singleton MongoClient instance with production-ready settings.

    The URI is loaded from the MONGODB_URI environment variable.
    Falls back to local MongoDB if not set (development only).
    """
    global _client
    if _client is None:
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            # Fallback to local (development only)
            mongo_uri = "mongodb://localhost:27017/codegalaxy"
            print("⚠️  MONGODB_URI not set. Using local fallback (development mode)")
        
        try:
            # Production-ready MongoDB client configuration
            # For serverless (Vercel), we need simpler settings
            _client = MongoClient(
                mongo_uri,
                serverSelectionTimeoutMS=10000,  # 10 second timeout for serverless
                connectTimeoutMS=10000,
                maxPoolSize=1,  # Serverless should use 1 connection
                minPoolSize=0,
                maxIdleTimeMS=45000,  # Close idle connections after 45s
                retryWrites=True
            )
            # Test the connection with a quick ping
            _client.admin.command('ping')
            print("✓ MongoDB connection successful")
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            print(f"❌ MongoDB connection failed: {e}")
            # Don't raise in production - return None and handle gracefully
            print(f"  Connection URI (masked): mongodb+srv://***:***@{mongo_uri.split('@')[1] if '@' in mongo_uri else 'unknown'}")
            _client = None
        except Exception as e:
            print(f"❌ Unexpected MongoDB error: {e}")
            _client = None
    return _client


def get_db() -> Database:
    """
    Return the main application database.

    Even if the URI does not contain the database name, MongoDB will
    lazily create the 'codegalaxy' database on first write.
    """
    client = get_client()
    if client is None:
        raise Exception("MongoDB client is not available. Check your MONGODB_URI environment variable.")
    return client["codegalaxy"]


def get_default_user_id() -> str:
    """
    Get user ID from request headers (set by Firebase auth).
    Falls back to 'demo-user' for development/testing.
    """
    try:
        from flask import request
        user_id = request.headers.get('X-User-Id')
        if user_id:
            return user_id
    except RuntimeError:
        # Not in request context
        pass
    return "demo-user"


def ensure_indexes() -> None:
    """
    Create useful indexes. This is idempotent and safe to call at startup.
    """
    db = get_db()
    db.tasks.create_index([("user_id", 1), ("date", 1)])
    db.sessions.create_index([("user_id", 1), ("started_at", 1)])
    db.celestial_objects.create_index([("user_id", 1), ("created_at", 1)])


