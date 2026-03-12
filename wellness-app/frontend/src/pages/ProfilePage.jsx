import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Save } from 'lucide-react'

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [values, setValues] = useState({
    name: user?.name || '',
    age: user?.age || '',
    weight_kg: user?.weight_kg || '',
    height_cm: user?.height_cm || '',
    fitness_goal: user?.fitness_goal || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setValues(v => ({ ...v, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }))
  }

  const handleSave = async () => {
    setSaving(true); setError(null); setSuccess(null)
    try {
      const payload = {}
      if (values.name) payload.name = values.name
      if (values.age) payload.age = Number(values.age)
      if (values.weight_kg) payload.weight_kg = Number(values.weight_kg)
      if (values.height_cm) payload.height_cm = Number(values.height_cm)
      if (values.fitness_goal) payload.fitness_goal = values.fitness_goal
      await updateProfile(payload)
      setSuccess('Profile updated successfully!')
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to update profile')
    } finally { setSaving(false) }
  }

  const bmi = values.weight_kg && values.height_cm
    ? (Number(values.weight_kg) / Math.pow(Number(values.height_cm) / 100, 2)).toFixed(1)
    : null

  const bmiLabel = bmi ? (bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese') : null
  const bmiColor = bmi ? (bmi < 18.5 ? 'var(--accent-sky)' : bmi < 25 ? 'var(--accent-emerald)' : bmi < 30 ? 'var(--accent-amber)' : 'var(--accent-rose)') : null

  return (
    <div className="page-container">
      <div style={{ maxWidth: '640px' }}>
        <div className="card mb-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: '800', color: 'white',
              fontFamily: 'var(--font-display)', flexShrink: 0
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700' }}>{user?.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{user?.email}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error mb-3">{error}</div>}
          {success && <div className="alert alert-success mb-3">{success}</div>}

          <div className="section-title"><User size={16} /> Personal Information</div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" name="name" value={values.name} onChange={handleChange} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Age</label>
              <input className="form-input" type="number" name="age" value={values.age} onChange={handleChange} min="1" max="120" />
            </div>
            <div className="form-group">
              <label className="form-label">Fitness Goal</label>
              <select className="form-input" name="fitness_goal" value={values.fitness_goal} onChange={handleChange}>
                <option value="">Select goal</option>
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="endurance">Endurance</option>
                <option value="flexibility">Flexibility</option>
                <option value="general_fitness">General Fitness</option>
                <option value="stress_reduction">Stress Reduction</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" type="number" name="weight_kg" value={values.weight_kg}
                onChange={handleChange} step="0.1" min="1" max="500" />
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input className="form-input" type="number" name="height_cm" value={values.height_cm}
                onChange={handleChange} step="0.1" min="50" max="300" />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : <><Save size={16} /> Save Changes</>}
          </button>
        </div>

        {bmi && (
          <div className="card">
            <div className="section-title">Health Metrics</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '44px', fontWeight: '800', color: bmiColor, lineHeight: 1 }}>
                  {bmi}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>BMI</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: bmiColor, marginTop: '4px' }}>{bmiLabel}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="progress-bar" style={{ marginBottom: '8px' }}>
                  <div className="progress-fill" style={{
                    width: `${Math.min((bmi / 40) * 100, 100)}%`,
                    background: `linear-gradient(to right, var(--accent-sky), var(--accent-emerald), var(--accent-amber), var(--accent-rose))`
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Healthy BMI range: 18.5 – 24.9
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
