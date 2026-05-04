import { useState, useMemo } from 'react'
import { useMealPlan } from '../hooks/useMealPlan'
import { usePersons } from '../hooks/usePersons'
import { ShoppingCart, Check, RefreshCw, ChevronDown, ChevronUp, Copy, CheckCheck } from 'lucide-react'
import Button from '../components/ui/Button'
import { FOOD_CATEGORIES } from '../lib/nutrients'

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function ShoppingPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const { entries, loading } = useMealPlan(weekStart)
  const { persons } = usePersons()
  const [checkedItems, setCheckedItems] = useState(new Set())
  const [selectedPersonIds, setSelectedPersonIds] = useState([])
  const [collapsedCategories, setCollapsedCategories] = useState(new Set())

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  const activePersonIds = useMemo(() => {
    if (selectedPersonIds.length === 0) return persons.map(p => p.id)
    return selectedPersonIds
  }, [selectedPersonIds, persons])

  const shoppingList = useMemo(() => {
    const aggregated = {}

    const filteredEntries = entries.filter(e => activePersonIds.includes(e.person_id))

    filteredEntries.forEach(entry => {
      const recipe = entry.recipes
      if (!recipe?.recipe_ingredients) return
      const entryServings = parseFloat(entry.servings) || 1
      const recipeServings = recipe.servings || 1
      const factor = entryServings / recipeServings

      recipe.recipe_ingredients.forEach(ing => {
        const food = ing.foods
        if (!food) return
        const key = food.id
        const amount = (parseFloat(ing.amount_grams) || 0) * factor

        if (aggregated[key]) {
          aggregated[key].totalGrams += amount
          aggregated[key].sources.push({ recipe: recipe.name, amount })
        } else {
          aggregated[key] = {
            foodId: food.id,
            foodName: food.name,
            category: food.category || 'Sonstiges',
            totalGrams: amount,
            sources: [{ recipe: recipe.name, amount }],
          }
        }
      })
    })

    return Object.values(aggregated).sort((a, b) => a.foodName.localeCompare(b.foodName))
  }, [entries, activePersonIds])

  const grouped = useMemo(() => {
    const groups = {}
    shoppingList.forEach(item => {
      const cat = item.category || 'Sonstiges'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    })
    const ordered = FOOD_CATEGORIES.filter(c => groups[c]).map(c => ({ category: c, items: groups[c] }))
    Object.keys(groups).filter(c => !FOOD_CATEGORIES.includes(c)).forEach(c => {
      ordered.push({ category: c, items: groups[c] })
    })
    return ordered
  }, [shoppingList])

  function toggleItem(id) {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleCategory(cat) {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function togglePerson(id) {
    setSelectedPersonIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
    setCheckedItems(new Set())
  }

  const uncheckedCount = shoppingList.filter(i => !checkedItems.has(i.foodId)).length
  const [copied, setCopied] = useState(false)

  function copyToClipboard() {
    const weekLabel = `Einkaufsliste ${weekStart.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} – ${weekDays[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}`
    const lines = [weekLabel, '']
    grouped.forEach(({ category, items }) => {
      lines.push(`📦 ${category}`)
      items.forEach(item => {
        const checked = checkedItems.has(item.foodId)
        const amount = item.totalGrams >= 1000
          ? `${(item.totalGrams / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`
          : `${Math.round(item.totalGrams)} g`
        lines.push(`${checked ? '✅' : '-'} ${item.foodName} – ${amount}`)
      })
      lines.push('')
    })
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header – mobil-freundlich: Titel oben, Buttons darunter */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Einkaufsliste</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {weekStart.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} –{' '}
              {weekDays[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {shoppingList.length > 0 && (
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'
              }`}
            >
              {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
              <span className="hidden sm:inline">{copied ? 'Kopiert!' : 'Als Text kopieren'}</span>
              <span className="sm:hidden">{copied ? '✓' : 'Kopieren'}</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); setCheckedItems(new Set()) }}
            className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 text-center"
          >← Zurück</button>
          <button
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 text-center"
          >Diese Woche</button>
          <button
            onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); setCheckedItems(new Set()) }}
            className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 text-center"
          >Vor →</button>
        </div>
      </div>

      {/* Personen-Filter */}
      {persons.length > 1 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-gray-500">Für:</span>
          {persons.map(p => (
            <button
              key={p.id}
              onClick={() => togglePerson(p.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activePersonIds.includes(p.id) && selectedPersonIds.length > 0
                  ? 'text-white shadow-sm'
                  : selectedPersonIds.length === 0
                  ? 'text-white opacity-80'
                  : 'bg-white border border-gray-200 text-gray-500'
              }`}
              style={
                (activePersonIds.includes(p.id) && selectedPersonIds.length > 0) || selectedPersonIds.length === 0
                  ? { backgroundColor: p.color }
                  : {}
              }
            >
              {p.name}
            </button>
          ))}
          {selectedPersonIds.length > 0 && (
            <button
              onClick={() => setSelectedPersonIds([])}
              className="px-3 py-1 rounded-full text-xs text-gray-400 border border-gray-200 hover:bg-gray-50"
            >
              Alle zeigen
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Lade Einkaufsliste...</div>
      ) : shoppingList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-2">Keine Zutaten für diese Woche.</p>
          <p className="text-sm text-gray-400">Füge im Wochenplaner Rezepte hinzu, um eine Einkaufsliste zu generieren.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{uncheckedCount}</span> von{' '}
              <span className="font-semibold">{shoppingList.length}</span> Artikeln noch einzukaufen
            </p>
            {checkedItems.size > 0 && (
              <button
                onClick={() => setCheckedItems(new Set())}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                <RefreshCw size={12} /> Zurücksetzen
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {grouped.map(({ category, items }) => {
              const collapsed = collapsedCategories.has(category)
              const allChecked = items.every(i => checkedItems.has(i.foodId))
              const someChecked = items.some(i => checkedItems.has(i.foodId))
              return (
                <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 text-sm">{category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${allChecked ? 'bg-green-100 text-green-600' : someChecked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                        {items.filter(i => checkedItems.has(i.foodId)).length}/{items.length}
                      </span>
                    </div>
                    {collapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
                  </button>

                  {!collapsed && (
                    <div className="divide-y divide-gray-50">
                      {items.map(item => {
                        const checked = checkedItems.has(item.foodId)
                        return (
                          <div
                            key={item.foodId}
                            onClick={() => toggleItem(item.foodId)}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${checked ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                              {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm font-medium ${checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                {item.foodName}
                              </span>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {item.sources.map(s => s.recipe).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                              </div>
                            </div>
                            <span className={`text-sm font-semibold ${checked ? 'text-gray-300' : 'text-gray-600'}`}>
                              {item.totalGrams >= 1000
                                ? `${(item.totalGrams / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`
                                : `${Math.round(item.totalGrams)} g`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {checkedItems.size === shoppingList.length && shoppingList.length > 0 && (
            <div className="mt-6 text-center bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-green-700 font-semibold">Alle Artikel eingekauft!</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
