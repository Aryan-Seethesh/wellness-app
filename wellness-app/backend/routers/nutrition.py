from fastapi import APIRouter, Depends, Query
from core.database import get_db
from core.security import get_current_user
from models.schemas import NutritionLog
from services import nutrition_service

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])

@router.post("/log", status_code=201)
async def log_meal(
    data: NutritionLog,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    log = await nutrition_service.log_meal(db, str(current_user["_id"]), data.model_dump())
    return {"message": "Meal logged successfully", "log": log}

@router.get("/history")
async def get_history(
    limit: int = Query(30, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    logs = await nutrition_service.get_nutrition_history(db, str(current_user["_id"]), limit, skip)
    return {"logs": logs, "count": len(logs)}

@router.get("/analysis")
async def get_analysis(
    days: int = Query(7, ge=1, le=90),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    return await nutrition_service.get_nutrition_analysis(db, str(current_user["_id"]), days)
