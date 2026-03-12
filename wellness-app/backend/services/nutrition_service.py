from datetime import datetime, timedelta
from typing import List
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

# Recommended Daily Allowances (default for average adult)
RDA = {
    "calories": 2000, "protein_g": 50, "carbs_g": 275,
    "fat_g": 78, "fiber_g": 28
}

def compute_totals(food_items: list) -> dict:
    return {
        "total_calories": round(sum(f.get("calories", 0) for f in food_items), 1),
        "total_protein_g": round(sum(f.get("protein_g", 0) for f in food_items), 1),
        "total_carbs_g": round(sum(f.get("carbs_g", 0) for f in food_items), 1),
        "total_fat_g": round(sum(f.get("fat_g", 0) for f in food_items), 1),
        "total_fiber_g": round(sum(f.get("fiber_g", 0) for f in food_items), 1),
    }

async def log_meal(db, user_id: str, data: dict) -> dict:
    items = [f if isinstance(f, dict) else f.model_dump() for f in data["food_items"]]
    totals = compute_totals(items)
    now = data.get("logged_at") or datetime.utcnow()
    
    doc = {
        "user_id": ObjectId(user_id),
        "meal_type": data["meal_type"],
        "food_items": items,
        "notes": data.get("notes"),
        "logged_at": now,
        "created_at": datetime.utcnow(),
        **totals
    }
    result = await db.nutrition_logs.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _format_nutrition(doc)

async def get_nutrition_history(db, user_id: str, limit: int = 30, skip: int = 0) -> List[dict]:
    cursor = db.nutrition_logs.find(
        {"user_id": ObjectId(user_id)},
        sort=[("logged_at", -1)]
    ).skip(skip).limit(limit)
    logs = await cursor.to_list(length=limit)
    return [_format_nutrition(l) for l in logs]

async def get_nutrition_analysis(db, user_id: str, days: int = 7) -> dict:
    since = datetime.utcnow() - timedelta(days=days)
    logs = await db.nutrition_logs.find({
        "user_id": ObjectId(user_id),
        "logged_at": {"$gte": since}
    }).to_list(length=None)
    
    if not logs:
        return _empty_nutrition_analysis(days)
    
    total_cal = sum(l.get("total_calories", 0) for l in logs)
    total_protein = sum(l.get("total_protein_g", 0) for l in logs)
    total_carbs = sum(l.get("total_carbs_g", 0) for l in logs)
    total_fat = sum(l.get("total_fat_g", 0) for l in logs)
    total_fiber = sum(l.get("total_fiber_g", 0) for l in logs)
    
    days_with_data = len({l["logged_at"].strftime("%Y-%m-%d") for l in logs})
    days_with_data = max(days_with_data, 1)
    
    avg_cal = total_cal / days_with_data
    avg_protein = total_protein / days_with_data
    avg_carbs = total_carbs / days_with_data
    avg_fat = total_fat / days_with_data
    
    # Macronutrient distribution (percentage of calories)
    protein_cals = total_protein * 4
    carb_cals = total_carbs * 4
    fat_cals = total_fat * 9
    total_macro_cals = protein_cals + carb_cals + fat_cals
    
    macro_pct = {
        "protein": round((protein_cals / total_macro_cals * 100) if total_macro_cals else 0, 1),
        "carbs": round((carb_cals / total_macro_cals * 100) if total_macro_cals else 0, 1),
        "fat": round((fat_cals / total_macro_cals * 100) if total_macro_cals else 0, 1)
    }
    
    # Meal type breakdown
    meal_breakdown = {}
    for l in logs:
        mt = l["meal_type"]
        if mt not in meal_breakdown:
            meal_breakdown[mt] = {"count": 0, "calories": 0}
        meal_breakdown[mt]["count"] += 1
        meal_breakdown[mt]["calories"] += l.get("total_calories", 0)
    
    # Daily breakdown for charts
    daily = {}
    for i in range(days):
        day = (datetime.utcnow() - timedelta(days=days-1-i)).strftime("%Y-%m-%d")
        daily[day] = {"date": day, "calories": 0, "protein": 0, "carbs": 0, "fat": 0}
    for l in logs:
        day = l["logged_at"].strftime("%Y-%m-%d")
        if day in daily:
            daily[day]["calories"] += l.get("total_calories", 0)
            daily[day]["protein"] += l.get("total_protein_g", 0)
            daily[day]["carbs"] += l.get("total_carbs_g", 0)
            daily[day]["fat"] += l.get("total_fat_g", 0)
    
    # Nutrition score: adherence to RDA
    cal_score = max(0, 100 - abs(avg_cal - RDA["calories"]) / RDA["calories"] * 100)
    protein_score = min(avg_protein / RDA["protein_g"], 1.5) / 1.5 * 100
    fiber_score = min((total_fiber / days_with_data) / RDA["fiber_g"], 1.5) / 1.5 * 100
    nutrition_score = round((cal_score * 0.4 + protein_score * 0.35 + fiber_score * 0.25), 1)
    
    return {
        "period_days": days,
        "days_with_data": days_with_data,
        "total_meals": len(logs),
        "totals": {
            "calories": round(total_cal, 1), "protein_g": round(total_protein, 1),
            "carbs_g": round(total_carbs, 1), "fat_g": round(total_fat, 1),
            "fiber_g": round(total_fiber, 1)
        },
        "daily_averages": {
            "calories": round(avg_cal, 1), "protein_g": round(avg_protein, 1),
            "carbs_g": round(avg_carbs, 1), "fat_g": round(avg_fat, 1)
        },
        "macro_distribution_pct": macro_pct,
        "rda_adherence": {
            k: round(min((total_cal if k == "calories" else (
                total_protein if k == "protein_g" else (
                    total_carbs if k == "carbs_g" else total_fat
                ))) / days_with_data / v * 100, 200), 1)
            for k, v in RDA.items() if k != "fiber_g"
        },
        "meal_type_breakdown": meal_breakdown,
        "daily_breakdown": list(daily.values()),
        "nutrition_score": min(nutrition_score, 100)
    }

def _empty_nutrition_analysis(days):
    return {
        "period_days": days, "days_with_data": 0, "total_meals": 0,
        "totals": {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0},
        "daily_averages": {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0},
        "macro_distribution_pct": {"protein": 0, "carbs": 0, "fat": 0},
        "rda_adherence": {}, "meal_type_breakdown": {},
        "daily_breakdown": [], "nutrition_score": 0
    }

def _format_nutrition(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc["user_id"]),
        "meal_type": doc["meal_type"],
        "food_items": doc["food_items"],
        "total_calories": doc.get("total_calories", 0),
        "total_protein_g": doc.get("total_protein_g", 0),
        "total_carbs_g": doc.get("total_carbs_g", 0),
        "total_fat_g": doc.get("total_fat_g", 0),
        "total_fiber_g": doc.get("total_fiber_g", 0),
        "notes": doc.get("notes"),
        "logged_at": doc["logged_at"].isoformat()
    }
