from __future__ import annotations

from datetime import datetime, timezone, timedelta

from backend.utils.db import get_db, get_default_user_id
from backend.utils.star_logic import create_celestial_for_session


SESSIONS = [
    {"duration_minutes": 8, "mood": "calm"},
    {"duration_minutes": 22, "mood": "focus"},
    {"duration_minutes": 37, "mood": "happy"},
    {"duration_minutes": 55, "mood": "energy"},
    {"duration_minutes": 75, "mood": "neutral"},
]


def run() -> None:
    db = get_db()
    user_id = get_default_user_id()

    # Optional: wipe previous seed sessions/objects
    db.sessions.delete_many({"user_id": user_id, "meta.seed": True})
    db.celestial_objects.delete_many({"user_id": user_id, "meta.seed": True})

    now = datetime.now(timezone.utc)
    for idx, entry in enumerate(SESSIONS):
        started_at = now - timedelta(days=len(SESSIONS) - idx)
        session_doc = {
            "user_id": user_id,
            "task_id": None,
            "mood": entry["mood"],
            "duration_minutes": entry["duration_minutes"],
            "started_at": started_at,
            "ended_at": started_at + timedelta(minutes=entry["duration_minutes"]),
            "created_at": started_at,
            "meta": {"seed": True},
        }
        result = db.sessions.insert_one(session_doc)
        create_celestial_for_session(
            db=db,
            session_id=str(result.inserted_id),
            duration_minutes=entry["duration_minutes"],
            mood=entry["mood"],
            meta={"seed": True},
        )

    print(f"Seeded {len(SESSIONS)} demo sessions and celestial objects.")


if __name__ == "__main__":
    run()


