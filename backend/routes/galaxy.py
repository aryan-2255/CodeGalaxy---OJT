from __future__ import annotations

from datetime import datetime

from flask import Blueprint, jsonify, request
from bson import ObjectId

from ..utils.db import get_db, get_default_user_id


bp = Blueprint("galaxy", __name__)


def serialize_celestial(doc):
    return {
        "id": str(doc["_id"]),
        "type": doc.get("type"),
        "radius": doc.get("radius"),
        "color": doc.get("color"),
        "x": doc.get("x"),
        "y": doc.get("y"),
        "created_at": doc.get("created_at"),
        "session_id": doc.get("session_id"),
        "meta": doc.get("meta", {}),
    }


@bp.get("/api/galaxy/data")
def galaxy_data():
    """
    Primary endpoint for the canvas.
    """
    db = get_db()
    user_id = get_default_user_id()
    docs = db.celestial_objects.find({"user_id": user_id}).sort("created_at", 1)
    return jsonify([serialize_celestial(d) for d in docs])


@bp.get("/api/galaxy")
def galaxy_legacy():
    """
    Backwards compatible endpoint for the existing frontend.
    """
    return galaxy_data()

@bp.post("/api/galaxy/stars")
def create_stars():
    """
    Bulk create stars.
    Body: { stars: [{ x, y, radius?, color?, type? }, ...] }
    """
    db = get_db()
    user_id = get_default_user_id()
    data = request.get_json(silent=True) or {}
    stars = data.get("stars") or []

    if not isinstance(stars, list):
        return jsonify({"error": "stars must be a list"}), 400

    if not stars:
        return jsonify({"created": 0, "ids": []})

    now = datetime.utcnow()
    new_docs = []
    for s in stars:
        new_docs.append({
            "user_id": user_id,
            "x": float(s.get("x", 0)),
            "y": float(s.get("y", 0)),
            "radius": float(s.get("radius", 2)),
            "color": s.get("color", "#FFD700"),
            "type": s.get("type", "star"),
            "created_at": now,
            "created_via": "constellation_merge"
        })

    if new_docs:
        result = db.celestial_objects.insert_many(new_docs)
        return jsonify({
            "created": len(result.inserted_ids),
            "ids": [str(oid) for oid in result.inserted_ids]
        })
    
    return jsonify({"created": 0, "ids": []})


@bp.delete("/api/galaxy/stars")
def delete_stars():
    """
    Bulk delete stars.
    Body: { ids: [id1, id2, ...] }
    """
    db = get_db()
    user_id = get_default_user_id()
    data = request.get_json(silent=True) or {}
    ids = data.get("ids") or []
    
    if not ids:
        return jsonify({"deleted": 0})
        
    oids = []
    for i in ids:
        try:
            oids.append(ObjectId(i))
        except:
            continue
            
    if not oids:
        return jsonify({"deleted": 0})
        
    result = db.celestial_objects.delete_many({
        "_id": {"$in": oids},
        "user_id": user_id
    })
    
    return jsonify({"deleted": result.deleted_count})
@bp.post("/api/galaxy/reset")
def galaxy_reset():
    db = get_db()
    user_id = get_default_user_id()
    if not user_id:
        return jsonify({"ok": False, "error": "unauthenticated"}), 401

    deleted = db.celestial_objects.delete_many({"user_id": user_id}).deleted_count
    db.galaxy_layout.delete_many({"user_id": user_id})
    db.sessions.delete_many({"user_id": user_id})

    default_stats = {
        "user_id": user_id,
        "stars_count": 0,
        "sessions_count": 0,
        "streak": 0,
        "level": 0,
        "last_reset_at": datetime.utcnow(),
    }

    db.galaxy_stats.update_one(
        {"user_id": user_id},
        {"$set": default_stats},
        upsert=True,
    )

    return jsonify({"ok": True, "deleted": deleted, "stats": default_stats})


@bp.get("/api/galaxy/layout")
def galaxy_layout_get():
    db = get_db()
    user_id = get_default_user_id()
    docs = db.celestial_objects.find({"user_id": user_id})
    layout = [
        {"id": str(doc["_id"]), "x": doc.get("x", 0), "y": doc.get("y", 0)}
        for doc in docs
    ]
    return jsonify({"layout": layout})


@bp.post("/api/galaxy/layout")
def galaxy_layout_save():
    data = request.get_json(silent=True) or {}
    layout = data.get("layout") or []
    if not isinstance(layout, list):
        return jsonify({"error": "layout must be a list"}), 400

    db = get_db()
    user_id = get_default_user_id()

    updated = 0
    for item in layout:
        star_id = item.get("id")
        if not star_id:
            continue
        try:
            oid = ObjectId(star_id)
        except Exception:
            continue
        update_result = db.celestial_objects.update_one(
            {"_id": oid, "user_id": user_id},
            {
                "$set": {
                    "x": float(item.get("x", 0) or 0),
                    "y": float(item.get("y", 0) or 0),
                }
            },
        )
        updated += update_result.modified_count

    # Guard: Do not delete stars here. This endpoint only updates positions.
    # If the client sends a subset of stars, the others remain untouched.
    
    docs = db.celestial_objects.find({"user_id": user_id})
    layout = [
        {"id": str(doc["_id"]), "x": doc.get("x", 0), "y": doc.get("y", 0)}
        for doc in docs
    ]
    return jsonify({"updated": updated, "layout": layout})


import json
import os

def load_constellations():
    try:
        path = os.path.join(os.path.dirname(__file__), '..', 'constellations.json')
        with open(path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading constellations: {e}")
        return {}

CONSTELLATION_PRESETS = load_constellations()


@bp.get("/api/constellations")
def constellation_presets():
    return jsonify({"constellations": CONSTELLATION_PRESETS})


@bp.post("/api/galaxy/layout/merge")
def galaxy_layout_merge():
    """
    Merge layout updates and create new stars if needed.
    Body: { 
        updates: [{id, x, y}, ...], 
        new_stars: [{x, y, radius, color, type}, ...] 
    }
    """
    db = get_db()
    user_id = get_default_user_id()
    data = request.get_json(silent=True) or {}
    
    updates = data.get("updates") or []
    new_stars = data.get("new_stars") or []
    
    updated_count = 0
    created_ids = []
    
    # 1. Update existing stars
    for item in updates:
        star_id = item.get("id")
        if not star_id: continue
        try:
            oid = ObjectId(star_id)
            res = db.celestial_objects.update_one(
                {"_id": oid, "user_id": user_id},
                {"$set": {"x": float(item.get("x", 0)), "y": float(item.get("y", 0))}}
            )
            updated_count += res.modified_count
        except:
            continue
            
    # 2. Create new stars
    if new_stars:
        now = datetime.utcnow()
        docs = []
        for s in new_stars:
            docs.append({
                "user_id": user_id,
                "x": float(s.get("x", 0)),
                "y": float(s.get("y", 0)),
                "radius": float(s.get("radius", 2)),
                "color": s.get("color", "#FFD700"),
                "type": s.get("type", "star"),
                "created_at": now,
                "created_via": "constellation_merge"
            })
        if docs:
            res = db.celestial_objects.insert_many(docs)
            created_ids = [str(oid) for oid in res.inserted_ids]
            
    return jsonify({
        "updated": updated_count,
        "created": len(created_ids),
        "created_ids": created_ids
    })


