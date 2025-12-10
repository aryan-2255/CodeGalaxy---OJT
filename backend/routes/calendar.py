from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from flask import Blueprint, jsonify, request
from bson import ObjectId

from ..utils.db import get_db, get_default_user_id


bp = Blueprint("calendar", __name__, url_prefix="/calendar")


def serialize_event(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", ""),
        "date": doc.get("date"),
        "time": doc.get("time"),
        "category": doc.get("category", "Personal"),
        "created_at": doc.get("created_at"),
    }


@bp.get("")
def list_events():
    """
    GET /calendar
    Optional query params: month, year (numbers)
    """
    db = get_db()
    user_id = get_default_user_id()

    query: Dict[str, Any] = {"user_id": user_id}

    month = request.args.get("month")
    year = request.args.get("year")
    if month and year:
        # dates are stored as YYYY-MM-DD strings
        month = str(month).zfill(2)
        year = str(year)
        query["date"] = {"$regex": f"^{year}-{month}-"}

    docs = db.calendar_events.find(query).sort([("date", 1), ("time", 1)])
    return jsonify([serialize_event(d) for d in docs])


@bp.post("")
def create_event():
    """
    POST /calendar
    Body: { title, date, time?, category? }
    """
    db = get_db()
    user_id = get_default_user_id()
    data = request.get_json(silent=True) or {}

    doc = {
        "user_id": user_id,
        "title": data.get("title", "").strip(),
        "date": data.get("date"),
        "time": data.get("time") or "00:00",
        "category": data.get("category", "Personal"),
        "created_at": datetime.utcnow(),
    }
    result = db.calendar_events.insert_one(doc)
    return (
        jsonify({"id": str(result.inserted_id), "message": "Event created successfully"}),
        201,
    )


@bp.delete("/<event_id>")
def delete_event(event_id: str):
    """
    DELETE /calendar/<id>
    """
    db = get_db()
    user_id = get_default_user_id()

    try:
        oid = ObjectId(event_id)
    except Exception:
        return jsonify({"error": "Invalid event id"}), 400

    db.calendar_events.delete_one({"_id": oid, "user_id": user_id})
    return jsonify({"message": "Event deleted successfully"})


