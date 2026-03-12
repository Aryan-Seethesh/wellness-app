import { useState, useEffect, useCallback } from 'react'

export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetchFn()
      setData(r.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

export function useForm(initial = {}) {
  const [values, setValues] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const set = (field, value) => setValues(v => ({ ...v, [field]: value }))
  const handleChange = (e) => {
    const { name, value, type } = e.target
    set(name, type === 'number' ? (value === '' ? '' : Number(value)) : value)
  }

  const reset = () => { setValues(initial); setError(null); setSuccess(null) }

  const submit = async (fn) => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await fn(values)
      setSuccess(result)
      return result
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong')
      throw e
    } finally {
      setSubmitting(false)
    }
  }

  return { values, set, handleChange, submitting, error, success, reset, submit }
}
