from fastapi import APIRouter, HTTPException, Depends, status
from datetime import timedelta
from bson import ObjectId
from core.database import get_db
from core.security import hash_password, verify_password, create_access_token, get_current_user
from core.config import settings
from models.schemas import UserRegister, UserLogin, UserUpdate
import logging

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)

def user_to_response(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "age": user.get("age"),
        "weight_kg": user.get("weight_kg"),
        "height_cm": user.get("height_cm"),
        "fitness_goal": user.get("fitness_goal"),
        "created_at": user["created_at"].isoformat()
    }

@router.post("/register", status_code=201)
async def register(data: UserRegister, db=Depends(get_db)):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    from datetime import datetime
    user_doc = {
        "name": data.name,
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "age": data.age,
        "weight_kg": data.weight_kg,
        "height_cm": data.height_cm,
        "fitness_goal": data.fitness_goal,
        "created_at": datetime.utcnow()
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    token = create_access_token({"sub": str(result.inserted_id)})
    logger.info(f"New user registered: {data.email}")
    return {"access_token": token, "token_type": "bearer", "user": user_to_response(user_doc)}

@router.post("/login")
async def login(data: UserLogin, db=Depends(get_db)):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": str(user["_id"])})
    logger.info(f"User logged in: {data.email}")
    return {"access_token": token, "token_type": "bearer", "user": user_to_response(user)}

@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return user_to_response(current_user)

@router.put("/me")
async def update_profile(data: UserUpdate, current_user=Depends(get_current_user), db=Depends(get_db)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": updates})
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return user_to_response(updated)
