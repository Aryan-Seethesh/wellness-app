import { useState } from 'react'
import { useFetch, useForm } from '../hooks'
import { nutritionApi } from '../services/api'
import { NutritionChart, MacroPieChart } from '../components/charts/Charts'
import { Utensils, Plus, Trash2 } from 'lucide-react'
import { fmt } from '../utils'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

function FoodItemRow({ item, onRemove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '8px',
      marginBottom: '6px'
    }}>
      <div>
        <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.name}</div>
        <div className="text-muted">{item.quantity_g}g · {Math.round(item.calories)} kcal</div>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
          <div>P: {item.protein_g}g C: {item.carbs_g}g F: {item.fat_g}g</div>
        </div>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-rose)' }}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

function LogForm({ onSuccess }) {
  const [foodItems, setFoodItems] = useState([])
  const [mealType, setMealType] = useState('lunch')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [newItem, setNewItem] = useState({ name: '', quantity_g: 100, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 })

  const addItem = () => {
    if (!newItem.name || !newItem.calories) return
    setFoodItems(items => [...items, { ...newItem }])
    setNewItem({ name: '', quantity_g: 100, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 })
  }

  const removeItem = (i) => setFoodItems(items => items.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (foodItems.length === 0) { setError('Add at least one food item'); return }
    setSubmitting(true); setError(null)
    try {
      await nutritionApi.log({ meal_type: mealType, food_items: foodItems, notes })
      setFoodItems([]); setNotes(''); setSuccess('Meal logged!')
      onSuccess?.()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to log meal')
    } finally { setSubmitting(false) }
  }

  const totalCal = foodItems.reduce((s, f) => s + f.calories, 0)

  return (
    <div className="card">
      <div className="section-title"><Plus size={16} /> Log Meal</div>
      {error && <div className="alert alert-error mb-3">{error}</div>}
      {success && <div className="alert alert-success mb-3">{success}</div>}

      <div className="form-group">
        <label className="form-label">Meal Type</label>
        <div className="tabs">
          {MEAL_TYPES.map(t => (
            <button key={t} className={`tab ${mealType === t ? 'active' : ''}`}
              onClick={() => setMealType(t)} style={{ textTransform: 'capitalize' }}>
              {t === 'breakfast' ? '🌅' : t === 'lunch' ? '☀️' : t === 'dinner' ? '🌙' : '🍎'} {t}
            </button>
          ))}
        </div>
      </div>

      {/* Add food item */}
      <div style={{ background: 'var(--bg-input)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <div className="text-sm font-bold mb-3">Add Food Item</div>
        <div className="grid-2">
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Food Name</label>
            <input className="form-input" value={newItem.name} placeholder="e.g. Grilled Chicken"
              onChange={e => setNewItem(v => ({ ...v, name: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Quantity (g)</label>
            <input className="form-input" type="number" value={newItem.quantity_g}
              onChange={e => setNewItem(v => ({ ...v, quantity_g: Number(e.target.value) }))} />
          </div>
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Calories (kcal)</label>
            <input className="form-input" type="number" value={newItem.calories || ''}
              onChange={e => setNewItem(v => ({ ...v, calories: Number(e.target.value) }))} />
          </div>
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Protein (g)</label>
            <input className="form-input" type="number" value={newItem.protein_g || ''}
              onChange={e => setNewItem(v => ({ ...v, protein_g: Number(e.target.value) }))} />
          </div>
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Carbs (g)</label>
            <input className="form-input" type="number" value={newItem.carbs_g || ''}
              onChange={e => setNewItem(v => ({ ...v, carbs_g: Number(e.target.value) }))} />
          </div>
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Fat (g)</label>
            <input className="form-input" type="number" value={newItem.fat_g || ''}
              onChange={e => setNewItem(v => ({ ...v, fat_g: Number(e.target.value) }))} />
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={addItem}>
          <Plus size={14} /> Add Item
        </button>
      </div>

      {/* Food items list */}
      {foodItems.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div className="text-sm font-bold">Meal Items</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-emerald)' }}>
              Total: {Math.round(totalCal)} kcal
            </div>
          </div>
          {foodItems.map((item, i) => <FoodItemRow key={i} item={item} onRemove={() => removeItem(i)} />)}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Notes (optional)</label>
        <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this meal?" />
      </div>
      <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={submitting || foodItems.length === 0}>
        {submitting ? <span className="spinner" /> : <><Utensils size={16} /> Log Meal</>}
      </button>
    </div>
  )
}

export default function NutritionPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey(k => k + 1)
  
  const { data: analysis } = useFetch(() => nutritionApi.analysis(7), [refreshKey])
  const { data: history, loading: hLoading } = useFetch(() => nutritionApi.history(20), [refreshKey])

  const avgs = analysis?.daily_averages || {}
  const macro = analysis?.macro_distribution_pct || {}
  const dailyData = analysis?.daily_breakdown || []

  return (
    <div className="page-container">
      {/* Summary */}
      <div className="grid-4 mb-4">
        {[
          { label: 'Avg Daily Calories', value: Math.round(avgs.calories || 0), unit: 'kcal', color: 'var(--accent-emerald)' },
          { label: 'Avg Protein', value: Math.round(avgs.protein_g || 0), unit: 'g/day', color: 'var(--accent-purple)' },
          { label: 'Avg Carbs', value: Math.round(avgs.carbs_g || 0), unit: 'g/day', color: 'var(--accent-amber)' },
          { label: 'Avg Fat', value: Math.round(avgs.fat_g || 0), unit: 'g/day', color: 'var(--accent-rose)' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-card-accent" style={{ background: color }} />
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value} <span className="stat-unit">{unit}</span></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
        <LogForm onSuccess={refresh} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="section-title">7-Day Calorie Trend</div>
            <div className="chart-container">
              <NutritionChart data={dailyData} />
            </div>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <div className="section-title">Macronutrient Split</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '180px', height: '180px', flexShrink: 0 }}>
                <MacroPieChart data={macro} />
              </div>
              <div style={{ flex: 1 }}>
                {[
                  { label: 'Protein', pct: macro.protein, color: '#7c3aed' },
                  { label: 'Carbs', pct: macro.carbs, color: '#059669' },
                  { label: 'Fat', pct: macro.fat, color: '#f59e0b' },
                ].map(({ label, pct, color }) => (
                  <div key={label} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600' }}>{label}</span>
                      <span style={{ color, fontWeight: '700' }}>{(pct || 0).toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct || 0}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div className="section-title">Recent Meals</div>
        {hLoading ? (
          [...Array(5)].map((_, i) => <div key={i} className="skeleton mb-2" style={{ height: '60px' }} />)
        ) : (history?.logs || []).length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🥗</div>
            <div>No meals logged yet. Start tracking your nutrition!</div>
          </div>
        ) : (
          <div className="scroll-list">
            {(history?.logs || []).map(log => (
              <div key={log.id} className="log-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '24px' }}>
                    {log.meal_type === 'breakfast' ? '🌅' : log.meal_type === 'lunch' ? '☀️' :
                     log.meal_type === 'dinner' ? '🌙' : '🍎'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', textTransform: 'capitalize' }}>
                      {log.meal_type} · {log.food_items?.length} item{log.food_items?.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-muted">{fmt.ago(log.logged_at)}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: 'var(--accent-emerald)' }}>{Math.round(log.total_calories)} kcal</div>
                  <div className="text-muted">P:{Math.round(log.total_protein_g)}g C:{Math.round(log.total_carbs_g)}g F:{Math.round(log.total_fat_g)}g</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
