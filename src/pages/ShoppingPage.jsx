import { useState, useMemo, useEffect } from 'react'
import { useMealPlan } from '../hooks/useMealPlan'
import { useActivePerson } from '../context/PersonContext'
import { ShoppingCart, Check, RefreshCw, Copy, CheckCheck, Plus, X } from 'lucide-react'

const SHOPPING_SECTIONS = [
  'Gemüse & Obst',
  'Fleisch & Fisch',
  'Milch & Käse',
  'Brot & Getreide',
  'Hülsenfrüchte & Tofu',
  'Tiefkühl',
  'Konserven & Saucen',
  'Nüsse, Öle & Aufstriche',
  'Getränke',
  'Drogerie',
  'Haushalt',
  'Sonstiges',
]

const FOOD_TO_SECTION = {
  'Gemüse':           'Gemüse & Obst',
  'Obst':             'Gemüse & Obst',
  'Fleisch & Fisch':  'Fleisch & Fisch',
  'Milchprodukte':    'Milch & Käse',
  'Getreide':         'Brot & Getreide',
  'Hülsenfrüchte':    'Hülsenfrüchte & Tofu',
  'Nüsse & Samen':    'Nüsse, Öle & Aufstriche',
  'Fette & Öle':      'Nüsse, Öle & Aufstriche',
  'Gewürze & Saucen': 'Konserven & Saucen',
  'Getränke':         'Getränke',
  'Sonstiges':        'Sonstiges',
}

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatGrams(g) {
  return g >= 1000
    ? `${(g / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`
    : `${Math.round(g)} g`
}

