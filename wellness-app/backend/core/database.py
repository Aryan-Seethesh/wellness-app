import motor.motor_asyncio
from core.config import settings
import logging

logger = logging.getLogger(__name__)

client: motor.motor_asyncio.AsyncIOMotorClient = None
db = None

async def connect_db():
    global client, db
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.DATABASE_NAME]
        # Create indexes for performance
        await db.users.create_index("email", unique=True)
        await db.fitness_logs.create_index([("user_id", 1), ("logged_at", -1)])
        await db.nutrition_logs.create_index([("user_id", 1), ("logged_at", -1)])
        await db.mood_logs.create_index([("user_id", 1), ("logged_at", -1)])
        await db.insights.create_index([("user_id", 1), ("week_start", -1)])
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_db():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")

def get_db():
    return db
