#  Vitalis — Personalized Wellness Web Application

A production-grade full-stack wellness tracking application with fitness, nutrition, and mental health monitoring. Built with **FastAPI + React**, powered by **MongoDB**, ready for AI integration.

---

##  Project Structure

```
wellness-app/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── core/
│   │   ├── config.py              # Settings / env vars
│   │   ├── database.py            # MongoDB connection + indexes
│   │   └── security.py            # JWT auth, bcrypt hashing
│   ├── models/
│   │   └── schemas.py             # Pydantic request/response models
│   ├── routers/
│   │   ├── auth.py                # POST /auth/register, /login, GET /auth/me
│   │   ├── fitness.py             # POST /fitness/log, GET /fitness/history, /summary
│   │   ├── nutrition.py           # POST /nutrition/log, GET /nutrition/history, /analysis
│   │   ├── mood.py                # POST /mood/log, GET /mood/history, /trends
│   │   └── insights.py            # GET /insights/weekly, /dashboard + AI routes
│   └── services/
│       ├── fitness_service.py     # Calorie estimation, weekly analytics
│       ├── nutrition_service.py   # Macro calculations, RDA adherence scoring
│       ├── mood_service.py        # Wellbeing index, trend detection
│       ├── insights_service.py    # Wellness scoring, recommendations
│       └── ai_service.py          # AI integration stub (plug in your API)
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx                # Routes + auth guards
        ├── main.jsx
        ├── index.css              # Full design system (CSS variables, components)
        ├── context/
        │   ├── AuthContext.jsx    # JWT auth state
        │   └── ThemeContext.jsx   # Dark/light mode
        ├── services/
        │   └── api.js             # Axios API layer (all endpoints)
        ├── hooks/
        │   └── index.js           # useFetch, useForm
        ├── utils/
        │   └── index.js           # Formatters, score colors
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.jsx
        │   │   └── Layout.jsx
        │   ├── charts/
        │   │   └── Charts.jsx     # Recharts wrappers
        │   └── ui/
        │       └── WellnessScore.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── FitnessPage.jsx
            ├── NutritionPage.jsx
            ├── MentalHealthPage.jsx
            ├── InsightsPage.jsx
            ├── ProfilePage.jsx
            └── AuthPages.jsx      # Login + Register (multi-step)
```

---

##  Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (local or Atlas)

---

### 1. Backend Setup

```bash
cd wellness-app/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URL and a strong SECRET_KEY

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

---

### 2. Frontend Setup

```bash
cd wellness-app/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

### 3. MongoDB Setup

**Local MongoDB:**
```bash
# Install and start MongoDB
brew install mongodb-community   # macOS
mongod --dbpath /data/db
```

**MongoDB Atlas (Cloud):**
1. Create free cluster at cloud.mongodb.com
2. Get connection string
3. Set `MONGODB_URL=mongodb+srv://...` in `.env`

---

## ⚙️ Environment Variables

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=wellness_db
SECRET_KEY=your-super-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Future AI Integration
AI_API_KEY=your-openai-or-anthropic-key
AI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, get JWT token |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/me` | Update profile |

### Fitness
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/fitness/log` | Log workout |
| GET | `/fitness/history` | Get workout history |
| GET | `/fitness/summary?days=7` | Analytics summary |
| GET | `/fitness/chart?days=7` | Chart data |

### Nutrition
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/nutrition/log` | Log meal with food items |
| GET | `/nutrition/history` | Get meal history |
| GET | `/nutrition/analysis?days=7` | Macro analysis + RDA |

### Mental Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mood/log` | Log mood check-in |
| GET | `/mood/history` | Get mood history |
| GET | `/mood/trends?days=14` | Trend analysis |

### Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/insights/weekly` | Full weekly wellness report |
| GET | `/insights/dashboard` | Dashboard data with today's stats |

### AI (Future-Ready)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/recommend-workout` | AI workout recommendation |
| POST | `/ai/nutrition-advice` | AI nutrition advice |
| POST | `/ai/mental-health-support` | AI mental wellness support |

