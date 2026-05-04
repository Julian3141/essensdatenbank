import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRecipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRecipes = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          id,
          amount_grams,
          food_id,
          foods (id, name, nutrients, category)
        )
      `)
      .order('name')
    if (error) {
      setError('Rezepte konnten nicht geladen werden.')
    } else {
      setRecipes(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchRecipes() }, [fetchRecipes])

  const createRecipe = useCallback(async (recipe, ingredients) => {
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert([recipe])
      .select()
      .single()
    if (recipeError) throw new Error('Rezept konnte nicht gespeichert werden.')

    if (ingredients.length > 0) {
      const { error: ingError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredients.map(i => ({ ...i, recipe_id: recipeData.id })))
      if (ingError) throw new Error('Zutaten konnten nicht gespeichert werden.')
    }

    await fetchRecipes()
    return recipeData
  }, [fetchRecipes])

  const updateRecipe = useCallback(async (id, recipe, ingredients) => {
    const { error: recipeError } = await supabase
      .from('recipes')
      .update({ ...recipe, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (recipeError) throw new Error('Rezept konnte nicht aktualisiert werden.')

    await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)

    if (ingredients.length > 0) {
      const { error: ingError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredients.map(i => ({ food_id: i.food_id, amount_grams: i.amount_grams, recipe_id: id })))
      if (ingError) throw new Error('Zutaten konnten nicht aktualisiert werden.')
    }

    await fetchRecipes()
  }, [fetchRecipes])

  const deleteRecipe = useCallback(async (id) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) throw new Error('Rezept konnte nicht gelöscht werden.')
    setRecipes(prev => prev.filter(r => r.id !== id))
  }, [])

  return { recipes, loading, error, refetch: fetchRecipes, createRecipe, updateRecipe, deleteRecipe }
}
