from fastapi import APIRouter, Depends
from core.database import get_db
from core.security import get_current_user
from services import insights_service, ai_service

router = APIRouter(prefix="/insights", tags=["Insights"])

@router.get("/weekly")
async def get_weekly_insights(current_user=Depends(get_current_user), db=Depends(get_db)):
    return await insights_service.get_weekly_insights(db, str(current_user["_id"]))

@router.get("/dashboard")
async def get_dashboard(current_user=Depends(get_current_user), db=Depends(get_db)):
    return await insights_service.get_dashboard_data(db, str(current_user["_id"]))

from pydantic import BaseModel
from fastapi import File, UploadFile

class JournalRequest(BaseModel):
    journal_text: str

class RecommendRequest(BaseModel):
    user_context: str

ai_router = APIRouter(prefix="/ai", tags=["AI Recommendations"])

@ai_router.post("/coach")
async def ai_coach(current_user=Depends(get_current_user), db=Depends(get_db)):
    # Mocking fetching user data for the prompt
    weekly = await insights_service.get_weekly_insights(db, str(current_user["_id"]))
    user_data = {
        "steps_today": 5500,
        "calories_in": 2100,
        "calories_burned": 300,
        "mood_score": weekly["ai_ready_payload"]["mental_health"]["avg_mood"],
        "stress_level": weekly["ai_ready_payload"]["mental_health"]["avg_stress"],
        "goals": current_user.get("fitness_goal", "General Wellness")
    }
    response = await ai_service.hf_llm_coach(user_data)
    return {"response": response}

@ai_router.post("/analyze-journal")
async def analyze_journal(req: JournalRequest):
    mood_score = await ai_service.hf_sentiment_analyze(req.journal_text)
    return {"mood_score": mood_score}

@ai_router.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    text = await ai_service.hf_transcribe_audio(audio_bytes)
    return {"text": text}

@ai_router.post("/smart-recommendations")
async def smart_recommendations(req: RecommendRequest):
    recommendations = await ai_service.hf_semantic_search(req.user_context)
    return {"recommendations": recommendations}

# Keep the original 3 stubs for compatibility
@ai_router.post("/recommend-workout")
async def recommend_workout(current_user=Depends(get_current_user), db=Depends(get_db)):
    weekly = await insights_service.get_weekly_insights(db, str(current_user["_id"]))
    return await ai_service.get_workout_recommendation(weekly["ai_ready_payload"])

@ai_router.post("/nutrition-advice")
async def nutrition_advice(current_user=Depends(get_current_user), db=Depends(get_db)):
    weekly = await insights_service.get_weekly_insights(db, str(current_user["_id"]))
    return await ai_service.get_nutrition_advice(weekly["ai_ready_payload"])

@ai_router.post("/mental-health-support")
async def mental_health_support(current_user=Depends(get_current_user), db=Depends(get_db)):
    weekly = await insights_service.get_weekly_insights(db, str(current_user["_id"]))
    return await ai_service.get_mental_health_support(weekly["ai_ready_payload"])
