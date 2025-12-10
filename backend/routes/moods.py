from __future__ import annotations

from typing import Any, Dict

from flask import Blueprint, jsonify

from ..utils.db import get_db


bp = Blueprint("moods", __name__, url_prefix="/moods")


def serialize_mood(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "key": doc.get("key"),
        "label": doc.get("label"),
        "color": doc.get("color"),
        "playlist_id": doc.get("playlist_id"),
    }


@bp.get("")
def list_moods():
    db = get_db()
    docs = db.moods.find({}).sort("order", 1)
    return jsonify([serialize_mood(d) for d in docs])


@bp.get("/<mood_key>/playlist")
def mood_playlist(mood_key: str):
    """
    GET /moods/<mood>/playlist
    Placeholder metadata so the frontend UI has something to display.
    """
    db = get_db()
    mood = db.moods.find_one({"key": mood_key.lower()})
    if not mood:
        return jsonify({"error": "Mood not found"}), 404

    return jsonify(
        {
            "mood": serialize_mood(mood),
            "note": "Playlists are served locally via /api/music.",
        }
    )


