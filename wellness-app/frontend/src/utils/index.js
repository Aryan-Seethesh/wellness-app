import { format, parseISO, formatDistanceToNow } from 'date-fns'

export const fmt = {
  date: (d) => format(parseISO(d), 'MMM d, yyyy'),
  dateShort: (d) => format(parseISO(d), 'MMM d'),
  dayOfWeek: (d) => format(parseISO(d), 'EEE'),
  time: (d) => format(parseISO(d), 'h:mm a'),
  ago: (d) => formatDistanceToNow(parseISO(d), { addSuffix: true }),
  number: (n, dec = 0) => (n ?? 0).toFixed(dec),
  cal: (n) => `${Math.round(n ?? 0)} kcal`,
}

export const scoreColor = (score) => {
  if (score >= 75) return 'var(--accent-emerald)'
  if (score >= 50) return 'var(--accent-amber)'
  return 'var(--accent-rose)'
}

export const scoreLabel = (score) => {
  if (score >= 80) return 'Excellent'
  if (score >= 65) return 'Good'
  if (score >= 45) return 'Fair'
  if (score >= 25) return 'Needs Work'
  return 'Getting Started'
}

export const moodEmoji = (score) => {
  if (score >= 9) return '😄'
  if (score >= 7) return '😊'
  if (score >= 5) return '😐'
  if (score >= 3) return '😔'
  return '😢'
}

export const workoutColors = {
  cardio: '#ef4444', strength: '#8b5cf6', yoga: '#06b6d4',
  hiit: '#f97316', cycling: '#3b82f6', swimming: '#0891b2',
  running: '#dc2626', walking: '#10b981', other: '#6b7280'
}