---

## 📋 Example API Requests

### Register
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "securepass123",
    "age": 28,
    "weight_kg": 65,
    "height_cm": 168,
    "fitness_goal": "general_fitness"
  }'
```

### Log Workout
```bash
curl -X POST http://localhost:8000/fitness/log \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workout_type": "running",
    "duration_minutes": 45,
    "intensity": "medium",
    "steps": 5500,
    "distance_km": 6.2,
    "notes": "Morning run, felt great!"
  }'
```

### Log Meal
```bash
curl -X POST http://localhost:8000/nutrition/log \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meal_type": "breakfast",
    "food_items": [
      {"name": "Oatmeal", "quantity_g": 80, "calories": 300, "protein_g": 10, "carbs_g": 55, "fat_g": 5, "fiber_g": 8},
      {"name": "Banana", "quantity_g": 120, "calories": 105, "protein_g": 1.3, "carbs_g": 27, "fat_g": 0.4, "fiber_g": 3}
    ],
    "notes": "Pre-workout meal"
  }'
```

### Log Mood
```bash
curl -X POST http://localhost:8000/mood/log \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mood_score": 8,
    "stress_level": 3,
    "energy_level": 7,
    "sleep_hours": 7.5,
    "emotions": ["Motivated", "Grateful"],
    "journal_notes": "Had a productive day, feeling positive!"
  }'
```

---

##  MongoDB Collections

### users
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "password_hash": "string (bcrypt)",
  "age": "int",
  "weight_kg": "float",
  "height_cm": "float",
  "fitness_goal": "string",
  "created_at": "datetime"
}
```

### fitness_logs
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "workout_type": "enum",
  "duration_minutes": "float",
  "calories_burned": "float (auto-calculated if not provided)",
  "steps": "int",
  "distance_km": "float",
  "intensity": "low|medium|high",
  "notes": "string",
  "logged_at": "datetime",
  "created_at": "datetime"
}
```

### nutrition_logs
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "meal_type": "breakfast|lunch|dinner|snack",
  "food_items": [{"name": "str", "quantity_g": "float", "calories": "float", "protein_g": "float", "carbs_g": "float", "fat_g": "float", "fiber_g": "float"}],
  "total_calories": "float",
  "total_protein_g": "float",
  "total_carbs_g": "float",
  "total_fat_g": "float",
  "total_fiber_g": "float",
  "notes": "string",
  "logged_at": "datetime"
}
```

### mood_logs
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "mood_score": "1-10",
  "stress_level": "1-10",
  "energy_level": "1-10",
  "sleep_hours": "float",
  "journal_notes": "string",
  "emotions": ["string"],
  "wellbeing_index": "float (computed)",
  "logged_at": "datetime"
}
```

---

## 🤖 AI Integration Guide

To enable AI-powered recommendations:

1. Open `backend/services/ai_service.py`
2. Set your API key in `.env`:
   ```
   AI_API_KEY=sk-...
   AI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
   ```
3. Uncomment and adapt the `_call_ai_api()` function for your provider

The AI endpoints at `/ai/recommend-workout`, `/ai/nutrition-advice`, and `/ai/mental-health-support` are already live — they return structured fallback responses until your API key is connected.

---

##  Analytics Logic

### Wellness Score (0-100)
- **Fitness Score (35%)**: frequency, duration, variety
- **Nutrition Score (30%)**: RDA adherence, macro balance, protein intake
- **Mental Health Score (35%)**: mood average, stress inverse, sleep quality, wellbeing trend

### Calorie Auto-Calculation
Uses MET (Metabolic Equivalent) values per workout type × weight × duration × intensity multiplier

### Mood Wellbeing Index
`(mood_score + (11 - stress_level) + energy_level + sleep_quality_score) / 4`

---

##  Dark/Light Mode
Click the moon/sun icon in the sidebar. Preference is persisted in localStorage.
