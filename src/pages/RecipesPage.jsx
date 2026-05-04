import { useState, useMemo, useEffect } from 'react'
import { useRecipes } from '../hooks/useRecipes'
import { useFoods } from '../hooks/useFoods'
import { useToast } from '../components/ui/Toast'
import { useActivePerson } from '../context/PersonContext'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import RecipeForm from '../components/recipes/RecipeForm'
import { NutrientGrid } from '../components/ui/NutrientBadge'
import { calculateNutrients, sumNutrients } from '../lib/nutrients'
import { Plus, Search, Edit2, Trash2, X, BookOpen, Star } from 'lucide-react'


function computeRecipeNutrients(recipe) {
  if (!recipe.recipe_ingredients?.length) return {}
  const parts = recipe.recipe_ingredients.map(i => {
    if (!i.foods?.nutrients) return {}
    return calculateNutrients(i.foods.nutrients, parseFloat(i.amount_grams) || 0)
  })
  const total = sumNutrients(parts)
  const s = recipe.servings || 1
  const result = {}
  for (const [k, v] of Object.entries(total)) result[k] = v / s
  return result
}

export default function RecipesPage() {
  const { recipes, loading, error, createRecipe, updateRecipe, deleteRecipe } = useRecipes()
  const { foods } = useFoods()
  const { addToast } = useToast()
  const { activePerson } = useActivePerson()

  const [showCreate, setShowCreate] = useState(false)
  const [editRecipe, setEditRecipe] = useState(null)
  const [viewRecipe, setViewRecipe] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterFoodIds, setFilterFoodIds] = useState([])
  const [foodFilterSearch, setFoodFilterSearch] = useState('')
  const [showFoodFilterDropdown, setShowFoodFilterDropdown] = useState(false)
  const [filterFavorites, setFilterFavorites] = useState(false)

  const favKey = `favorites_${activePerson?.id || 'guest'}`
  const [favorites, setFavorites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(favKey)) || []) } catch { return new Set() }
  })

  useEffect(() => {
    try { setFavorites(new Set(JSON.parse(localStorage.getItem(favKey)) || [])) } catch { setFavorites(new Set()) }
  }, [favKey])

  function toggleFavorite(recipeId, e) {
    e.stopPropagation()
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(recipeId) ? next.delete(recipeId) : next.add(recipeId)
      localStorage.setItem(favKey, JSON.stringify([...next]))
      return next
    })
  }

  const recipeNutrients = useMemo(() => {
    const map = {}
    recipes.forEach(r => { map[r.id] = computeRecipeNutrients(r) })
    return map
  }, [recipes])

  const allTags = useMemo(() => {
    const tags = new Set()
    recipes.forEach(r => r.tags?.forEach(t => tags.add(t)))
    return [...tags].sort()
  }, [recipes])

  const foodFilterOptions = useMemo(() =>
    foods.filter(f =>
      f.name.toLowerCase().includes(foodFilterSearch.toLowerCase()) &&
      !filterFoodIds.includes(f.id)
    ).slice(0, 8),
    [foods, foodFilterSearch, filterFoodIds]
  )

  function addFoodFilter(food) {
    setFilterFoodIds(prev => [...prev, food.id])
    setFoodFilterSearch('')
    setShowFoodFilterDropdown(false)
  }

  function removeFoodFilter(id) {
    setFilterFoodIds(prev => prev.filter(x => x !== id))
  }

  const filtered = useMemo(() => recipes.filter(r => {
    const matchName = r.name.toLowerCase().includes(search.toLowerCase())
    const matchTag = !filterTag || r.tags?.includes(filterTag)
    const matchFoods = filterFoodIds.length === 0 || filterFoodIds.every(fid =>
      r.recipe_ingredients?.some(i => i.food_id === fid)
    )
    const matchFav = !filterFavorites || favorites.has(r.id)
    return matchName && matchTag && matchFoods && matchFav
  }), [recipes, search, filterTag, filterFoodIds, filterFavorites, favorites])

  async function handleCreate(recipe, ingredients) {
    try {
      await createRecipe(recipe, ingredients)
      addToast('Rezept wurde angelegt.', 'success')
      setShowCreate(false)
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  async function handleUpdate(recipe, ingredients) {
    try {
      await updateRecipe(editRecipe.id, recipe, ingredients)
      addToast('Rezept wurde aktualisiert.', 'success')
      setEditRecipe(null)
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  async function handleDelete() {
    try {
      await deleteRecipe(deleteId)
      addToast('Rezept wurde gelöscht.', 'success')
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rezepte</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length !== recipes.length
              ? `${filtered.length} von ${recipes.length} Rezepten`
              : `${recipes.length} Rezepte`}
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreate(true)}>Neues Rezept</Button>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {/* Zeile 1: Suche + Tag-Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rezeptname suchen..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {allTags.length > 0 && (
            <select
              value={filterTag}
              onChange={e => setFilterTag(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Alle Tags</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {/* Zeile 2: Zutaten-Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {filterFoodIds.map(fid => {
            const food = foods.find(f => f.id === fid)
            return food ? (
              <span key={fid} className="flex items-center gap-1 bg-primary-100 text-primary-700 text-xs px-2.5 py-1 rounded-full font-medium">
                {food.name}
                <button onClick={() => removeFoodFilter(fid)} className="hover:text-primary-900">
                  <X size={12} />
                </button>
              </span>
            ) : null
          })}
          <div className="relative">
            <div className="flex items-center gap-1.5 border border-dashed border-gray-300 rounded-full px-3 py-1 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 cursor-text">
              <Search size={13} />
              <input
                value={foodFilterSearch}
                onChange={e => { setFoodFilterSearch(e.target.value); setShowFoodFilterDropdown(true) }}
                onFocus={() => setShowFoodFilterDropdown(true)}
                onBlur={() => setTimeout(() => setShowFoodFilterDropdown(false), 150)}
                placeholder="Zutat filtern..."
                className="outline-none bg-transparent w-32 text-sm"
              />
            </div>
            {showFoodFilterDropdown && foodFilterSearch && foodFilterOptions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-52">
                {foodFilterOptions.map(f => (
                  <button
                    key={f.id}
                    onMouseDown={() => addFoodFilter(f)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 hover:text-primary-700"
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {filterFoodIds.length > 0 && (
            <button onClick={() => setFilterFoodIds([])} className="text-xs text-gray-400 hover:text-gray-600">
              Filter löschen
            </button>
          )}
        </div>
        {filterFoodIds.length > 0 && (
          <p className="text-xs text-gray-500">
            Zeige Rezepte die <strong>alle</strong> markierten Zutaten enthalten.
          </p>
        )}

        {/* Zeile 3: Favoriten-Filter */}
        <div>
          <button
            onClick={() => setFilterFavorites(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filterFavorites
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600'
            }`}
          >
            <Star size={13} className={filterFavorites ? 'fill-amber-500 text-amber-500' : ''} />
            Favoriten
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Lade Rezepte...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search || filterTag || filterFoodIds.length > 0 || filterFavorites
            ? 'Keine Rezepte mit diesen Filterkriterien gefunden.'
            : 'Noch keine Rezepte angelegt. Klick auf "Neues Rezept" um zu starten.'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(recipe => {
            const nutrients = recipeNutrients[recipe.id] || {}
            const isFav = favorites.has(recipe.id)
            return (
              <div key={recipe.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary-300 transition-colors">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{recipe.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {recipe.servings} {recipe.servings === 1 ? 'Portion' : 'Portionen'}
                        {recipe.recipe_ingredients?.length > 0 && ` · ${recipe.recipe_ingredients.length} Zutaten`}
                      </p>
                      {recipe.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{recipe.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={e => toggleFavorite(recipe.id, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isFav
                            ? 'text-amber-500 hover:bg-amber-50'
                            : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50'
                        }`}
                        title={isFav ? 'Favorit entfernen' : 'Als Favorit markieren'}
                      >
                        <Star size={15} className={isFav ? 'fill-amber-500' : ''} />
                      </button>
                      <button
                        onClick={() => setViewRecipe(recipe)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                        title="Ansehen"
                      >
                        <BookOpen size={15} />
                      </button>
                      <button
                        onClick={() => setEditRecipe(recipe)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                        title="Bearbeiten"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(recipe.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Löschen"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {recipe.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recipe.tags.map(t => (
                        <span key={t} className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full text-xs">{t}</span>
                      ))}
                    </div>
                  )}

                  {Object.keys(nutrients).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-1.5">pro Portion</p>
                      <NutrientGrid nutrients={nutrients} compact />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Neues Rezept anlegen" size="xl">
        <RecipeForm foods={foods} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal isOpen={!!editRecipe} onClose={() => setEditRecipe(null)} title="Rezept bearbeiten" size="xl">
        {editRecipe && (
          <RecipeForm initial={editRecipe} foods={foods} onSubmit={handleUpdate} onCancel={() => setEditRecipe(null)} />
        )}
      </Modal>

      <Modal isOpen={!!viewRecipe} onClose={() => setViewRecipe(null)} title={viewRecipe?.name || ''} size="lg">
        {viewRecipe && <RecipeDetail recipe={viewRecipe} />}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Rezept löschen"
        message="Soll dieses Rezept wirklich gelöscht werden? Wochenplan-Einträge mit diesem Rezept werden ebenfalls entfernt."
      />
    </div>
  )
}

function RecipeDetail({ recipe }) {
  const nutrients = computeRecipeNutrients(recipe)
  const totalIngWeight = recipe.recipe_ingredients?.reduce((s, i) => s + parseFloat(i.amount_grams || 0), 0) || 0

  return (
    <div className="flex flex-col gap-4">
      {recipe.description && <p className="text-gray-600">{recipe.description}</p>}
      <div className="flex gap-3 text-sm text-gray-500">
        <span>{recipe.servings} {recipe.servings === 1 ? 'Portion' : 'Portionen'}</span>
        <span>·</span>
        <span>{recipe.recipe_ingredients?.length || 0} Zutaten</span>
        <span>·</span>
        <span>{totalIngWeight}g gesamt</span>
      </div>

      {recipe.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {recipe.tags.map(t => (
            <span key={t} className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full text-xs">{t}</span>
          ))}
        </div>
      )}

      {recipe.recipe_ingredients?.length > 0 && (
        <div>
          <p className="font-medium text-gray-700 mb-2">Zutaten</p>
          <div className="flex flex-col gap-1">
            {recipe.recipe_ingredients.map((ing, idx) => (
              <div key={idx} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{ing.foods?.name}</span>
                <span className="text-sm font-medium text-gray-600">{ing.amount_grams}g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(nutrients).length > 0 && (
        <div className="bg-primary-50 rounded-xl p-4">
          <p className="text-sm font-medium text-primary-800 mb-2">Nährwerte pro Portion</p>
          <NutrientGrid nutrients={nutrients} />
        </div>
      )}

      {recipe.instructions && (
        <div>
          <p className="font-medium text-gray-700 mb-2">Zubereitung</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{recipe.instructions}</p>
        </div>
      )}
    </div>
  )
}
