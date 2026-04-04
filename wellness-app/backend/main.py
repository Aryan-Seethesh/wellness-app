from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from core.config import settings
from core.database import connect_db, close_db
from routers.auth import router as auth_router
from routers.fitness import router as fitness_router
from routers.nutrition import router as nutrition_router
from routers.mood import router as mood_router
from routers.insights import router as insights_router, ai_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(
    title="Wellness Tracker API",
    description="Production-grade wellness tracking with fitness, nutrition, and mental health monitoring",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(fitness_router)
app.include_router(nutrition_router)
app.include_router(mood_router)
app.include_router(insights_router)
app.include_router(ai_router)

@app.get("/", tags=["Health"])
async def root():
    return {"status": "healthy", "api": "Wellness Tracker v1.0", "docs": "/docs"}

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
