import { scoreColor, scoreLabel } from '../../utils'

export default function WellnessScore({ score = 0, size = 140, showLabel = true }) {
  const pct = Math.min(score, 100)
  const color = scoreColor(pct)
  const label = scoreLabel(pct)
  const radius = size / 2 - 10
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke="var(--border)" strokeWidth="10" />
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: size * 0.22,
            fontWeight: '800', color, lineHeight: 1
          }}>
            {Math.round(pct)}
          </div>
          <div style={{ fontSize: size * 0.09, color: 'var(--text-muted)', fontWeight: '500' }}>/ 100</div>
        </div>
      </div>
      {showLabel && (
        <div style={{
          padding: '4px 14px', borderRadius: '100px',
          background: color + '20', color, fontSize: '12px', fontWeight: '700'
        }}>
          {label}
        </div>
      )}
    </div>
  )
}
