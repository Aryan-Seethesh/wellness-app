from fastapi import APIRouter, Depends, Query
from core.database import get_db
from core.security import get_current_user
from models.schemas import FitnessLog
from services import fitness_service

router = APIRouter(prefix="/fitness", tags=["Fitness"])

@router.post("/log", status_code=201)
async def log_workout(
    data: FitnessLog,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    user_weight = current_user.get("weight_kg", 70) or 70
    log = await fitness_service.log_workout(db, str(current_user["_id"]), data.model_dump(), user_weight)
    return {"message": "Workout logged successfully", "log": log}

@router.get("/history")
async def get_history(
    limit: int = Query(30, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    logs = await fitness_service.get_fitness_history(db, str(current_user["_id"]), limit, skip)
    return {"logs": logs, "count": len(logs)}

@router.get("/summary")
async def get_summary(
    days: int = Query(7, ge=1, le=90),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    return await fitness_service.get_fitness_summary(db, str(current_user["_id"]), days)

@router.get("/chart")
async def get_chart_data(
    days: int = Query(7, ge=1, le=30),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    return await fitness_service.get_fitness_chart_data(db, str(current_user["_id"]), days)
