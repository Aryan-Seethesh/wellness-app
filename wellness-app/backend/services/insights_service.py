from datetime import datetime, timedelta
from bson import ObjectId
from services.fitness_service import get_fitness_summary
from services.nutrition_service import get_nutrition_analysis
from services.mood_service import get_mood_trends
import logging

logger = logging.getLogger(__name__)

async def get_weekly_insights(db, user_id: str) -> dict:
    fitness = await get_fitness_summary(db, user_id, days=7)
    nutrition = await get_nutrition_analysis(db, user_id, days=7)
    mood = await get_mood_trends(db, user_id, days=7)
    
    fs = fitness.get("fitness_score", 0)
    ns = nutrition.get("nutrition_score", 0)
    ms = mood.get("mental_health_score", 0)
    
    # Weighted wellness score
    wellness_score = round(fs * 0.35 + ns * 0.30 + ms * 0.35, 1)
    
    recommendations = _generate_recommendations(fitness, nutrition, mood)
    
    return {
        "week_start": (datetime.utcnow() - timedelta(days=7)).isoformat(),
        "week_end": datetime.utcnow().isoformat(),
        "wellness_score": wellness_score,
        "fitness_score": fs,
        "nutrition_score": ns,
        "mental_health_score": ms,
        "fitness_summary": {
            "sessions": fitness.get("total_sessions", 0),
            "calories_burned": fitness.get("total_calories_burned", 0),
            "duration_minutes": fitness.get("total_duration_minutes", 0),
            "steps": fitness.get("total_steps", 0),
        },
        "nutrition_summary": {
            "meals_logged": nutrition.get("total_meals", 0),
            "avg_daily_calories": nutrition.get("daily_averages", {}).get("calories", 0),
            "avg_protein_g": nutrition.get("daily_averages", {}).get("protein_g", 0),
            "macro_distribution": nutrition.get("macro_distribution_pct", {}),
        },
        "mental_health_summary": {
            "entries": mood.get("total_entries", 0),
            "avg_mood": mood.get("averages", {}).get("mood", 0),
            "avg_stress": mood.get("averages", {}).get("stress", 0),
            "avg_sleep": mood.get("averages", {}).get("sleep_hours"),
            "trends": mood.get("trends", {}),
        },
        "recommendations": recommendations,
        "ai_ready_payload": _prepare_ai_payload(fitness, nutrition, mood)
    }

async def get_dashboard_data(db, user_id: str) -> dict:
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Today's quick stats
    today_fitness = await db.fitness_logs.find({
        "user_id": ObjectId(user_id),
        "logged_at": {"$gte": today}
    }).to_list(length=None)
    
    today_nutrition = await db.nutrition_logs.find({
        "user_id": ObjectId(user_id),
        "logged_at": {"$gte": today}
    }).to_list(length=None)
    
    today_mood = await db.mood_logs.find({
        "user_id": ObjectId(user_id),
        "logged_at": {"$gte": today}
    }).sort("logged_at", -1).limit(1).to_list(length=1)
    
    # Weekly trend data for charts
    weekly_fitness = await get_fitness_summary(db, user_id, days=7)
    weekly_nutrition = await get_nutrition_analysis(db, user_id, days=7)
    weekly_mood = await get_mood_trends(db, user_id, days=7)
    
    # Compute today's totals
    today_calories_burned = sum(l.get("calories_burned", 0) or 0 for l in today_fitness)
    today_calories_in = sum(l.get("total_calories", 0) or 0 for l in today_nutrition)
    today_steps = sum(l.get("steps", 0) or 0 for l in today_fitness)
    
    fs = weekly_fitness.get("fitness_score", 0)
    ns = weekly_nutrition.get("nutrition_score", 0)
    ms = weekly_mood.get("mental_health_score", 0)
    wellness_score = round(fs * 0.35 + ns * 0.30 + ms * 0.35, 1)
    
    return {
        "today": {
            "calories_burned": round(today_calories_burned, 1),
            "calories_consumed": round(today_calories_in, 1),
            "net_calories": round(today_calories_in - today_calories_burned, 1),
            "steps": today_steps,
            "workouts": len(today_fitness),
            "meals_logged": len(today_nutrition),
            "mood": today_mood[0]["mood_score"] if today_mood else None,
            "stress": today_mood[0]["stress_level"] if today_mood else None,
        },
        "wellness_score": wellness_score,
        "scores": {"fitness": fs, "nutrition": ns, "mental_health": ms},
        "weekly_fitness_chart": weekly_fitness.get("daily_breakdown", []),
        "weekly_nutrition_chart": weekly_nutrition.get("daily_breakdown", []),
        "weekly_mood_chart": weekly_mood.get("daily_breakdown", []),
        "top_recommendations": _generate_recommendations(weekly_fitness, weekly_nutrition, weekly_mood)[:3]
    }