export default function ShoppingPage() {
  const { activePerson } = useActivePerson()
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const { entries, loading } = useMealPlan(weekStart, activePerson?.id)
  const [checkedItems, setCheckedItems] = useState(new Set())
  const [copied, setCopied] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemSection, setNewItemSection] = useState('Sonstiges')

  const storageKey = `shopping_custom_${activePerson?.id}_${weekStart?.toISOString().split('T')[0]}`

  const [customItems, setCustomItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || [] } catch { return [] }
  })

  useEffect(() => {
    try { setCustomItems(JSON.parse(localStorage.getItem(storageKey)) || []) } catch { setCustomItems([]) }
    setCheckedItems(new Set())
  }, [storageKey])

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d
  }), [weekStart])

  const recipeItems = useMemo(() => {
    const agg = {}
    entries.forEach(entry => {
      const recipe = entry.recipes
      if (!recipe?.recipe_ingredients) return
      const factor = (parseFloat(entry.servings) || 1) / (recipe.servings || 1)
      recipe.recipe_ingredients.forEach(ing => {
        const food = ing.foods
        if (!food) return
        const amount = (parseFloat(ing.amount_grams) || 0) * factor
        if (agg[food.id]) {
          agg[food.id].totalGrams += amount
          agg[food.id].sources.push(recipe.name)
        } else {
          agg[food.id] = {
            id: food.id,
            name: food.name,
            section: FOOD_TO_SECTION[food.category] || 'Sonstiges',
            totalGrams: amount,
            sources: [recipe.name],
            custom: false,
          }
        }
      })
    })
    return Object.values(agg)
  }, [entries])

  const grouped = useMemo(() => {
    const map = {}
    ;[...recipeItems, ...customItems].forEach(item => {
      const s = item.section || 'Sonstiges'
      if (!map[s]) map[s] = []
      map[s].push(item)
    })
    return SHOPPING_SECTIONS
      .filter(s => map[s])
      .map(s => ({ section: s, items: map[s].sort((a, b) => a.name.localeCompare(b.name)) }))
  }, [recipeItems, customItems])

  const allIds = useMemo(
    () => [...recipeItems.map(i => i.id), ...customItems.map(i => i.id)],
    [recipeItems, customItems]
  )
  const totalCount = allIds.length
  const uncheckedCount = allIds.filter(id => !checkedItems.has(id)).length
  const allChecked = totalCount > 0 && allIds.every(id => checkedItems.has(id))

  function saveCustom(items) {
    setCustomItems(items)
    localStorage.setItem(storageKey, JSON.stringify(items))
  }

  function addCustomItem() {
    const name = newItemName.trim()
    if (!name) return
    saveCustom([...customItems, { id: `custom_${Date.now()}`, name, section: newItemSection, custom: true }])
    setNewItemName('')
  }

  function removeCustomItem(id) {
    saveCustom(customItems.filter(i => i.id !== id))
    setCheckedItems(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  function toggleItem(id) {
    setCheckedItems(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function changeWeek(offset) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + offset)
    setWeekStart(d)
  }

  function copyToClipboard() {
    const label = `Einkaufsliste ${weekStart.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} – ${weekDays[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}`
    const lines = [label, '']
    grouped.forEach(({ section, items }) => {
      lines.push(`── ${section}`)
      items.forEach(item => {
        const done = checkedItems.has(item.id)
        const amt = item.custom ? '' : ` – ${formatGrams(item.totalGrams)}`
        lines.push(`${done ? '✅' : '○'} ${item.name}${amt}`)
      })
      lines.push('')
    })
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Einkaufsliste</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {weekStart.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} –{' '}
              {weekDays[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {totalCount > 0 && (
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                copied ? 'bg-green-600 text-white' : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'
              }`}
            >
              {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
              <span className="hidden sm:inline">{copied ? 'Kopiert!' : 'Als Text kopieren'}</span>
              <span className="sm:hidden">{copied ? '✓' : 'Kopieren'}</span>
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => changeWeek(-7)} className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 text-center">← Zurück</button>
          <button onClick={() => setWeekStart(getWeekStart(new Date()))} className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 text-center">Diese Woche</button>
          <button onClick={() => changeWeek(7)} className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 text-center">Vor →</button>
        </div>
      </div>

      {/* Eigene Artikel hinzufügen */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
        <div className="flex gap-2">
          <input
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomItem()}
            placeholder="Artikel hinzufügen… (z.B. Toilettenpapier)"
            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-0"
          />
          <button
            onClick={addCustomItem}
            disabled={!newItemName.trim()}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 transition-colors shrink-0"
          >
            <Plus size={18} />
          </button>
        </div>
        <select
          value={newItemSection}
          onChange={e => setNewItemSection(e.target.value)}
          className="mt-2 w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-600"
        >
          {SHOPPING_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Lade Einkaufsliste...</div>
      ) : totalCount === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-1">Noch keine Artikel.</p>
          <p className="text-sm text-gray-400">Füge Rezepte im Wochenplaner hinzu oder trag oben eigene Artikel ein.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{uncheckedCount}</span> von{' '}
              <span className="font-semibold">{totalCount}</span> Artikeln noch einzukaufen
            </p>
            {checkedItems.size > 0 && (
              <button onClick={() => setCheckedItems(new Set())} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                <RefreshCw size={12} /> Zurücksetzen
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {grouped.map(({ section, items }, gi) => (
              <div key={section}>
                {/* Dezente Kategorie-Trennlinie */}
                <div className={`flex items-center gap-3 px-4 py-2 ${gi > 0 ? 'border-t border-gray-100 mt-0.5' : ''}`}>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {section}
                  </span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                <div className="divide-y divide-gray-50">
                  {items.map(item => {
                    const checked = checkedItems.has(item.id)
                    const uniqueSources = item.sources
                      ? [...new Set(item.sources)].join(', ')
                      : null
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors select-none ${checked ? 'bg-gray-50/70' : 'hover:bg-gray-50'}`}
                        onClick={() => toggleItem(item.id)}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                          {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium transition-colors ${checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {item.name}
                          </span>
                          {uniqueSources && (
                            <div className="text-xs text-gray-400 leading-tight truncate">{uniqueSources}</div>
                          )}
                        </div>

                        {!item.custom && (
                          <span className={`text-sm font-semibold shrink-0 tabular-nums ${checked ? 'text-gray-300' : 'text-gray-500'}`}>
                            {formatGrams(item.totalGrams)}
                          </span>
                        )}

                        {item.custom && (
                          <button
                            onClick={e => { e.stopPropagation(); removeCustomItem(item.id) }}
                            className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {allChecked && (
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
