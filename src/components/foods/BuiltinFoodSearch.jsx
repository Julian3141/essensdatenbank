import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { BUILTIN_FOODS } from '../../lib/builtinFoods'
import { FOOD_CATEGORIES } from '../../lib/nutrients'

export default function BuiltinFoodSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return BUILTIN_FOODS.filter(f => {
      const matchName = !q || f.name.toLowerCase().includes(q)
      const matchCat = !filterCat || f.category === filterCat
      return matchName && matchCat
    })
  }, [query, filterCat])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="z.B. Haferflocken, Tofu, Lachs..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Alle</option>
          {FOOD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1 max-h-96 overflow-y-auto">
        {results.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">Kein Lebensmittel gefunden.</p>
        )}
        {results.map((food, i) => {
          const n = food.nutrients
          return (
            <button
              key={i}
              onClick={() => onSelect(food)}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary-50 text-left transition-colors border border-transparent hover:border-primary-100"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">{food.name}</div>
                <div className="text-xs text-gray-400">{food.category}</div>
                <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-2">
                  {n.calories != null && <span>{Math.round(n.calories)} kcal</span>}
                  {n.protein != null && <span>{n.protein}g Eiweiß</span>}
                  {n.carbs != null && <span>{n.carbs}g KH</span>}
                  {n.fat != null && <span>{n.fat}g Fett</span>}
                  <span className="text-gray-300">/ 100g</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 text-center pt-1 border-t border-gray-100">
        {BUILTIN_FOODS.length} Lebensmittel · Werte pro 100g · Quelle: BLS / USDA
      </p>
    </div>
  )
}
