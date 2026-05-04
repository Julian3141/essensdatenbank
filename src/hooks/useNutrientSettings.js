import { useState, useCallback } from 'react'
import { DEFAULT_SUMMARY_NUTRIENTS } from '../lib/nutrients'

const STORAGE_KEY = 'nutrient_summary_settings'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_SUMMARY_NUTRIENTS
}

export function useNutrientSettings() {
  const [visibleNutrients, setVisibleNutrients] = useState(load)

  const toggle = useCallback((key) => {
    setVisibleNutrients(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setVisibleNutrients(DEFAULT_SUMMARY_NUTRIENTS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SUMMARY_NUTRIENTS))
  }, [])

  return { visibleNutrients, toggle, reset }
}
