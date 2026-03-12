import { useFetch } from '../hooks'
import { insightsApi, aiApi } from '../services/api'
import WellnessScore from '../components/ui/WellnessScore'
import { Sparkles, Dumbbell, Utensils, Brain, Loader } from 'lucide-react'
import { scoreColor } from '../utils'
import { useState } from 'react'

function ScoreCard({ label, score, icon: Icon, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '14px',
          background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color
        }}>
          <Icon size={24} />
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: '800',
        color: scoreColor(score || 0), lineHeight: 1, marginBottom: '4px'
      }}>
        {Math.round(score || 0)}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div className="progress-bar" style={{ marginTop: '12px' }}>
        <div className="progress-fill" style={{ width: `${score || 0}%`, background: color }} />
      </div>
    </div>
  )
}

function AIPanel() {
  const [aiData, setAiData] = useState({})
  const [loading, setLoading] = useState({})

  const fetchAI = async (type) => {
    setLoading(l => ({ ...l, [type]: true }))
    try {
      const fns = { workout: aiApi.workout, nutrition: aiApi.nutrition, mental: aiApi.mental }
      const r = await fns[type]()
      setAiData(d => ({ ...d, [type]: r.data }))
    } catch (e) {
      setAiData(d => ({ ...d, [type]: { error: 'Failed to fetch AI advice' } }))
    } finally {
      setLoading(l => ({ ...l, [type]: false }))
    }
  }

  const buttons = [
    { key: 'workout', label: 'Workout Plan', icon: Dumbbell },
    { key: 'nutrition', label: 'Nutrition Advice', icon: Utensils },
    { key: 'mental', label: 'Mental Support', icon: Brain },
  ]

  return (
    <div className="ai-panel">
      <div className="ai-badge"><Sparkles size={11} /> AI Recommendations</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
        Personalized AI Health Coach
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Get AI-powered recommendations based on your health data.
        Connect your AI API key in backend/.env to enable full personalization.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {buttons.map(({ key, label, icon: Icon }) => (
          <button key={key} className="btn btn-primary" onClick={() => fetchAI(key)} disabled={loading[key]}>
            {loading[key] ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Icon size={15} />}
            {label}
          </button>
        ))}
      </div>
      {Object.entries(aiData).map(([key, val]) => (
        <div key={key} className="rec-card" style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: '700', marginBottom: '6px', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
            {key === 'workout' ? '💪 Workout Recommendation' : key === 'nutrition' ? '🥗 Nutrition Advice' : '🧘 Mental Wellness Support'}
          </div>
          {val.error ? (
            <div style={{ color: 'var(--accent-rose)' }}>{val.error}</div>
          ) : (
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              {val.recommendations || val.advice || val.support || 'Processing...'}
              {!val.ai_powered && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)',
                  padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '6px' }}>
                  💡 This is a fallback recommendation. Connect AI_API_KEY for personalized advice.
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function InsightsPage() {
  const { data, loading, error } = useFetch(() => insightsApi.weekly())

  if (loading) return (
    <div className="page-container">
      <div className="grid-4 mb-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '20px' }} />)}
      </div>
    </div>
  )

  if (error) return <div className="page-container"><div className="alert alert-error">{error}</div></div>

  const d = data || {}
  const fitness = d.fitness_summary || {}
  const nutrition = d.nutrition_summary || {}
  const mental = d.mental_health_summary || {}
  const recs = d.recommendations || []

  return (
    <div className="page-container">
      {/* Overall + sub-scores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="card fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px' }}>
          <div className="text-sm font-bold mb-4" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Overall Wellness
          </div>
          <WellnessScore score={d.wellness_score || 0} size={130} />
        </div>
        <ScoreCard label="Fitness Score" score={d.fitness_score} icon={Dumbbell} color="var(--accent-purple)" />
        <ScoreCard label="Nutrition Score" score={d.nutrition_score} icon={Utensils} color="var(--accent-emerald)" />
        <ScoreCard label="Mental Health Score" score={d.mental_health_score} icon={Brain} color="var(--accent-amber)" />
      </div>

      {/* Summaries */}
      <div className="grid-3 mb-6">
        <div className="card fade-up fade-up-1">
          <div className="section-title"><Dumbbell size={16} style={{ color: 'var(--accent-purple)' }} /> Fitness This Week</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Sessions', value: fitness.sessions || 0, unit: '' },
              { label: 'Calories Burned', value: `${Math.round(fitness.calories_burned || 0)}`, unit: 'kcal' },
              { label: 'Active Time', value: `${Math.round(fitness.duration_minutes || 0)}`, unit: 'min' },
              { label: 'Steps', value: (fitness.steps || 0).toLocaleString(), unit: '' },
            ].map(({ label, value, unit }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">{label}</span>
                <span style={{ fontWeight: '700' }}>{value} <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>{unit}</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="card fade-up fade-up-2">
          <div className="section-title"><Utensils size={16} style={{ color: 'var(--accent-emerald)' }} /> Nutrition This Week</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Meals Logged', value: nutrition.meals_logged || 0, unit: '' },
              { label: 'Avg Daily Calories', value: `${Math.round(nutrition.avg_daily_calories || 0)}`, unit: 'kcal' },
              { label: 'Avg Protein', value: `${Math.round(nutrition.avg_protein_g || 0)}`, unit: 'g' },
              { label: 'Macro Split', value: `${Math.round(nutrition.macro_distribution?.protein || 0)}P / ${Math.round(nutrition.macro_distribution?.carbs || 0)}C / ${Math.round(nutrition.macro_distribution?.fat || 0)}F`, unit: '%' },
            ].map(({ label, value, unit }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">{label}</span>
                <span style={{ fontWeight: '700' }}>{value} <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>{unit}</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="card fade-up fade-up-3">
          <div className="section-title"><Brain size={16} style={{ color: 'var(--accent-amber)' }} /> Mental Health This Week</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Check-ins', value: mental.entries || 0, unit: '' },
              { label: 'Avg Mood', value: `${mental.avg_mood?.toFixed(1) || '—'}`, unit: '/10' },
              { label: 'Avg Stress', value: `${mental.avg_stress?.toFixed(1) || '—'}`, unit: '/10' },
              { label: 'Avg Sleep', value: mental.avg_sleep ? `${mental.avg_sleep.toFixed(1)}` : '—', unit: 'hrs' },
            ].map(({ label, value, unit }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">{label}</span>
                <span style={{ fontWeight: '700' }}>{value} <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>{unit}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card mb-6 fade-up">
        <div className="section-title">Weekly Insights & Recommendations</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recs.map((rec, i) => <div key={i} className="rec-card">{rec}</div>)}
        </div>
      </div>

      {/* AI Panel */}
      <AIPanel />
    </div>
  )
}
