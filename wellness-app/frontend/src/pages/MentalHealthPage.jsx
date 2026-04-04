import { useState } from 'react'
import { useFetch } from '../hooks'
import { moodApi, aiApi } from '../services/api'
import VoiceInput from '../components/ui/VoiceInput'
import { MoodChart, WellbeingChart } from '../components/charts/Charts'
import { Brain, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { fmt, moodEmoji } from '../utils'

const EMOTIONS = ['Happy','Anxious','Calm','Stressed','Energetic','Tired','Focused','Overwhelmed',
  'Grateful','Irritable','Motivated','Sad','Content','Excited','Lonely','Hopeful']

function MoodSlider({ label, name, value, onChange, min = 1, max = 10, colorStart, colorEnd }) {
  return (
    <div className="form-group">
      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--accent-purple)' }}>
          {value}/10
        </span>
      </label>
      <input type="range" className="mood-slider" name={name}
        min={min} max={max} value={value} onChange={onChange} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
        <span>{min === 1 && name === 'stress_level' ? '😌 None' : '😢 Bad'}</span>
        <span>{min === 1 && name === 'stress_level' ? '😰 Extreme' : '😄 Great'}</span>
      </div>
    </div>
  )
}

function LogForm({ onSuccess }) {
  const [values, setValues] = useState({
    mood_score: 7, stress_level: 3, energy_level: 7, sleep_hours: 7,
    journal_notes: '', emotions: []
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const set = (k, v) => setValues(s => ({ ...s, [k]: v }))
  const handleChange = (e) => set(e.target.name, Number(e.target.value))
  const toggleEmotion = (e) => setValues(s => ({
    ...s,
    emotions: s.emotions.includes(e) ? s.emotions.filter(x => x !== e) : [...s.emotions, e]
  }))

  const handleJournalBlur = async () => {
    if (!values.journal_notes.trim()) return
    try {
      const res = await aiApi.analyzeJournal(values.journal_notes)
      if (res.data?.mood_score) {
        set('mood_score', res.data.mood_score)
        setSuccess(`AI updated mood to ${res.data.mood_score}/10 based on sentiment!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleVoiceTranscribed = async (text) => {
    const newNotes = values.journal_notes ? `${values.journal_notes} ${text}` : text
    set('journal_notes', newNotes)
    try {
      const res = await aiApi.analyzeJournal(newNotes)
      if (res.data?.mood_score) {
        set('mood_score', res.data.mood_score)
        setSuccess(`Voice transcribed. AI updated mood to ${res.data.mood_score}/10!`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true); setError(null); setSuccess(null)
    try {
      await moodApi.log(values)
      setSuccess('Mood logged!')
      setValues({ mood_score: 7, stress_level: 3, energy_level: 7, sleep_hours: 7, journal_notes: '', emotions: [] })
      onSuccess?.()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to log mood')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="card">
      <div className="section-title" style={{ marginBottom: '20px' }}>
        <Plus size={16} /> Log Today's Wellbeing
      </div>
      {error && <div className="alert alert-error mb-3">{error}</div>}
      {success && <div className="alert alert-success mb-3">{success}</div>}

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '52px', marginBottom: '8px' }}>{moodEmoji(values.mood_score)}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '800' }}>
          Mood: {values.mood_score}/10
        </div>
      </div>

      <MoodSlider label="Mood Score" name="mood_score" value={values.mood_score} onChange={handleChange} />
      <MoodSlider label="Stress Level" name="stress_level" value={values.stress_level} onChange={handleChange} />
      <MoodSlider label="Energy Level" name="energy_level" value={values.energy_level} onChange={handleChange} />

      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Sleep Last Night (hours)</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--accent-purple)' }}>
            {values.sleep_hours}h
          </span>
        </label>
        <input type="range" className="mood-slider" name="sleep_hours"
          min="0" max="12" step="0.5" value={values.sleep_hours}
          onChange={e => set('sleep_hours', Number(e.target.value))} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>0h</span><span>12h</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">How are you feeling?</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {EMOTIONS.map(e => (
            <button key={e} className={`emotion-tag ${values.emotions.includes(e) ? 'selected' : ''}`}
              onClick={() => toggleEmotion(e)}>{e}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Journal Entry (optional)</span>
          <VoiceInput onTextResult={handleVoiceTranscribed} />
        </label>
        <textarea className="form-input" name="journal_notes" value={values.journal_notes}
          onChange={e => set('journal_notes', e.target.value)}
          onBlur={handleJournalBlur}
          placeholder="How was your day? Any thoughts you want to capture... (AI will analyze your sentiment!)"
          style={{ minHeight: '100px' }} />
      </div>

      <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? <span className="spinner" /> : <><Brain size={16} /> Save Check-in</>}
      </button>
    </div>
  )
}

function TrendBadge({ trend }) {
  const cfg = {
    improving: { icon: TrendingUp, color: 'var(--accent-emerald)', bg: 'var(--accent-emerald-light)' },
    declining: { icon: TrendingDown, color: 'var(--accent-rose)', bg: 'var(--accent-rose-light)' },
    stable: { icon: Minus, color: 'var(--accent-amber)', bg: 'var(--accent-amber-light)' },
  }[trend] || cfg?.stable
  const Icon = cfg.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px',
      borderRadius: '100px', background: cfg.bg, color: cfg.color, fontSize: '12px', fontWeight: '600' }}>
      <Icon size={12} /> {trend}
    </span>
  )
}

export default function MentalHealthPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey(k => k + 1)
  
  const { data: trends } = useFetch(() => moodApi.trends(14), [refreshKey])
  const { data: history, loading: hLoading } = useFetch(() => moodApi.history(20), [refreshKey])

  const avgs = trends?.averages || {}
  const trendData = trends?.trends || {}
  const emotions = trends?.emotion_frequency || {}
  const dailyData = trends?.daily_breakdown || []

  return (
    <div className="page-container">
      {/* Summary */}
      <div className="grid-4 mb-4">
        {[
          { label: 'Avg Mood', value: avgs.mood ? `${moodEmoji(avgs.mood)} ${avgs.mood}` : '—', unit: '/10', color: 'var(--accent-amber)' },
          { label: 'Avg Stress', value: avgs.stress?.toFixed(1) || '—', unit: '/10', color: 'var(--accent-rose)' },
          { label: 'Avg Energy', value: avgs.energy?.toFixed(1) || '—', unit: '/10', color: 'var(--accent-purple)' },
          { label: 'Avg Sleep', value: avgs.sleep_hours?.toFixed(1) || '—', unit: 'hrs', color: 'var(--accent-sky)' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-card-accent" style={{ background: color }} />
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value} <span className="stat-unit">{unit}</span></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '20px', marginBottom: '20px' }}>
        <LogForm onSuccess={refresh} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="section-title" style={{ marginBottom: 0 }}>14-Day Mood Trends</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {Object.entries(trendData).map(([key, val]) => (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'capitalize' }}>{key}</div>
                    <TrendBadge trend={val} />
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-container-lg">
              <MoodChart data={dailyData} />
            </div>
          </div>
          <div className="card">
            <div className="section-title">Wellbeing Index</div>
            <div className="chart-container">
              <WellbeingChart data={dailyData} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
        {/* Emotion cloud */}
        {Object.keys(emotions).length > 0 && (
          <div className="card">
            <div className="section-title">Most Frequent Emotions</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {Object.entries(emotions).map(([emotion, count]) => (
                <div key={emotion} style={{
                  padding: '6px 14px', borderRadius: '100px',
                  background: 'var(--accent-purple-light)', color: 'var(--accent-purple)',
                  fontSize: '13px', fontWeight: '600',
                  opacity: 0.4 + (count / Math.max(...Object.values(emotions))) * 0.6
                }}>
                  {emotion} <span style={{ opacity: 0.7 }}>×{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="card" style={{ gridColumn: Object.keys(emotions).length === 0 ? '1 / -1' : 'auto' }}>
          <div className="section-title">Recent Check-ins</div>
          {hLoading ? (
            [...Array(5)].map((_, i) => <div key={i} className="skeleton mb-2" style={{ height: '60px' }} />)
          ) : (history?.logs || []).length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧘</div>
              <div>No check-ins yet. Start tracking your mental health!</div>
            </div>
          ) : (
            <div className="scroll-list">
              {(history?.logs || []).map(log => (
                <div key={log.id} className="log-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '28px' }}>{moodEmoji(log.mood_score)}</div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>
                        Mood {log.mood_score}/10 · Stress {log.stress_level}/10
                      </div>
                      <div className="text-muted">{fmt.ago(log.logged_at)}</div>
                      {log.emotions?.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                          {log.emotions.slice(0, 3).map(e => (
                            <span key={e} className="badge badge-purple" style={{ fontSize: '10px' }}>{e}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {log.sleep_hours && <div style={{ fontSize: '13px', fontWeight: '600' }}>😴 {log.sleep_hours}h</div>}
                    {log.energy_level && <div className="text-muted">⚡ {log.energy_level}/10</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
