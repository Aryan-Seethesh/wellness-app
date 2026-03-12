import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const fitnessApi = {
  log: (data) => api.post('/fitness/log', data),
  history: (limit = 30, skip = 0) => api.get(`/fitness/history?limit=${limit}&skip=${skip}`),
  summary: (days = 7) => api.get(`/fitness/summary?days=${days}`),
  chart: (days = 7) => api.get(`/fitness/chart?days=${days}`),
}

export const nutritionApi = {
  log: (data) => api.post('/nutrition/log', data),
  history: (limit = 30) => api.get(`/nutrition/history?limit=${limit}`),
  analysis: (days = 7) => api.get(`/nutrition/analysis?days=${days}`),
}

export const moodApi = {
  log: (data) => api.post('/mood/log', data),
  history: (limit = 30) => api.get(`/mood/history?limit=${limit}`),
  trends: (days = 14) => api.get(`/mood/trends?days=${days}`),
}

export const insightsApi = {
  weekly: () => api.get('/insights/weekly'),
  dashboard: () => api.get('/insights/dashboard'),
}

export const aiApi = {
  workout: () => api.post('/ai/recommend-workout'),
  nutrition: () => api.post('/ai/nutrition-advice'),
  mental: () => api.post('/ai/mental-health-support'),
}

export default api
