import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const FoodsContext = createContext(null)

export function FoodsProvider({ children }) {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFoods = useCallback(async () => {
    setLoading(true)
    setError(null)
    const PAGE = 1000
    let all = []
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .order('name')
        .range(from, from + PAGE - 1)
      if (error) { setError('Lebensmittel konnten nicht geladen werden.'); break }
      all = all.concat(data || [])
      if (!data || data.length < PAGE) break
      from += PAGE
    }
    setFoods(all)
    setLoading(false)
  }, [])

  useEffect(() => { fetchFoods() }, [fetchFoods])

  const createFood = useCallback(async (food) => {
    const { data, error } = await supabase.from('foods').insert([food]).select().single()
    if (error) throw new Error('Lebensmittel konnte nicht gespeichert werden.')
    setFoods(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }, [])

  const updateFood = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('foods').update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) throw new Error('Lebensmittel konnte nicht aktualisiert werden.')
    setFoods(prev => prev.map(f => f.id === id ? data : f).sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }, [])

  const deleteFood = useCallback(async (id) => {
    const { error } = await supabase.from('foods').delete().eq('id', id)
    if (error) throw new Error('Lebensmittel konnte nicht gelöscht werden. Möglicherweise wird es noch in einem Rezept verwendet.')
    setFoods(prev => prev.filter(f => f.id !== id))
  }, [])

  return (
    <FoodsContext.Provider value={{ foods, loading, error, refetch: fetchFoods, createFood, updateFood, deleteFood }}>
      {children}
    </FoodsContext.Provider>
  )
}

export function useFoodsContext() {
  return useContext(FoodsContext)
}
