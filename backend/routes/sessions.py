from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from flask import Blueprint, jsonify, request
from bson import ObjectId

from ..utils.db import get_db, get_default_user_id
from ..utils.star_logic import create_celestial_for_session


bp = Blueprint("sessions", __name__, url_prefix="/sessions")


def serialize_session(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "task_id": str(doc["task_id"]) if doc.get("task_id") else None,
        "mood": doc.get("mood"),
        "duration_minutes": doc.get("duration_minutes"),
        "started_at": doc.get("started_at"),
        "ended_at": doc.get("ended_at"),
    }


@bp.post("")
def create_session():
    """
    POST /sessions
    Body: { task_id?, mood, duration_minutes }
    Creates a focus session AND a celestial object.
    """
    db = get_db()
    user_id = get_default_user_id()
    data = request.get_json(silent=True) or {}

    task_id_raw = data.get("task_id")
    task_oid = None
    if task_id_raw:
        try:
            task_oid = ObjectId(task_id_raw)
        except Exception:
            return jsonify({"error": "Invalid task_id"}), 400

    duration_minutes = float(data.get("duration_minutes", 0) or 0)
    mood = (data.get("mood") or "neutral").lower()

    now = datetime.now(timezone.utc)

    session_doc: Dict[str, Any] = {
        "user_id": user_id,
        "task_id": task_oid,
        "mood": mood,
        "duration_minutes": duration_minutes,
        "started_at": now,
        "ended_at": now,
        "created_at": now,
    }

    result = db.sessions.insert_one(session_doc)
    session_id = str(result.inserted_id)

    celestial = create_celestial_for_session(
        db=db,
        session_id=session_id,
        duration_minutes=duration_minutes,
        mood=mood,
        meta={"task_id": str(task_oid) if task_oid else None},
    )

    return (
        jsonify(
            {
                "session": serialize_session({**session_doc, "_id": result.inserted_id}),
                "celestial": celestial.to_mongo(),
            }
        ),
        201,
    )


@bp.get("/today")
def sessions_today():
    """
    GET /sessions/today
    Returns all sessions for the current UTC day.
    """
    db = get_db()
    user_id = get_default_user_id()

    now = datetime.utcnow()
    start = datetime(now.year, now.month, now.day)
    end = datetime(now.year, now.month, now.day, 23, 59, 59, 999000)

    docs = db.sessions.find(
        {
            "user_id": user_id,
            "started_at": {"$gte": start, "$lte": end},
        }
    ).sort("started_at", 1)

    return jsonify([serialize_session(d) for d in docs])


