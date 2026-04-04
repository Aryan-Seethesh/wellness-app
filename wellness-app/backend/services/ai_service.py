import logging
from core.config import settings
from huggingface_hub import AsyncInferenceClient

logger = logging.getLogger(__name__)

# Initialize the official Hugging Face SDK client to automatically route bypassing deprecated API URLs
client = AsyncInferenceClient(token=settings.HF_TOKEN) if settings.HF_TOKEN else None

async def hf_llm_coach(user_data: dict) -> str:
    if not client: return "I am currently taking a breather! Connect your HF_TOKEN!"
    
    prompt = f"""You are a professional health coach.
User Data:
* Steps today: {user_data.get('steps_today', 0)}
* Calories consumed: {user_data.get('calories_in', 0)}
* Calories burned: {user_data.get('calories_burned', 0)}
* Mood: {user_data.get('mood_score', 0)}/10
* Stress: {user_data.get('stress_level', 0)}/10
* Goal: {user_data.get('goals', 'General wellness')}

Give:
1. A short workout suggestion
2. A diet recommendation
3. A mental health tip

Keep it concise and actionable."""
    try:
        response = await client.chat_completion(
            model="Qwen/Qwen2.5-72B-Instruct",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"HF API Error: {str(e)}")
        return "Keep up your amazing wellness journey!"

async def hf_sentiment_analyze(text: str) -> int:
    if not client or not text.strip(): return 5
    try:
        res = await client.text_classification(text, model="distilbert-base-uncased-finetuned-sst-2-english")
        positive_res = None
        for s in res:
            label = getattr(s, 'label', s.get('label', '') if isinstance(s, dict) else '')
            if label == 'POSITIVE':
                positive_res = s
                break
        
        if positive_res:
            score = getattr(positive_res, 'score', positive_res.get('score', 0.5) if isinstance(positive_res, dict) else 0.5)
        else:
            score = 0.5
            
        return max(1, min(10, round(score * 10)))
    except Exception as e:
        logger.error(f"HF Sentiment Error: {str(e)}")
        return 5

async def hf_transcribe_audio(audio_bytes: bytes) -> str:
    if not client: return ""
    try:
        res = await client.automatic_speech_recognition(audio_bytes, model="openai/whisper-large-v3")
        if isinstance(res, dict) and "text" in res:
            return res["text"]
        elif hasattr(res, 'text'):
            return res.text
        elif isinstance(res, str):
            return res
        return str(res)
    except Exception as e:
        logger.error(f"HF Audio Error: {str(e)}")
        return ""

PREDEFINED_RECOMMENDATIONS = [
    "Go for a 30-minute brisk walk in the park",
    "Complete a 15-minute high intensity interval training session",
    "Do a 20-minute stretching and flexibility yoga routine",
    "Drink a protein smoothie with spinach and berries after working out",
    "Eat a high protein breakfast like scrambled eggs with avocado",
    "Prepare a balanced dinner with grilled chicken, quinoa, and vegetables",
    "Practice 10 minutes of guided meditation",
    "Write 3 things you are grateful for in your journal before bed",
    "Take a 5-minute break to do deep breathing exercises",
    "Replace sugary snacks with a handful of almonds or walnuts"
]

async def hf_semantic_search(user_context: str) -> list:
    if not client: return PREDEFINED_RECOMMENDATIONS[:3]
    try:
        # Use Qwen instead of rewriting sentence-transformers embedding semantic search distance parsing manually
        prompt = f"Given this list of wellness recommendations: {PREDEFINED_RECOMMENDATIONS}. Pick ONLY the 3 most relevant for a user with this context: {user_context}. Return ONLY the 3 strings exactly as they are written, one on each line."
        response = await client.chat_completion(
            model="Qwen/Qwen2.5-72B-Instruct",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100
        )
        lines = [line.strip("- *123. \t\n") for line in response.choices[0].message.content.strip().split("\n") if line.strip()]
        return lines[:3] if len(lines) >= 3 else PREDEFINED_RECOMMENDATIONS[:3]
    except Exception as e:
        logger.error(f"HF Semantic Error: {str(e)}")
        return PREDEFINED_RECOMMENDATIONS[:3]


# --- Upgraded API routes for individual insights ---
async def get_workout_recommendation(health_data: dict) -> dict:
    if not client: return {"ai_powered": False, "recommendations": _fallback_workout_recommendation(health_data), "note": "Fallback"}
    try:
        prompt = f"You are a fitness coach. User data: {health_data.get('fitness', {})}. Recommend 1 specific short workout routine. Output ONLY the routine, keep it concise."
        response = await client.chat_completion(model="Qwen/Qwen2.5-72B-Instruct", messages=[{"role": "user", "content": prompt}], max_tokens=100)
        return {"ai_powered": True, "recommendations": response.choices[0].message.content.strip(), "note": "Powered by Qwen 2.5"}
    except Exception as e:
        logger.error(f"HF Route Error: {e}")
        return {"ai_powered": False, "recommendations": _fallback_workout_recommendation(health_data), "note": "Fallback"}

async def get_nutrition_advice(health_data: dict) -> dict:
    if not client: return {"ai_powered": False, "advice": _fallback_nutrition_advice(health_data), "note": "Fallback"}
    try:
        prompt = f"You are a nutritionist. User data: {health_data.get('nutrition', {})}. Provide 1 actionable nutrition improvement. Output ONLY the advice, keep it concise."
        response = await client.chat_completion(model="Qwen/Qwen2.5-72B-Instruct", messages=[{"role": "user", "content": prompt}], max_tokens=100)
        return {"ai_powered": True, "advice": response.choices[0].message.content.strip(), "note": "Powered by Qwen 2.5"}
    except Exception as e:
        logger.error(f"HF Route Error: {e}")
        return {"ai_powered": False, "advice": _fallback_nutrition_advice(health_data), "note": "Fallback"}

async def get_mental_health_support(health_data: dict) -> dict:
    if not client: return {"ai_powered": False, "support": _fallback_mental_health_support(health_data), "note": "Fallback"}
    try:
        prompt = f"You are a wellness coach. User data: {health_data.get('mental_health', {})}. Provide a short, compassionate mental wellness tip. Output ONLY the tip, keep it concise."
        response = await client.chat_completion(model="Qwen/Qwen2.5-72B-Instruct", messages=[{"role": "user", "content": prompt}], max_tokens=100)
        return {"ai_powered": True, "support": response.choices[0].message.content.strip(), "note": "Powered by Qwen 2.5"}
    except Exception as e:
        logger.error(f"HF Route Error: {e}")
        return {"ai_powered": False, "support": _fallback_mental_health_support(health_data), "note": "Fallback"}

def _fallback_workout_recommendation(data: dict) -> str:
    return "Start with 3x20-minute walks this week, then add a 30-minute strength session."

def _fallback_nutrition_advice(data: dict) -> str:
    return "Increase protein intake. Add eggs, Greek yogurt, or lean meat."

def _fallback_mental_health_support(data: dict) -> str:
    return "Try 5-minute box breathing. Also consider a daily 10-minute walk."
