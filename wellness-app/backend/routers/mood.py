from fastapi import APIRouter, Depends, Query
from core.database import get_db
from core.security import get_current_user
from models.schemas import MoodLog
from services import mood_service

router = APIRouter(prefix="/mood", tags=["Mental Health"])

@router.post("/log", status_code=201)
async def log_mood(
    data: MoodLog,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    log = await mood_service.log_mood(db, str(current_user["_id"]), data.model_dump())
    return {"message": "Mood logged successfully", "log": log}

@router.get("/history")
async def get_history(
    limit: int = Query(30, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    logs = await mood_service.get_mood_history(db, str(current_user["_id"]), limit, skip)
    return {"logs": logs, "count": len(logs)}

@router.get("/trends")
async def get_trends(
    days: int = Query(14, ge=1, le=90),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    return await mood_service.get_mood_trends(db, str(current_user["_id"]), days)
