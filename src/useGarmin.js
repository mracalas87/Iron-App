import { useState } from 'react'
import { importGarminRuns } from './db'

export const CACHE_KEY = 'iron-health-cache'
const ACCESS_KEY_STORAGE = 'iron-garmin-key'

export function readGarminCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

// The Garmin connection: saved access key, the cached response, and a refresh that
// also imports Garmin runs into the run log.
export function useGarmin() {
  const [accessKey, setAccessKey] = useState(() => {
    try {
      return localStorage.getItem(ACCESS_KEY_STORAGE) || ''
    } catch {
      return ''
    }
  })
  const [data, setData] = useState(readGarminCache)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const today = new Date().toLocaleDateString('en-CA') // the phone's own date, so days line up with yours
      const res = await fetch(`/api/garmin?today=${today}`, { headers: { 'x-garmin-key': accessKey } })
      const json = await res.json().catch(() => null)
      if (!json) throw new Error('Could not reach the Garmin sync. Try again in a moment.')
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`)
      localStorage.setItem(CACHE_KEY, JSON.stringify(json))
      await importGarminRuns(json.activities)
      setData(json)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  function saveKey(key) {
    const trimmed = key.trim()
    localStorage.setItem(ACCESS_KEY_STORAGE, trimmed)
    setAccessKey(trimmed)
  }

  function forgetKey() {
    localStorage.removeItem(ACCESS_KEY_STORAGE)
    localStorage.removeItem(CACHE_KEY)
    setAccessKey('')
    setData(null)
  }

  return { accessKey, data, loading, error, refresh, saveKey, forgetKey }
}
