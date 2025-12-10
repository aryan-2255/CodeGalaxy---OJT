from __future__ import annotations

from flask import Blueprint, jsonify

from ..utils.db import get_db


bp = Blueprint("status", __name__)


@bp.get("/status")
def status():
    """
    GET /status
    Simple health check: DB connectivity + collection names.
    """
    try:
        db = get_db()
        collections = sorted(db.list_collection_names())
        return jsonify(
            {
                "ok": True,
                "database": db.name,
                "collections": collections,
            }
        )
    except Exception as exc:  # pragma: no cover - defensive
        return jsonify({"ok": False, "error": str(exc)}), 500


