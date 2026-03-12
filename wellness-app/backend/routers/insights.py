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

# AI Router (future-ready)
ai_router = APIRouter(prefix="/ai", tags=["AI Recommendations"])

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
