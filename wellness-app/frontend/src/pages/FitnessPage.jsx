import { useState } from 'react'
import { useFetch, useForm } from '../hooks'
import { fitnessApi } from '../services/api'
import { FitnessBarChart } from '../components/charts/Charts'
import { Dumbbell, Plus, Clock, Flame, Footprints, ChevronRight } from 'lucide-react'
import { fmt, workoutColors } from '../utils'

const WORKOUT_TYPES = ['cardio','strength','yoga','hiit','cycling','swimming','running','walking','other']
const INTENSITIES = ['low','medium','high']

function LogForm({ onSuccess }) {
  const { values, handleChange, set, submitting, error, success, reset, submit } = useForm({
    workout_type: 'running', duration_minutes: 30, calories_burned: '',
    steps: '', distance_km: '', intensity: 'medium', notes: ''
  })

  const handleSubmit = () => submit(async (v) => {
    const payload = {
      workout_type: v.workout_type,
      duration_minutes: Number(v.duration_minutes),
      intensity: v.intensity,
      notes: v.notes || undefined,
      ...(v.calories_burned ? { calories_burned: Number(v.calories_burned) } : {}),
      ...(v.steps ? { steps: Number(v.steps) } : {}),
      ...(v.distance_km ? { distance_km: Number(v.distance_km) } : {}),
    }
    await fitnessApi.log(payload)
    reset()
    onSuccess?.()
    return 'Workout logged!'
  })

  return (
    <div className="card">
      <div className="section-title"><Plus size={16} /> Log Workout</div>
      {error && <div className="alert alert-error mb-3">{error}</div>}
      {success && <div className="alert alert-success mb-3">{success}</div>}

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Workout Type</label>
          <select className="form-input" name="workout_type" value={values.workout_type} onChange={handleChange}>
            {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Intensity</label>
          <select className="form-input" name="intensity" value={values.intensity} onChange={handleChange}>
            {INTENSITIES.map(i => <option key={i} value={i}>{i.charAt(0).toUpperCase()+i.slice(1)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Duration (minutes) *</label>
          <input className="form-input" type="number" name="duration_minutes"
            value={values.duration_minutes} onChange={handleChange} min="1" max="600" />
        </div>
        <div className="form-group">
          <label className="form-label">Calories Burned (auto-calc if empty)</label>
          <input className="form-input" type="number" name="calories_burned"
            value={values.calories_burned} onChange={handleChange} placeholder="Auto" min="0" />
        </div>
        <div className="form-group">
          <label className="form-label">Steps (optional)</label>
          <input className="form-input" type="number" name="steps"
            value={values.steps} onChange={handleChange} placeholder="0" min="0" />
        </div>
        <div className="form-group">
          <label className="form-label">Distance (km, optional)</label>
          <input className="form-input" type="number" name="distance_km"
            value={values.distance_km} onChange={handleChange} placeholder="0.0" step="0.1" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Notes (optional)</label>
        <textarea className="form-input" name="notes" value={values.notes}
          onChange={handleChange} placeholder="How did it feel?" style={{ minHeight: '60px' }} />
      </div>
      <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? <span className="spinner" /> : <><Dumbbell size={16} /> Log Workout</>}
      </button>
    </div>
  )
}

function SummaryCards({ summary }) {
  if (!summary) return null
  const cards = [
    { label: 'Sessions', value: summary.total_sessions, unit: 'this week', icon: Dumbbell, color: 'var(--accent-purple)' },
    { label: 'Calories Burned', value: Math.round(summary.total_calories_burned || 0), unit: 'kcal', icon: Flame, color: 'var(--accent-rose)' },
    { label: 'Total Duration', value: Math.round(summary.total_duration_minutes || 0), unit: 'min', icon: Clock, color: 'var(--accent-sky)' },
    { label: 'Steps', value: (summary.total_steps || 0).toLocaleString(), unit: 'total', icon: Footprints, color: 'var(--accent-emerald)' },
  ]
  return (
    <div className="grid-4 mb-4">
      {cards.map(({ label, value, unit, icon: Icon, color }) => (
        <div key={label} className="stat-card">
          <div className="stat-card-accent" style={{ background: color }} />
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value} <span className="stat-unit">{unit}</span></div>
          <div style={{ color, marginTop: '8px' }}><Icon size={20} /></div>
        </div>
      ))}
    </div>
  )
}

export default function FitnessPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey(k => k + 1)
  
  const { data: summary, loading: sLoading } = useFetch(() => fitnessApi.summary(7), [refreshKey])
  const { data: chart, loading: cLoading } = useFetch(() => fitnessApi.chart(7), [refreshKey])
  const { data: history, loading: hLoading } = useFetch(() => fitnessApi.history(20), [refreshKey])

  return (
    <div className="page-container">
      <SummaryCards summary={summary} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
        <LogForm onSuccess={refresh} />
        <div className="card">
          <div className="section-title"><Flame size={16} style={{ color: 'var(--accent-purple)' }} /> 7-Day Activity</div>
          <div className="chart-container-lg">
            {cLoading ? <div className="skeleton" style={{ height: '100%' }} /> :
              <FitnessBarChart data={chart || []} />}
          </div>
          {summary?.workout_type_breakdown && (
            <div style={{ marginTop: '16px' }}>
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Workout Types</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(summary.workout_type_breakdown).map(([type, count]) => (
                  <span key={type} className="badge" style={{
                    background: workoutColors[type] + '20', color: workoutColors[type]
                  }}>
                    {type} × {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-title">Recent Workouts</div>
        {hLoading ? (
          [...Array(5)].map((_, i) => <div key={i} className="skeleton mb-2" style={{ height: '52px' }} />)
        ) : (history?.logs || []).length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏋️</div>
            <div>No workouts logged yet. Start tracking your fitness!</div>
          </div>
        ) : (
          <div className="scroll-list">
            {(history?.logs || []).map(log => (
              <div key={log.id} className="log-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '10px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                    background: (workoutColors[log.workout_type] || '#888') + '18'
                  }}>
                    {log.workout_type === 'running' ? '🏃' :
                     log.workout_type === 'strength' ? '💪' :
                     log.workout_type === 'yoga' ? '🧘' :
                     log.workout_type === 'cycling' ? '🚴' :
                     log.workout_type === 'swimming' ? '🏊' : '🏋️'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', textTransform: 'capitalize' }}>
                      {log.workout_type}
                    </div>
                    <div className="text-muted">{fmt.ago(log.logged_at)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{log.duration_minutes} min</div>
                    <div className="text-muted">{Math.round(log.calories_burned || 0)} kcal</div>
                  </div>
                  <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>{log.intensity || 'medium'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
