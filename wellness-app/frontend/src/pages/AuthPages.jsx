import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Activity } from 'lucide-react'

function AuthLayout({ children, title, subtitle, link }) {
  return (
    <div className="auth-container">
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-10%',
          width: '40vw', height: '40vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)'
        }} />
      </div>
      <div className="auth-card" style={{ position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Activity size={22} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '800' }}>
              Vita<span style={{
                background: 'linear-gradient(135deg, #7c3aed, #059669)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>lis</span>
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>{title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{subtitle}</p>
        </div>
        {children}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
          {link}
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.detail || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Track your wellness journey"
      link={<>Don't have an account? <Link to="/register" style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>Sign up</Link></>}
    >
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input className="form-input" type={show ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
              style={{ paddingRight: '44px' }} />
            <button type="button" onClick={() => setShow(s => !s)} style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
            }}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
          {loading ? <span className="spinner" /> : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: '', email: '', password: '', age: '', weight_kg: '', height_cm: '', fitness_goal: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1)

  const set = (k, v) => setValues(s => ({ ...s, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const payload = { name: values.name, email: values.email, password: values.password }
      if (values.age) payload.age = Number(values.age)
      if (values.weight_kg) payload.weight_kg = Number(values.weight_kg)
      if (values.height_cm) payload.height_cm = Number(values.height_cm)
      if (values.fitness_goal) payload.fitness_goal = values.fitness_goal
      await register(payload)
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.detail || 'Registration failed')
      setStep(1)
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout
      title="Start your journey"
      subtitle="Create your wellness profile"
      link={<>Already have an account? <Link to="/login" style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>Sign in</Link></>}
    >
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <div className="tabs mb-4" style={{ marginBottom: '24px' }}>
        <button className={`tab ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>Account</button>
        <button className={`tab ${step === 2 ? 'active' : ''}`} onClick={() => setStep(2)}>Health Profile</button>
      </div>
      <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2) }}>
        {step === 1 ? (
          <>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={values.name} onChange={e => set('name', e.target.value)}
                placeholder="Your name" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={values.email} onChange={e => set('email', e.target.value)}
                placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password (min 8 characters)</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={show ? 'text' : 'password'} value={values.password}
                  onChange={e => set('password', e.target.value)} placeholder="••••••••" required minLength="8"
                  style={{ paddingRight: '44px' }} />
                <button type="button" onClick={() => setShow(s => !s)} style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                }}>
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" style={{ marginTop: '8px' }}>
              Continue →
            </button>
          </>
        ) : (
          <>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Age (optional)</label>
                <input className="form-input" type="number" value={values.age}
                  onChange={e => set('age', e.target.value)} placeholder="25" min="1" max="120" />
              </div>
              <div className="form-group">
                <label className="form-label">Weight kg (optional)</label>
                <input className="form-input" type="number" value={values.weight_kg}
                  onChange={e => set('weight_kg', e.target.value)} placeholder="70" step="0.1" />
              </div>
              <div className="form-group">
                <label className="form-label">Height cm (optional)</label>
                <input className="form-input" type="number" value={values.height_cm}
                  onChange={e => set('height_cm', e.target.value)} placeholder="170" step="0.1" />
              </div>
              <div className="form-group">
                <label className="form-label">Fitness Goal</label>
                <select className="form-input" value={values.fitness_goal} onChange={e => set('fitness_goal', e.target.value)}>
                  <option value="">Select goal</option>
                  <option value="weight_loss">Weight Loss</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="endurance">Endurance</option>
                  <option value="general_fitness">General Fitness</option>
                  <option value="stress_reduction">Stress Reduction</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Create Account 🎉'}
              </button>
            </div>
          </>
        )}
      </form>
    </AuthLayout>
  )
}
