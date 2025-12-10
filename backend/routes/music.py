from __future__ import annotations

from flask import Blueprint, jsonify, url_for


bp = Blueprint("music", __name__)


def _local_tracks():
    """
    Returns static playlist metadata pointing to local audio files.
    """
    return [
        {
            "id": 1,
            "title": "Nebula Drift",
            "artist": "CodeGalaxy",
            "duration": "2:00",
            "url": url_for("static", filename="media/nebula-drift.wav"),
        },
        {
            "id": 2,
            "title": "Starlight Echoes",
            "artist": "CodeGalaxy",
            "duration": "2:00",
            "url": url_for("static", filename="media/starlight-echoes.wav"),
        },
        {
            "id": 3,
            "title": "Comet Trail",
            "artist": "CodeGalaxy",
            "duration": "2:00",
            "url": url_for("static", filename="media/comet-trail.wav"),
        },
    ]


@bp.get("/music")
def get_local_music():
    """
    GET /api/music
    Serves three local tracks stored under backend/static/media.
    """
    return jsonify(_local_tracks())


