from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ── Auth Models ──────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    age: Optional[int] = Field(None, ge=1, le=120)
    weight_kg: Optional[float] = Field(None, ge=1, le=500)
    height_cm: Optional[float] = Field(None, ge=50, le=300)
    fitness_goal: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = Field(None, ge=1, le=120)
    weight_kg: Optional[float] = Field(None, ge=1, le=500)
    height_cm: Optional[float] = Field(None, ge=50, le=300)
    fitness_goal: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    age: Optional[int]
    weight_kg: Optional[float]
    height_cm: Optional[float]
    fitness_goal: Optional[str]
    created_at: datetime

# ── Fitness Models ────────────────────────────────────────────────────────────

class WorkoutType(str, Enum):
    cardio = "cardio"
    strength = "strength"
    yoga = "yoga"
    hiit = "hiit"
    cycling = "cycling"
    swimming = "swimming"
    running = "running"
    walking = "walking"
    other = "other"

class FitnessLog(BaseModel):
    workout_type: WorkoutType
    duration_minutes: float = Field(..., ge=1, le=600)
    calories_burned: Optional[float] = Field(None, ge=0)
    steps: Optional[int] = Field(None, ge=0)
    distance_km: Optional[float] = Field(None, ge=0)
    intensity: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    notes: Optional[str] = Field(None, max_length=500)
    logged_at: Optional[datetime] = None

class FitnessLogResponse(FitnessLog):
    id: str
    user_id: str
    logged_at: datetime

# ── Nutrition Models ──────────────────────────────────────────────────────────

class MealType(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"

class FoodItem(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    quantity_g: float = Field(..., ge=0)
    calories: float = Field(..., ge=0)
    protein_g: float = Field(0, ge=0)
    carbs_g: float = Field(0, ge=0)
    fat_g: float = Field(0, ge=0)
    fiber_g: float = Field(0, ge=0)

class NutritionLog(BaseModel):
    meal_type: MealType
    food_items: List[FoodItem] = Field(..., min_length=1)
    notes: Optional[str] = Field(None, max_length=500)
    logged_at: Optional[datetime] = None

class NutritionLogResponse(BaseModel):
    id: str
    user_id: str
    meal_type: str
    food_items: List[FoodItem]
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    total_fiber_g: float
    notes: Optional[str]
    logged_at: datetime

# ── Mood Models ───────────────────────────────────────────────────────────────

class MoodLog(BaseModel):
    mood_score: int = Field(..., ge=1, le=10, description="1=Very Bad, 10=Excellent")
    stress_level: int = Field(..., ge=1, le=10, description="1=No stress, 10=Extreme stress")
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    journal_notes: Optional[str] = Field(None, max_length=2000)
    emotions: Optional[List[str]] = None
    logged_at: Optional[datetime] = None

class MoodLogResponse(MoodLog):
    id: str
    user_id: str
    logged_at: datetime

# ── Insight Models ────────────────────────────────────────────────────────────

class WeeklyInsight(BaseModel):
    week_start: datetime
    wellness_score: float
    fitness_score: float
    nutrition_score: float
    mental_health_score: float
    summary: dict
    recommendations: List[str]
