"""
AI Service Module - Ready for external AI API integration.
Connect your preferred AI API (OpenAI, Anthropic, Gemini, etc.) by:
1. Setting AI_API_KEY and AI_API_ENDPOINT in .env
2. Implementing the _call_ai_api() function below
"""
import httpx
import logging
from core.config import settings

logger = logging.getLogger(__name__)

async def _call_ai_api(prompt: str, system_prompt: str = None) -> str:
    """
    Generic AI API caller. Implement based on your chosen provider.
    Currently returns placeholder responses.
    """
    if not settings.AI_API_KEY or not settings.AI_API_ENDPOINT:
        return None  # AI not configured
    
    # Example for OpenAI-compatible APIs:
    # headers = {"Authorization": f"Bearer {settings.AI_API_KEY}", "Content-Type": "application/json"}
    # payload = {"model": "gpt-4", "messages": [
    #     {"role": "system", "content": system_prompt or "You are a wellness coach."},
    #     {"role": "user", "content": prompt}
    # ], "max_tokens": 500}
    # async with httpx.AsyncClient() as client:
    #     resp = await client.post(settings.AI_API_ENDPOINT, headers=headers, json=payload, timeout=30)
    #     return resp.json()["choices"][0]["message"]["content"]
    
    return None

async def get_workout_recommendation(health_data: dict) -> dict:
    """Generate personalized workout recommendation based on health data."""
    prompt = f"""
    Based on this user's health data for the past week:
    - Fitness sessions: {health_data['fitness']['weekly_sessions']}
    - Total calories burned: {health_data['fitness']['total_calories_burned']}
    - Workout types done: {', '.join(health_data['fitness']['workout_types']) or 'none'}
    - Average mood: {health_data['mental_health']['avg_mood']}/10
    - Fitness score: {health_data['fitness']['fitness_score']}/100
    
    Recommend 3 specific workouts for next week with duration and intensity.
    Format as JSON with keys: workouts (array of: name, duration_minutes, intensity, rationale)
    """
    
    ai_response = await _call_ai_api(prompt, "You are an expert fitness coach specializing in personalized training plans.")
    
    # Placeholder response until AI is connected
    return {
        "ai_powered": bool(ai_response),
        "recommendations": ai_response or _fallback_workout_recommendation(health_data),
        "note": "Connect AI_API_KEY and AI_API_ENDPOINT in .env for personalized AI recommendations"
    }

async def get_nutrition_advice(health_data: dict) -> dict:
    """Generate nutrition advice based on intake patterns."""
    prompt = f"""
    User nutrition data (7-day average):
    - Daily calories: {health_data['nutrition']['avg_daily_calories']} kcal
    - Protein: {health_data['nutrition']['avg_protein_g']}g
    - Macro split: {health_data['nutrition']['macro_pct']}
    - Nutrition score: {health_data['nutrition']['nutrition_score']}/100
    
    Provide 3 actionable nutrition improvements and a sample daily meal plan.
    Format as JSON with keys: improvements (array of strings), sample_meal_plan (breakfast/lunch/dinner/snack)
    """
    
    ai_response = await _call_ai_api(prompt, "You are a registered dietitian specializing in sports nutrition.")
    
    return {
        "ai_powered": bool(ai_response),
        "advice": ai_response or _fallback_nutrition_advice(health_data),
        "note": "Connect AI_API_KEY and AI_API_ENDPOINT in .env for personalized AI advice"
    }

async def get_mental_health_support(health_data: dict) -> dict:
    """Generate mental health support content."""
    prompt = f"""
    User mental health data (7-day):
    - Average mood: {health_data['mental_health']['avg_mood']}/10
    - Average stress: {health_data['mental_health']['avg_stress']}/10
    - Sleep: {health_data['mental_health']['avg_sleep_hours']} hours
    - Mood trend: {health_data['mental_health']['mood_trend']}
    - Mental health score: {health_data['mental_health']['mental_health_score']}/100
    
    Provide compassionate mental wellness support with 3 coping strategies and mindfulness exercises.
    """
    
    ai_response = await _call_ai_api(prompt, "You are a compassionate mental wellness coach. Be supportive and evidence-based.")
    
    return {
        "ai_powered": bool(ai_response),
        "support": ai_response or _fallback_mental_health_support(health_data),
        "note": "Connect AI_API_KEY and AI_API_ENDPOINT in .env for personalized AI support"
    }

def _fallback_workout_recommendation(data: dict) -> str:
    sessions = data['fitness']['weekly_sessions']
    if sessions < 2:
        return "Start with 3x20-minute walks this week, then add a 30-minute strength session. Build gradually!"
    elif sessions < 4:
        return "Add HIIT or cycling 2x this week. Try: 2 strength sessions + 2 cardio sessions + 1 yoga/stretch day."
    return "You're active! Focus on progressive overload: increase weights by 5%, add interval training, and include a recovery day."

def _fallback_nutrition_advice(data: dict) -> str:
    cal = data['nutrition']['avg_daily_calories']
    if cal < 100:
        return "Start logging your meals! Aim for balanced meals with protein, complex carbs, healthy fats, and plenty of vegetables."
    protein = data['nutrition']['avg_protein_g']
    if protein < 40:
        return "Increase protein intake. Add eggs, Greek yogurt, legumes, or lean meat to each meal for better muscle recovery."
    return "Your nutrition looks balanced. Focus on meal timing around workouts and staying well-hydrated throughout the day."

def _fallback_mental_health_support(data: dict) -> str:
    mood = data['mental_health']['avg_mood']
    stress = data['mental_health']['avg_stress']
    if mood < 5 or stress > 7:
        return "Try 5-minute box breathing (4s in, 4s hold, 4s out, 4s hold). Also consider a daily 10-minute walk in nature and journaling 3 things you're grateful for."
    return "Keep up your positive momentum! Practice daily mindfulness for 5-10 minutes and maintain social connections for continued mental wellness."
