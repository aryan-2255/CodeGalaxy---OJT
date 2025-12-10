from __future__ import annotations

from datetime import date, timedelta, datetime

from backend.utils.db import get_db, get_default_user_id


TASKS = [
    {
        "title": "Write Astro Notes",
        "description": "Summarize telescope learnings.",
        "days_from_today": 0,
        "priority": "High",
        "category": "Study",
    },
    {
        "title": "Daily Workout",
        "description": "20-minute stretch & cardio.",
        "days_from_today": 1,
        "priority": "Medium",
        "category": "Life",
    },
    {
        "title": "Ship UI tweaks",
        "description": "Polish CodeGalaxy overview panel.",
        "days_from_today": -1,
        "priority": "High",
        "category": "Work",
    },
]


def run() -> None:
    db = get_db()
    user_id = get_default_user_id()

    today = date.today()
    for task in TASKS:
        task_date = today + timedelta(days=task["days_from_today"])
        db.tasks.insert_one(
            {
                "user_id": user_id,
                "title": task["title"],
                "description": task["description"],
                "date": task_date.isoformat(),
                "priority": task["priority"],
                "category": task["category"],
                "completed": False,
                "created_at": datetime.utcnow(),
            }
        )

    print(f"Inserted {len(TASKS)} demo tasks.")


if __name__ == "__main__":
    run()


