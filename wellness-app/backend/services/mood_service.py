from datetime import datetime, timedelta
from typing import List
from bson import ObjectId
import logging
import statistics

logger = logging.getLogger(__name__)

async def log_mood(db, user_id: str, data: dict) -> dict:
    now = data.get("logged_at") or datetime.utcnow()
    
    # Compute composite wellbeing index
    mood = data["mood_score"]
    stress = data["stress_level"]
    energy = data.get("energy_level") or 5
    sleep = data.get("sleep_hours") or 7
    
    # Wellbeing = high mood + low stress + high energy + adequate sleep
    sleep_score = 10 if 7 <= sleep <= 9 else (7 if 6 <= sleep <= 10 else 4)
    wellbeing_index = round((mood + (11 - stress) + energy + sleep_score) / 4, 1)
    
    doc = {
        "user_id": ObjectId(user_id),
        "mood_score": mood,
        "stress_level": stress,
        "energy_level": energy,
        "sleep_hours": data.get("sleep_hours"),
        "journal_notes": data.get("journal_notes"),
        "emotions": data.get("emotions", []),
        "wellbeing_index": wellbeing_index,
        "logged_at": now,
        "created_at": datetime.utcnow()
    }
    result = await db.mood_logs.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _format_mood(doc)

async def get_mood_history(db, user_id: str, limit: int = 30, skip: int = 0) -> List[dict]:
    cursor = db.mood_logs.find(
        {"user_id": ObjectId(user_id)},
        sort=[("logged_at", -1)]
    ).skip(skip).limit(limit)
    logs = await cursor.to_list(length=limit)
    return [_format_mood(l) for l in logs]

async def get_mood_trends(db, user_id: str, days: int = 14) -> dict:
    since = datetime.utcnow() - timedelta(days=days)
    logs = await db.mood_logs.find({
        "user_id": ObjectId(user_id),
        "logged_at": {"$gte": since}
    }).sort("logged_at", 1).to_list(length=None)
    
    if not logs:
        return _empty_mood_trends(days)
    
    moods = [l["mood_score"] for l in logs]
    stresses = [l["stress_level"] for l in logs]
    energies = [l.get("energy_level", 5) for l in logs if l.get("energy_level")]
    sleeps = [l.get("sleep_hours", 7) for l in logs if l.get("sleep_hours")]
    wellbeings = [l.get("wellbeing_index", 5) for l in logs]
    
    # Trend direction (slope of last 5 vs first 5 if enough data)
    def calc_trend(values):
        if len(values) < 2:
            return "stable"
        recent = statistics.mean(values[-min(5, len(values)):])
        earlier = statistics.mean(values[:min(5, len(values))])
        diff = recent - earlier
        if diff > 0.5:
            return "improving"
        elif diff < -0.5:
            return "declining"
        return "stable"
    
    # Emotion frequency
    emotion_freq = {}
    for l in logs:
        for e in (l.get("emotions") or []):
            emotion_freq[e] = emotion_freq.get(e, 0) + 1
    
    # Daily aggregated data
    daily = {}
    for i in range(days):
        day = (datetime.utcnow() - timedelta(days=days-1-i)).strftime("%Y-%m-%d")
        daily[day] = {"date": day, "mood": None, "stress": None, "energy": None, "wellbeing": None, "count": 0}
    
    for l in logs:
        day = l["logged_at"].strftime("%Y-%m-%d")
        if day in daily:
            if daily[day]["mood"] is None:
                daily[day].update({"mood": 0, "stress": 0, "energy": 0, "wellbeing": 0})
            daily[day]["mood"] += l["mood_score"]
            daily[day]["stress"] += l["stress_level"]
            daily[day]["energy"] += l.get("energy_level", 5)
            daily[day]["wellbeing"] += l.get("wellbeing_index", 5)
            daily[day]["count"] += 1
    
    # Average multi-logs per day
    for day in daily.values():
        if day["count"] > 0:
            day["mood"] = round(day["mood"] / day["count"], 1)
            day["stress"] = round(day["stress"] / day["count"], 1)
            day["energy"] = round(day["energy"] / day["count"], 1)
            day["wellbeing"] = round(day["wellbeing"] / day["count"], 1)
    
    # Mental health score
    avg_mood = statistics.mean(moods)
    avg_stress = statistics.mean(stresses)
    avg_sleep = statistics.mean(sleeps) if sleeps else 7
    sleep_quality = 10 if 7 <= avg_sleep <= 9 else (6 if 6 <= avg_sleep <= 10 else 3)
    mh_score = round((avg_mood * 30 + (11 - avg_stress) * 30 + sleep_quality * 10 + (
        statistics.mean(energies) if energies else 5) * 10) / 8, 1)
    
    return {
        "period_days": days,
        "total_entries": len(logs),
        "averages": {
            "mood": round(statistics.mean(moods), 1),
            "stress": round(statistics.mean(stresses), 1),
            "energy": round(statistics.mean(energies), 1) if energies else None,
            "sleep_hours": round(statistics.mean(sleeps), 1) if sleeps else None,
            "wellbeing_index": round(statistics.mean(wellbeings), 1)
        },
        "trends": {
            "mood": calc_trend(moods),
            "stress": calc_trend(stresses),
            "wellbeing": calc_trend(wellbeings)
        },
        "emotion_frequency": dict(sorted(emotion_freq.items(), key=lambda x: -x[1])[:10]),
        "daily_breakdown": list(daily.values()),
        "mental_health_score": min(mh_score, 100)
    }

def _empty_mood_trends(days):
    return {
        "period_days": days, "total_entries": 0,
        "averages": {"mood": 0, "stress": 0, "energy": None, "sleep_hours": None, "wellbeing_index": 0},
        "trends": {"mood": "stable", "stress": "stable", "wellbeing": "stable"},
        "emotion_frequency": {}, "daily_breakdown": [], "mental_health_score": 0
    }

def _format_mood(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc["user_id"]),
        "mood_score": doc["mood_score"],
        "stress_level": doc["stress_level"],
        "energy_level": doc.get("energy_level"),
        "sleep_hours": doc.get("sleep_hours"),
        "journal_notes": doc.get("journal_notes"),
        "emotions": doc.get("emotions", []),
        "wellbeing_index": doc.get("wellbeing_index"),
        "logged_at": doc["logged_at"].isoformat()
    }
