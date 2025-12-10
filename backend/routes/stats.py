from __future__ import annotations

from datetime import datetime, timedelta

from flask import Blueprint, jsonify

from ..utils.db import get_db, get_default_user_id


bp = Blueprint("stats", __name__, url_prefix="/stats")


@bp.get("/summary")
def summary():
    """
    GET /stats/summary
    High-level overview for dashboard.
    """
    db = get_db()
    user_id = get_default_user_id()

    total_tasks = db.tasks.count_documents({"user_id": user_id})
    completed_tasks = db.tasks.count_documents({"user_id": user_id, "completed": True})

    total_sessions = db.sessions.count_documents({"user_id": user_id})
    total_minutes = 0
    for s in db.sessions.find({"user_id": user_id}):
        total_minutes += float(s.get("duration_minutes", 0) or 0)

    return jsonify(
        {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": (completed_tasks / total_tasks) * 100 if total_tasks else 0,
            "total_sessions": total_sessions,
            "total_focus_minutes": total_minutes,
        }
    )


@bp.get("/streak")
def streak():
    """
    GET /stats/streak
    Simple daily streak based on focus sessions.
    """
    db = get_db()
    user_id = get_default_user_id()

    # Get unique days with a session in the last 60 days
    days = set()
    since = datetime.utcnow() - timedelta(days=60)
    for s in db.sessions.find({"user_id": user_id, "started_at": {"$gte": since}}):
        dt = s.get("started_at")
        if isinstance(dt, datetime):
            days.add(dt.date())

    today = datetime.utcnow().date()
    streak_len = 0
    current = today
    while current in days:
        streak_len += 1
        current = current - timedelta(days=1)

    return jsonify({"current_streak_days": streak_len})


@bp.get("/weekly")
def weekly():
    """
    GET /stats/weekly
    Returns focus minutes per day for the last 7 days.
    """
    db = get_db()
    user_id = get_default_user_id()

    today = datetime.utcnow().date()
    start = today - timedelta(days=6)

    buckets = { (start + timedelta(days=i)): 0.0 for i in range(7) }

    for s in db.sessions.find({"user_id": user_id}):
        dt = s.get("started_at")
        if isinstance(dt, datetime):
            d = dt.date()
            if start <= d <= today:
                buckets[d] += float(s.get("duration_minutes", 0) or 0)

    data = [
        {
            "date": d.isoformat(),
            "minutes": buckets[d],
        }
        for d in sorted(buckets.keys())
    ]

    return jsonify(data)


