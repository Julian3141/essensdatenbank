import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useMealPlan(weekStart) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    if (!weekStart) return
    setLoading(true)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const endStr = weekEnd.toISOString().split('T')[0]
    const startStr = weekStart.toISOString().split('T')[0]

    const { data } = await supabase
      .from('meal_plan_entries')
      .select(`
        *,
        recipes (
          id, name, servings,
          recipe_ingredients (
            amount_grams,
            foods (id, name, nutrients)
          )
        )
      `)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date')

    setEntries(data || [])
    setLoading(false)
  }, [weekStart])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const addEntry = useCallback(async (entry) => {
    const { data, error } = await supabase
      .from('meal_plan_entries')
      .insert([entry])
      .select(`
        *,
        recipes (
          id, name, servings,
          recipe_ingredients (
            amount_grams,
            foods (id, name, nutrients)
          )
        )
      `)
      .single()
    if (error) throw new Error('Eintrag konnte nicht hinzugefügt werden.')
    setEntries(prev => [...prev, data])
    return data
  }, [])

  const removeEntry = useCallback(async (id) => {
    const { error } = await supabase.from('meal_plan_entries').delete().eq('id', id)
    if (error) throw new Error('Eintrag konnte nicht entfernt werden.')
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  const updateServings = useCallback(async (id, servings) => {
    const { data, error } = await supabase
      .from('meal_plan_entries')
      .update({ servings })
      .eq('id', id)
      .select(`
        *,
        recipes (
          id, name, servings,
          recipe_ingredients (
            amount_grams,
            foods (id, name, nutrients)
          )
        )
      `)
      .single()
    if (error) throw new Error('Portionen konnten nicht aktualisiert werden.')
    setEntries(prev => prev.map(e => e.id === id ? data : e))
  }, [])

  return { entries, loading, refetch: fetchEntries, addEntry, removeEntry, updateServings }
}
