import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePersons() {
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPersons = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('persons').select('*').order('created_at')
    setPersons(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPersons() }, [fetchPersons])

  const createPerson = useCallback(async (person) => {
    const { data, error } = await supabase.from('persons').insert([person]).select().single()
    if (error) throw new Error('Person konnte nicht angelegt werden.')
    setPersons(prev => [...prev, data])
    return data
  }, [])

  const updatePerson = useCallback(async (id, updates) => {
    const { data, error } = await supabase.from('persons').update(updates).eq('id', id).select().single()
    if (error) throw new Error('Person konnte nicht aktualisiert werden.')
    setPersons(prev => prev.map(p => p.id === id ? data : p))
    return data
  }, [])

  const updateGoals = useCallback(async (id, goals) => {
    const { data, error } = await supabase.from('persons').update({ nutrient_goals: goals }).eq('id', id).select().single()
    if (error) throw new Error('Ziele konnten nicht gespeichert werden.')
    setPersons(prev => prev.map(p => p.id === id ? data : p))
    return data
  }, [])

  const deletePerson = useCallback(async (id) => {
    const { error } = await supabase.from('persons').delete().eq('id', id)
    if (error) throw new Error('Person konnte nicht gelöscht werden.')
    setPersons(prev => prev.filter(p => p.id !== id))
  }, [])

  return { persons, loading, refetch: fetchPersons, createPerson, updatePerson, updateGoals, deletePerson }
}
