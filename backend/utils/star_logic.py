from __future__ import annotations

import math
import random
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Any

from .db import get_default_user_id


GOLDEN_ANGLE = 2.399963229728653


@dataclass
class CelestialObject:
    user_id: str
    session_id: str
    type: str
    radius: float
    color: str
    x: float
    y: float
    created_at: datetime
    meta: Dict[str, Any]

    def to_mongo(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "session_id": self.session_id,
            "type": self.type,
            "radius": self.radius,
            "color": self.color,
            "x": self.x,
            "y": self.y,
            "created_at": self.created_at,
            "meta": self.meta,
        }


MOOD_COLOR_MAP: Dict[str, str] = {
    # Core palette mapping
    "calm": "#5D8BF4",     # Stellar Blue
    "focus": "#1F4068",    # Steel Nebula
    "happy": "#F7F7FF",    # Soft White (bright star)
    "energy": "#182952",   # Navy Cosmo
    "neutral": "#0F1C3D",  # Deep Space Blue
}


def duration_to_type(duration_minutes: float) -> str:
    """
    Map a focus duration (in minutes) to a celestial type.
    """
    if duration_minutes < 10:
        return "tiny_star"
    if duration_minutes < 30:
        return "star"
    if duration_minutes < 60:
        return "planet"
    return "comet"


def duration_to_radius(duration_minutes: float) -> float:
    """
    Compute radius using: radius = clamp(4 + sqrt(duration)/3, min=4, max=40).
    """
    raw = 4.0 + math.sqrt(max(duration_minutes, 0.0)) / 3.0
    return max(4.0, min(40.0, raw))


def compute_spiral_position(index: int, center_x: float, center_y: float, c: float = 7.0) -> tuple[float, float]:
    """
    Compute x, y coordinates using a golden‑angle spiral with small jitter.
    """
    theta = index * GOLDEN_ANGLE
    r = c * math.sqrt(index)

    jitter_x = random.uniform(-3.0, 3.0)
    jitter_y = random.uniform(-3.0, 3.0)

    x = center_x + r * math.cos(theta) + jitter_x
    y = center_y + r * math.sin(theta) + jitter_y
    return x, y


def create_celestial_for_session(
    *,
    db,
    session_id: str,
    duration_minutes: float,
    mood: str,
    meta: Dict[str, Any] | None = None,
) -> CelestialObject:
    """
    Generate a celestial object for a finished focus session and insert it.
    """
    user_id = get_default_user_id()
    mood_key = (mood or "neutral").lower()
    color = MOOD_COLOR_MAP.get(mood_key, MOOD_COLOR_MAP["neutral"])

    obj_type = duration_to_type(duration_minutes)
    radius = duration_to_radius(duration_minutes)

    # Count existing objects for this user to position the new one.
    star_count = db.celestial_objects.count_documents({"user_id": user_id})

    # Use a logical center within the canvas; the frontend can treat
    # (0, 0) as the center, so we keep coordinates around origin.
    center_x, center_y = 0.0, 0.0
    x, y = compute_spiral_position(star_count + 1, center_x, center_y)

    obj = CelestialObject(
        user_id=user_id,
        session_id=session_id,
        type=obj_type,
        radius=radius,
        color=color,
        x=x,
        y=y,
        created_at=datetime.utcnow(),
        meta=meta or {"duration_minutes": duration_minutes, "mood": mood_key},
    )

    db.celestial_objects.insert_one(obj.to_mongo())
    return obj


