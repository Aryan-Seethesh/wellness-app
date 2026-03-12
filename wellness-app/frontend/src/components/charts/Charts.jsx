import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '10px 14px', boxShadow: 'var(--shadow-md)',
      fontSize: '13px'
    }}>
      {label && <div style={{ fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

const axisStyle = { fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }
const gridStyle = { stroke: 'var(--border)', strokeDasharray: '3 3' }

export function CaloriesChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <defs>
          <linearGradient id="calBurned" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="calIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d?.slice(5)} />
        <YAxis tick={axisStyle} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="calories" stroke="#7c3aed" strokeWidth={2}
          fill="url(#calBurned)" name="Burned" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function NutritionChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d?.slice(5)} />
        <YAxis tick={axisStyle} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="calories" fill="#059669" name="Calories" radius={[3, 3, 0, 0]} maxBarSize={32} />
        <Bar dataKey="protein" fill="#7c3aed" name="Protein (g)" radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function MoodChart({ data = [] }) {
  const filtered = data.filter(d => d.mood !== null)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={filtered} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d?.slice(5)} />
        <YAxis tick={axisStyle} domain={[0, 10]} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={2.5}
          dot={{ fill: '#f59e0b', r: 3 }} name="Mood" activeDot={{ r: 5 }} connectNulls />
        <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2}
          dot={{ fill: '#ef4444', r: 3 }} name="Stress" strokeDasharray="5 5" connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function MacroPieChart({ data = { protein: 30, carbs: 50, fat: 20 } }) {
  const items = [
    { name: 'Protein', value: data.protein, color: '#7c3aed' },
    { name: 'Carbs', value: data.carbs, color: '#059669' },
    { name: 'Fat', value: data.fat, color: '#f59e0b' },
  ]
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={items} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
          dataKey="value" paddingAngle={3}>
          {items.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Pie>
        <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function FitnessBarChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d?.slice(5)} />
        <YAxis tick={axisStyle} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="duration" fill="#7c3aed" name="Duration (min)" radius={[3, 3, 0, 0]} maxBarSize={32} />
        <Bar dataKey="calories" fill="#0ea5e9" name="Calories" radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function WellbeingChart({ data = [] }) {
  const filtered = data.filter(d => d.wellbeing !== null)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={filtered} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <defs>
          <linearGradient id="wellbeing" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d?.slice(5)} />
        <YAxis tick={axisStyle} domain={[0, 10]} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="wellbeing" stroke="#06b6d4" strokeWidth={2.5}
          fill="url(#wellbeing)" name="Wellbeing" dot={false} connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  )
}
