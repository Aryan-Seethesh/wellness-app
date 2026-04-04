import { useFetch } from '../hooks'
import { insightsApi, aiApi } from '../services/api'
import WellnessScore from '../components/ui/WellnessScore'
import { CaloriesChart, MoodChart, NutritionChart, FitnessBarChart } from '../components/charts/Charts'
import { Flame, Footprints, Utensils, Brain, Dumbbell, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { scoreColor, moodEmoji, fmt } from '../utils'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AiCoachChat from '../components/chat/AiCoachChat'

function StatCard({ label, value, unit, icon: Icon, color, change }) {
  return (
    <div className="stat-card fade-up">
      <div className="stat-card-accent" style={{ background: color }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div className="stat-label">{label}</div>
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: color + '18', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color
        }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="stat-value">
        {value ?? '—'} <span className="stat-unit">{unit}</span>
      </div>
      {change && (
        <div className={`stat-change ${change.dir}`}>
          {change.dir === 'positive' ? <TrendingUp size={12} /> :
           change.dir === 'negative' ? <TrendingDown size={12} /> : <Minus size={12} />}
          {change.label}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { data, loading, error } = useFetch(() => insightsApi.dashboard())

  const [smartRecs, setSmartRecs] = useState([])

  useEffect(() => {
    if (data && Object.keys(data).length > 0 && !loading) {
      const fetchSmart = async () => {
        try {
          const w = data.wellness_score || 0
          const m = data.today?.mood || 0
          const cal = data.today?.calories_burned || 0
          const context = `Wellness score is ${w}, mood is ${m}/10. Calories burned: ${cal}.`
          const res = await aiApi.smartRecommendations(context)
          if (res.data?.recommendations) setSmartRecs(res.data.recommendations)
        } catch (e) {
          console.error(e)
        }
      }
      fetchSmart()
    }
  }, [data, loading])

  if (loading) return (
    <div className="page-container">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '20px' }} />
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div className="page-container">
      <div className="alert alert-error">{error}</div>
    </div>
  )

  const d = data || {}
  const today = d.today || {}
  const scores = d.scores || {}
  const wellness = d.wellness_score || 0
  const recommendations = d.top_recommendations || []
  const weeklyFitness = d.weekly_fitness_chart || []
  const weeklyNutrition = d.weekly_nutrition_chart || []
  const weeklyMood = d.weekly_mood_chart || []


  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="page-title" style={{ marginBottom: '4px' }}>Good day! 👋</h2>
          <p className="text-muted">Here's your wellness summary for today.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/fitness" className="btn btn-secondary btn-sm">+ Log Workout</Link>
          <Link to="/nutrition" className="btn btn-primary btn-sm">+ Log Meal</Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-4 mb-6">
        <StatCard label="Calories Burned" value={Math.round(today.calories_burned || 0)}
          unit="kcal" icon={Flame} color="var(--accent-purple)" />
        <StatCard label="Calories In" value={Math.round(today.calories_consumed || 0)}
          unit="kcal" icon={Utensils} color="var(--accent-emerald)" />
        <StatCard label="Steps Today" value={(today.steps || 0).toLocaleString()}
          unit="" icon={Footprints} color="var(--accent-sky)" />
        <StatCard
          label="Today's Mood"
          value={today.mood ? `${moodEmoji(today.mood)} ${today.mood}` : '—'}
          unit={today.mood ? '/10' : ''}
          icon={Brain} color="var(--accent-amber)"
        />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
        {/* Wellness Score */}
        <div className="card fade-up fade-up-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Wellness Score</div>
          <WellnessScore score={wellness} size={150} />
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Fitness', score: scores.fitness, color: 'var(--accent-purple)' },
              { label: 'Nutrition', score: scores.nutrition, color: 'var(--accent-emerald)' },
              { label: 'Mental Health', score: scores.mental_health, color: 'var(--accent-amber)' },
            ].map(({ label, score, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</span>
                  <span style={{ color, fontWeight: '700' }}>{Math.round(score || 0)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${score || 0}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly fitness chart */}
        <div className="card fade-up fade-up-2">
          <div className="section-title">
            <Dumbbell size={16} style={{ color: 'var(--accent-purple)' }} /> Weekly Activity
          </div>
          <div className="chart-container-lg">
            <FitnessBarChart data={weeklyFitness} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Nutrition chart */}
        <div className="card fade-up fade-up-3">
          <div className="section-title">
            <Utensils size={16} style={{ color: 'var(--accent-emerald)' }} /> Calorie Intake
          </div>
          <div className="chart-container">
            <NutritionChart data={weeklyNutrition} />
          </div>
        </div>

        {/* Mood chart */}
        <div className="card fade-up fade-up-4">
          <div className="section-title">
            <Brain size={16} style={{ color: 'var(--accent-amber)' }} /> Mood & Stress Trends
          </div>
          <div className="chart-container">
            <MoodChart data={weeklyMood} />
          </div>
        </div>
      </div>

      {/* AI Recommendations & Coach */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="ai-panel fade-up" style={{ height: '100%' }}>
          <div className="ai-badge">
            <Sparkles size={11} /> AI Insights
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
            Semantic Smart Recommendations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {smartRecs.length > 0 ? smartRecs.map((rec, i) => (
              <div key={i} className="rec-card">{rec}</div>
            )) : (
              <div className="text-muted">Loading smart recommendations...</div>
            )}
          </div>
        </div>

        <div className="fade-up">
          <AiCoachChat />
        </div>
      </div>
    </div>
  )
}
