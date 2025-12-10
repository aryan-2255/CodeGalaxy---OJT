from __future__ import annotations

from datetime import datetime

from backend.utils.db import get_db


MOODS = [
    {"key": "calm", "label": "Calm", "color": "#5D8BF4", "order": 1},
    {"key": "focus", "label": "Focus", "color": "#1F4068", "order": 2},
    {"key": "happy", "label": "Happy", "color": "#F7F7FF", "order": 3},
    {"key": "energy", "label": "Energy", "color": "#182952", "order": 4},
    {"key": "neutral", "label": "Neutral", "color": "#0F1C3D", "order": 5},
]


def run() -> None:
    db = get_db()
    for mood in MOODS:
        db.moods.update_one(
            {"key": mood["key"]},
            {
                "$set": {
                    "label": mood["label"],
                    "color": mood["color"],
                    "order": mood["order"],
                    "updated_at": datetime.utcnow(),
                },
                "$setOnInsert": {"created_at": datetime.utcnow()},
            },
            upsert=True,
        )
    print(f"Seeded {len(MOODS)} moods.")


if __name__ == "__main__":
    run()


