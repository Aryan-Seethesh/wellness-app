from datetime import datetime, timedelta
from typing import List, Optional
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

# MET (Metabolic Equivalent) values for calorie estimation
MET_VALUES = {
    "cardio": 7.0, "strength": 5.0, "yoga": 3.0, "hiit": 9.0,
    "cycling": 7.5, "swimming": 8.0, "running": 9.8, "walking": 3.5, "other": 5.0
}

INTENSITY_MULTIPLIERS = {"low": 0.8, "medium": 1.0, "high": 1.25}

def estimate_calories(workout_type: str, duration_minutes: float, weight_kg: float, intensity: str = "medium") -> float:
    met = MET_VALUES.get(workout_type, 5.0)
    multiplier = INTENSITY_MULTIPLIERS.get(intensity, 1.0)
    return round(met * multiplier * weight_kg * (duration_minutes / 60), 1)

async def log_workout(db, user_id: str, data: dict, user_weight_kg: float = 70) -> dict:
    now = data.get("logged_at") or datetime.utcnow()
    
    # Auto-calculate calories if not provided
    if not data.get("calories_burned"):
        data["calories_burned"] = estimate_calories(
            data["workout_type"], data["duration_minutes"],
            user_weight_kg, data.get("intensity", "medium")
        )
    
    doc = {
        "user_id": ObjectId(user_id),
        "workout_type": data["workout_type"],
        "duration_minutes": data["duration_minutes"],
        "calories_burned": data["calories_burned"],
        "steps": data.get("steps"),
        "distance_km": data.get("distance_km"),
        "intensity": data.get("intensity", "medium"),
        "notes": data.get("notes"),
        "logged_at": now,
        "created_at": datetime.utcnow()
    }
    result = await db.fitness_logs.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _format_fitness(doc)

async def get_fitness_history(db, user_id: str, limit: int = 30, skip: int = 0) -> List[dict]:
    cursor = db.fitness_logs.find(
        {"user_id": ObjectId(user_id)},
        sort=[("logged_at", -1)]
    ).skip(skip).limit(limit)
    logs = await cursor.to_list(length=limit)
    return [_format_fitness(l) for l in logs]

async def get_fitness_summary(db, user_id: str, days: int = 7) -> dict:
    since = datetime.utcnow() - timedelta(days=days)
    logs = await db.fitness_logs.find({
        "user_id": ObjectId(user_id),
        "logged_at": {"$gte": since}
    }).to_list(length=None)
    
    if not logs:
        return _empty_fitness_summary(days)
    
    total_calories = sum(l.get("calories_burned", 0) or 0 for l in logs)
    total_duration = sum(l.get("duration_minutes", 0) or 0 for l in logs)
    total_steps = sum(l.get("steps", 0) or 0 for l in logs)
    total_distance = sum(l.get("distance_km", 0) or 0 for l in logs)
    
    # Workout type breakdown
    type_counts = {}
    for l in logs:
        t = l["workout_type"]
        type_counts[t] = type_counts.get(t, 0) + 1
    
    # Daily breakdown for charts
    daily = {}
    for l in logs:
        day = l["logged_at"].strftime("%Y-%m-%d")
        if day not in daily:
            daily[day] = {"calories": 0, "duration": 0, "steps": 0, "sessions": 0}
        daily[day]["calories"] += l.get("calories_burned", 0) or 0
        daily[day]["duration"] += l.get("duration_minutes", 0) or 0
        daily[day]["steps"] += l.get("steps", 0) or 0
        daily[day]["sessions"] += 1
    
    # Fitness score: based on frequency, duration, variety
    sessions_score = min(len(logs) / (days * 0.7), 1.0) * 40  # 40 pts for frequency
    duration_score = min(total_duration / (days * 30), 1.0) * 35  # 35 pts for duration
    variety_score = min(len(type_counts) / 3, 1.0) * 25  # 25 pts for variety
    fitness_score = round(sessions_score + duration_score + variety_score, 1)
    
    return {
        "period_days": days,
        "total_sessions": len(logs),
        "total_calories_burned": round(total_calories, 1),
        "total_duration_minutes": round(total_duration, 1),
        "total_steps": total_steps,
        "total_distance_km": round(total_distance, 2),
        "avg_calories_per_session": round(total_calories / len(logs), 1) if logs else 0,
        "avg_duration_per_session": round(total_duration / len(logs), 1) if logs else 0,
        "workout_type_breakdown": type_counts,
        "daily_breakdown": daily,
        "fitness_score": fitness_score
    }

async def get_fitness_chart_data(db, user_id: str, days: int = 7) -> List[dict]:
    since = datetime.utcnow() - timedelta(days=days)
    logs = await db.fitness_logs.find({
        "user_id": ObjectId(user_id),
        "logged_at": {"$gte": since}
    }).to_list(length=None)
    daily = {}
    for i in range(days):
        day = (datetime.utcnow() - timedelta(days=days-1-i)).strftime("%Y-%m-%d")
        daily[day] = {"date": day, "calories": 0, "duration": 0, "steps": 0}
    for l in logs:
        day = l["logged_at"].strftime("%Y-%m-%d")
        if day in daily:
            daily[day]["calories"] += l.get("calories_burned", 0) or 0
            daily[day]["duration"] += l.get("duration_minutes", 0) or 0
            daily[day]["steps"] += l.get("steps", 0) or 0
    return list(daily.values())

def _empty_fitness_summary(days):
    return {
        "period_days": days, "total_sessions": 0, "total_calories_burned": 0,
        "total_duration_minutes": 0, "total_steps": 0, "total_distance_km": 0,
        "avg_calories_per_session": 0, "avg_duration_per_session": 0,
        "workout_type_breakdown": {}, "daily_breakdown": {}, "fitness_score": 0
    }

def _format_fitness(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc["user_id"]),
        "workout_type": doc["workout_type"],
        "duration_minutes": doc["duration_minutes"],
        "calories_burned": doc.get("calories_burned"),
        "steps": doc.get("steps"),
        "distance_km": doc.get("distance_km"),
        "intensity": doc.get("intensity"),
        "notes": doc.get("notes"),
        "logged_at": doc["logged_at"].isoformat()
    }