def _generate_recommendations(fitness: dict, nutrition: dict, mood: dict) -> list:
    recs = []
    
    # Fitness recommendations
    sessions = fitness.get("total_sessions", 0)
    if sessions == 0:
        recs.append("🏃 Start your fitness journey! Aim for at least 3 workout sessions this week.")
    elif sessions < 3:
        recs.append(f"💪 You've done {sessions} workout(s) this week. Try to reach 4-5 sessions for optimal health.")
    
    total_duration = fitness.get("total_duration_minutes", 0)
    if total_duration < 150:
        remaining = 150 - total_duration
        recs.append(f"⏱️ You need {remaining:.0f} more minutes of exercise to hit the weekly 150-minute recommendation.")
    
    steps = fitness.get("total_steps", 0)
    if steps < 50000:  # 7-day target: ~10k/day
        recs.append("👟 Try to reach 10,000 steps daily. Even a 20-minute walk counts!")
    
    # Nutrition recommendations
    avg_cal = nutrition.get("daily_averages", {}).get("calories", 0)
    if avg_cal > 0:
        if avg_cal < 1200:
            recs.append("🥗 Your calorie intake seems low. Ensure you're eating enough to fuel your body.")
        elif avg_cal > 2500:
            recs.append("🍽️ Your average calorie intake is high. Consider portion control and more vegetables.")
    else:
        recs.append("📊 Start logging your meals to get personalized nutrition insights.")
    
    protein = nutrition.get("daily_averages", {}).get("protein_g", 0)
    if protein < 40 and protein > 0:
        recs.append("🥩 Your protein intake is low. Include more lean proteins like chicken, fish, or legumes.")
    
    macro = nutrition.get("macro_distribution_pct", {})
    if macro.get("fat", 0) > 45:
        recs.append("🥑 Fat is a large portion of your diet. Balance with more complex carbohydrates and lean proteins.")
    
    # Mental health recommendations
    avg_mood = mood.get("averages", {}).get("mood", 0)
    avg_stress = mood.get("averages", {}).get("stress", 0)
    avg_sleep = mood.get("averages", {}).get("sleep_hours")
    trends = mood.get("trends", {})
    
    if avg_mood > 0 and avg_mood < 5:
        recs.append("😊 Your mood has been low. Consider activities you enjoy and connecting with friends or a therapist.")
    
    if avg_stress > 7:
        recs.append("🧘 High stress detected. Mindfulness, deep breathing, or yoga can significantly reduce stress levels.")
    
    if avg_sleep and avg_sleep < 6:
        recs.append("😴 You're sleeping less than 6 hours. Aim for 7-9 hours for optimal recovery and mental health.")
    
    if trends.get("mood") == "declining":
        recs.append("📉 Your mood trend is declining. Consider journaling, exercise, or speaking with someone you trust.")
    
    if mood.get("total_entries", 0) == 0:
        recs.append("🌿 Start logging your mood daily to track your mental wellbeing patterns.")
    
    return recs if recs else ["✨ You're doing great! Keep up your healthy habits this week."]

def _prepare_ai_payload(fitness: dict, nutrition: dict, mood: dict) -> dict:
    """Structured payload ready for AI API integration."""
    return {
        "fitness": {
            "weekly_sessions": fitness.get("total_sessions", 0),
            "total_calories_burned": fitness.get("total_calories_burned", 0),
            "avg_duration_minutes": fitness.get("avg_duration_per_session", 0),
            "workout_types": list(fitness.get("workout_type_breakdown", {}).keys()),
            "fitness_score": fitness.get("fitness_score", 0)
        },
        "nutrition": {
            "avg_daily_calories": nutrition.get("daily_averages", {}).get("calories", 0),
            "avg_protein_g": nutrition.get("daily_averages", {}).get("protein_g", 0),
            "macro_pct": nutrition.get("macro_distribution_pct", {}),
            "nutrition_score": nutrition.get("nutrition_score", 0)
        },
        "mental_health": {
            "avg_mood": mood.get("averages", {}).get("mood", 0),
            "avg_stress": mood.get("averages", {}).get("stress", 0),
            "avg_sleep_hours": mood.get("averages", {}).get("sleep_hours"),
            "mood_trend": mood.get("trends", {}).get("mood", "stable"),
            "mental_health_score": mood.get("mental_health_score", 0)
        }
    }
