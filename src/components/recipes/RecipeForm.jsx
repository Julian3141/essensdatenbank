import { useState, useMemo } from 'react'
import { Input, Textarea, Select } from '../ui/Input'
import Button from '../ui/Button'
import { NutrientGrid } from '../ui/NutrientBadge'
import { calculateNutrients, sumNutrients, NUTRIENT_FIELDS } from '../../lib/nutrients'
import { Plus, Trash2, Search } from 'lucide-react'

const SUGGESTED_TAGS = ['High Protein', 'Low Carb', 'Vegan', 'Vegetarisch', 'Frühstück', 'Mittagessen', 'Abendessen', 'Snack', 'Meal Prep', 'Schnell']

export default function RecipeForm({ initial = null, foods, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [instructions, setInstructions] = useState(initial?.instructions || '')
  const [servings, setServings] = useState(initial?.servings || 1)
  const [tags, setTags] = useState(initial?.tags || [])
  const [ingredients, setIngredients] = useState(
    initial?.recipe_ingredients?.map(i => ({
      food_id: i.food_id,
      amount_grams: i.amount_grams,
      food: i.foods,
    })) || []
  )
  const [foodSearch, setFoodSearch] = useState('')
  const [selectedFoodId, setSelectedFoodId] = useState('')
  const [amount, setAmount] = useState(100)
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const filteredFoods = useMemo(() => {
    const search = foodSearch.toLowerCase()
    return foods
      .filter(f =>
        f.name.toLowerCase().includes(search) &&
        !ingredients.some(i => i.food_id === f.id)
      )
      .sort((a, b) => {
        const aName = a.name.toLowerCase()
        const bName = b.name.toLowerCase()
        const aStarts = aName.startsWith(search)
        const bStarts = bName.startsWith(search)
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        return aName.localeCompare(bName, 'de')
      })
      .slice(0, 20)
  }, [foods, foodSearch, ingredients])

  const totalNutrients = useMemo(() => {
    const parts = ingredients.map(i => {
      if (!i.food?.nutrients) return {}
      return calculateNutrients(i.food.nutrients, parseFloat(i.amount_grams) || 0)
    })
    return sumNutrients(parts)
  }, [ingredients])

  const perServingNutrients = useMemo(() => {
    const s = parseInt(servings) || 1
    const result = {}
    for (const [k, v] of Object.entries(totalNutrients)) {
      result[k] = v / s
    }
    return result
  }, [totalNutrients, servings])

  function addIngredient() {
    const food = foods.find(f => f.id === selectedFoodId)
    if (!food || !amount) return
    setIngredients(prev => [...prev, { food_id: food.id, amount_grams: parseFloat(amount), food }])
    setSelectedFoodId('')
    setFoodSearch('')
    setAmount(100)
  }

  function removeIngredient(idx) {
    setIngredients(prev => prev.filter((_, i) => i !== idx))
  }

  function updateAmount(idx, val) {
    setIngredients(prev => prev.map((item, i) => i === idx ? { ...item, amount_grams: val } : item))
  }

  function toggleTag(tag) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function addCustomTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!name.trim()) errs.name = 'Bitte einen Namen eingeben.'
    if (parseInt(servings) < 1) errs.servings = 'Mindestens 1 Portion.'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitting(true)
    try {
      await onSubmit(
        { name: name.trim(), description, instructions, servings: parseInt(servings), tags },
        ingredients.map(i => ({ food_id: i.food_id, amount_grams: parseFloat(i.amount_grams) }))
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Input
            label="Rezeptname *"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="z.B. Porridge mit Banane"
            error={errors.name}
            autoFocus
          />
        </div>
        <Input
          label="Portionen"
          type="number"
          min="1"
          value={servings}
          onChange={e => setServings(e.target.value)}
          error={errors.servings}
        />
        <div className="col-span-2">
          <Textarea
            label="Kurzbeschreibung"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Kurze Beschreibung des Rezepts..."
            rows={2}
          />
        </div>
      </div>

      {/* Zutaten */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Zutaten</p>
        {ingredients.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="flex-1 text-sm text-gray-700">{ing.food?.name}</span>
                <input
                  type="number"
                  min="1"
                  value={ing.amount_grams}
                  onChange={e => updateAmount(idx, e.target.value)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                />
                <span className="text-xs text-gray-500">g</span>
                <button type="button" onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">Zutat hinzufügen</p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={foodSearch}
                onChange={e => { setFoodSearch(e.target.value); setSelectedFoodId('') }}
                placeholder="Lebensmittel suchen..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />
              {foodSearch && filteredFoods.length > 0 && !selectedFoodId && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto mt-1">
                  {filteredFoods.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 hover:text-primary-700"
                      onClick={() => { setSelectedFoodId(f.id); setFoodSearch(f.name) }}
                    >
                      <span>{f.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{f.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center"
              placeholder="g"
            />
            <span className="flex items-center text-sm text-gray-500">g</span>
            <Button type="button" onClick={addIngredient} disabled={!selectedFoodId} icon={Plus} size="md">
              Hinzufügen
            </Button>
          </div>
        </div>
      </div>

      {/* Live Nährwerte */}
      {ingredients.length > 0 && (
        <div className="bg-primary-50 rounded-xl p-4">
          <p className="text-sm font-medium text-primary-800 mb-2">
            Nährwerte pro Portion ({servings} {parseInt(servings) === 1 ? 'Portion' : 'Portionen'})
          </p>
          <NutrientGrid nutrients={perServingNutrients} compact />
          {parseInt(servings) > 1 && (
            <p className="text-xs text-primary-600 mt-2">
              Gesamt: {Object.entries(totalNutrients).map(([k, v]) => {
                const f = NUTRIENT_FIELDS.find(f => f.key === k)
                if (!f) return null
                return `${f.label}: ${k === 'calories' ? Math.round(v) + ' kcal' : v.toFixed(1) + ' g'}`
              }).filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      )}

      {/* Tags */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Tags</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {SUGGESTED_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                tags.includes(tag)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Eigenen Tag eingeben..."
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
          />
          <Button type="button" variant="secondary" onClick={addCustomTag} size="md">+ Tag</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map(t => (
              <span key={t} className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                {t}
                <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Zubereitungsanleitung */}
      <Textarea
        label="Zubereitungsanleitung"
        value={instructions}
        onChange={e => setInstructions(e.target.value)}
        placeholder="Schritt-für-Schritt Anleitung..."
        rows={4}
      />

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Speichern...' : (initial ? 'Änderungen speichern' : 'Rezept anlegen')}
        </Button>
      </div>
    </form>
  )
}
