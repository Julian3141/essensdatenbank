import { useState, useMemo } from 'react'
import { useMealPlan } from '../hooks/useMealPlan'
import { useRecipes } from '../hooks/useRecipes'
import { useToast } from '../components/ui/Toast'
import { useNutrientSettings } from '../hooks/useNutrientSettings'
import { useActivePerson } from '../context/PersonContext'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import { NutrientGrid } from '../components/ui/NutrientBadge'
import CircleProgress from '../components/ui/CircleProgress'
import { calculateNutrients, sumNutrients, MEAL_TYPES, NUTRIENT_FIELDS } from '../lib/nutrients'
import { ChevronLeft, ChevronRight, Plus, X, Search, Settings, Target } from 'lucide-react'

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateShort(date) {
  return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' })
}

function formatDateLong(date) {
  return date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function computeEntryNutrients(entry) {
  const recipe = entry.recipes
  if (!recipe?.recipe_ingredients?.length) return {}
  const parts = recipe.recipe_ingredients.map(i => {
    if (!i.foods?.nutrients) return {}
    return calculateNutrients(i.foods.nutrients, parseFloat(i.amount_grams) || 0)
  })
  const total = sumNutrients(parts)
  const recipeServings = recipe.servings || 1
  const entryServings = parseFloat(entry.servings) || 1
  const result = {}
  for (const [k, v] of Object.entries(total)) {
    result[k] = (v / recipeServings) * entryServings
  }
  return result
}

export default function PlannerPage() {
  const { activePerson, updateGoals } = useActivePerson()
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const { entries, loading, addEntry, removeEntry } = useMealPlan(weekStart, activePerson?.id)
  const { recipes } = useRecipes()
  const { addToast } = useToast()

  const [addModal, setAddModal] = useState(null)
  const [showNutrientSettings, setShowNutrientSettings] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [dayDetailDate, setDayDetailDate] = useState(null)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [selectedServings, setSelectedServings] = useState(1)
  const { visibleNutrients, toggle: toggleNutrient, reset: resetNutrients } = useNutrientSettings()

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  function getEntriesFor(date, mealType) {
    const dateStr = date.toISOString().split('T')[0]
    return entries.filter(e => e.date === dateStr && e.meal_type === mealType)
  }

  function getDayNutrients(date) {
    const dateStr = date.toISOString().split('T')[0]
    return sumNutrients(entries.filter(e => e.date === dateStr).map(computeEntryNutrients))
  }

  function getWeekNutrients() {
    return sumNutrients(entries.map(computeEntryNutrients))
  }

  async function handleAddRecipe(recipe) {
    try {
      await addEntry({
        person_id: activePerson.id,
        recipe_id: recipe.id,
        date: addModal.date,
        meal_type: addModal.mealType,
        servings: selectedServings,
      })
      addToast(`"${recipe.name}" wurde hinzugefügt.`, 'success')
      setAddModal(null)
      setRecipeSearch('')
      setSelectedServings(1)
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  async function handleRemoveEntry(id) {
    try {
      await removeEntry(id)
      addToast('Eintrag entfernt.', 'success')
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  const filteredRecipes = recipes.filter(r =>
    r.name.toLowerCase().includes(recipeSearch.toLowerCase())
  )

  const goals = activePerson?.nutrient_goals || {}

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Wochenplan</h1>
          <p className="text-gray-500 text-sm mt-1">
            {weekStart.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} –{' '}
            {weekDays[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowGoals(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Target size={15} /> Ziele
          </button>
          <button
            onClick={() => setShowNutrientSettings(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Settings size={15} /> Anzeige
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
            >
              <ChevronLeft size={16} /> Zurück
            </button>
            <button
              onClick={() => setWeekStart(getWeekStart(new Date()))}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
            >
              Heute
            </button>
            <button
              onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
            >
              Vor <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Lade Wochenplan...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Day headers */}
              <div className="grid grid-cols-8 gap-1.5 mb-2">
                <div className="text-xs text-gray-400 font-medium pt-2 px-1">Mahlzeit</div>
                {weekDays.map((day, i) => {
                  const isToday = day.toDateString() === new Date().toDateString()
                  return (
                    <div key={i} className={`text-center py-2 rounded-lg text-xs font-semibold ${isToday ? 'bg-primary-100 text-primary-700' : 'text-gray-500'}`}>
                      {formatDateShort(day)}
                    </div>
                  )
                })}
              </div>

              {/* Meal rows */}
              {MEAL_TYPES.map(mealType => (
                <div key={mealType.key} className="grid grid-cols-8 gap-1.5 mb-1.5">
                  <div className="flex flex-col justify-center px-1 py-2">
                    <span className="text-base">{mealType.icon}</span>
                    <span className="text-xs text-gray-500 font-medium leading-tight">{mealType.label}</span>
                  </div>
                  {weekDays.map((day, i) => {
                    const cellEntries = getEntriesFor(day, mealType.key)
                    const dateStr = day.toISOString().split('T')[0]
                    return (
                      <div key={i} className="bg-white border border-gray-200 rounded-lg min-h-[72px] p-1.5 flex flex-col gap-1">
                        {cellEntries.map(entry => (
                          <div key={entry.id} className="group relative bg-primary-50 border border-primary-100 rounded p-1.5">
                            <div className="pr-4 text-xs font-medium text-primary-800 truncate leading-tight">{entry.recipes?.name}</div>
                            <div className="text-[10px] text-primary-500">{entry.servings}× Portion</div>
                            <button
                              onClick={() => handleRemoveEntry(entry.id)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setAddModal({ date: dateStr, mealType: mealType.key })}
                          className="mt-auto text-gray-300 hover:text-primary-400 hover:bg-primary-50 rounded p-1 transition-colors flex items-center justify-center"
                          title="Rezept hinzufügen"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}

              {/* Daily summary row */}
              <div className="grid grid-cols-8 gap-1.5 mt-3 pt-3 border-t border-gray-100">
                <div className="flex flex-col justify-center text-xs text-gray-400 font-medium py-1 px-1 leading-tight">
                  Tages&shy;gesamt
                </div>
                {weekDays.map((day, i) => {
                  const n = getDayNutrients(day)
                  const hasData = n.calories && n.calories > 0
                  const goalsWithData = visibleNutrients.filter(k => goals[k] > 0)
                  const showCircles = goalsWithData.length > 0 && hasData

                  return (
                    <button
                      key={i}
                      onClick={() => setDayDetailDate(day)}
                      className="rounded-lg p-1.5 bg-gray-50 hover:bg-primary-50 hover:ring-1 hover:ring-primary-200 transition-all text-left cursor-pointer"
                      title={`${formatDateLong(day)} – Details anzeigen`}
                    >
                      {showCircles ? (
                        <div className="flex flex-col gap-0.5">
                          {goalsWithData.slice(0, 3).map(key => {
                            const field = NUTRIENT_FIELDS.find(f => f.key === key)
                            if (!field) return null
                            const val = n[key] || 0
                            const pct = Math.min(100, Math.round((val / goals[key]) * 100))
                            const isOver = val > goals[key]
                            return (
                              <div key={key} className="flex flex-col gap-0.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] text-gray-500 truncate leading-none">{field.label}</span>
                                  <span className={`text-[9px] font-medium leading-none ${isOver ? 'text-red-500' : 'text-gray-600'}`}>
                                    {field.unit === 'kcal' ? Math.round(val) : val.toFixed(0)}
                                  </span>
                                </div>
                                <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: isOver ? '#ef4444' : (activePerson?.color || '#22c55e'),
                                    }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                          {goalsWithData.length > 3 && (
                            <span className="text-[9px] text-gray-400 text-center">+{goalsWithData.length - 3} mehr</span>
                          )}
                        </div>
                      ) : hasData ? (
                        <div className="flex flex-col gap-0.5">
                          {visibleNutrients.slice(0, 3).map(key => {
                            const field = NUTRIENT_FIELDS.find(f => f.key === key)
                            if (!field || !n[key]) return null
                            const val = field.unit === 'kcal' ? Math.round(n[key]) : n[key].toFixed(0)
                            return (
                              <div key={key} className="flex justify-between items-center gap-1">
                                <span className="text-[9px] text-gray-400 truncate leading-tight">{field.label}</span>
                                <span className="text-[9px] font-medium text-gray-600 whitespace-nowrap">{val} {field.unit}</span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-300 text-center py-1">–</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Weekly summary */}
          {entries.length > 0 && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Wochensumme Nährwerte</p>
              {(() => {
                const weekN = getWeekNutrients()
                const goalsWithData = visibleNutrients.filter(k => goals[k] > 0)
                if (goalsWithData.length > 0) {
                  return (
                    <div className="flex flex-wrap gap-4 justify-center">
                      {goalsWithData.map(key => {
                        const field = NUTRIENT_FIELDS.find(f => f.key === key)
                        if (!field) return null
                        return (
                          <CircleProgress
                            key={key}
                            value={weekN[key] || 0}
                            goal={goals[key] * 7}
                            label={field.label}
                            unit={field.unit}
                            color={activePerson?.color || '#22c55e'}
                            size={72}
                          />
                        )
                      })}
                    </div>
                  )
                }
                return <NutrientGrid nutrients={weekN} visibleKeys={visibleNutrients} />
              })()}
            </div>
          )}
        </>
      )}

      {/* Rezept hinzufügen */}
      <Modal
        isOpen={!!addModal}
        onClose={() => { setAddModal(null); setRecipeSearch(''); setSelectedServings(1) }}
        title={addModal ? `${MEAL_TYPES.find(m => m.key === addModal.mealType)?.icon} ${MEAL_TYPES.find(m => m.key === addModal.mealType)?.label} – Rezept wählen` : ''}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={recipeSearch}
              onChange={e => setRecipeSearch(e.target.value)}
              placeholder="Rezept suchen..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 whitespace-nowrap">Portionen:</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={selectedServings}
              onChange={e => setSelectedServings(parseFloat(e.target.value) || 1)}
              className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center"
            />
          </div>
          {recipes.length === 0 ? (
            <p className="text-center text-gray-500 py-6">Noch keine Rezepte vorhanden. Bitte zuerst Rezepte anlegen.</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
              {filteredRecipes.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleAddRecipe(r)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-50 text-left transition-colors border border-transparent hover:border-primary-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{r.name}</div>
                    <div className="text-xs text-gray-500">
                      {r.servings} {r.servings !== 1 ? 'Portionen' : 'Portion'}
                      {r.tags?.length > 0 && ` · ${r.tags.slice(0, 2).join(', ')}`}
                    </div>
                  </div>
                  <Plus size={16} className="text-primary-500 shrink-0" />
                </button>
              ))}
              {filteredRecipes.length === 0 && (
                <p className="text-center text-gray-500 py-4">Kein Rezept gefunden.</p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Tag-Detail */}
      <Modal
        isOpen={!!dayDetailDate}
        onClose={() => setDayDetailDate(null)}
        title={dayDetailDate ? formatDateLong(dayDetailDate) : ''}
        size="md"
      >
        {dayDetailDate && (
          <DayDetail
            nutrients={getDayNutrients(dayDetailDate)}
            goals={goals}
            visibleNutrients={visibleNutrients}
            personColor={activePerson?.color || '#22c55e'}
            onOpenGoals={() => { setDayDetailDate(null); setShowGoals(true) }}
            onOpenSettings={() => { setDayDetailDate(null); setShowNutrientSettings(true) }}
          />
        )}
      </Modal>

      {/* Tagesziele */}
      <Modal isOpen={showGoals} onClose={() => setShowGoals(false)} title={`Ziele – ${activePerson?.name || ''}`} size="md">
        {activePerson && (
          <GoalsEditor
            person={activePerson}
            onSave={async (goals) => {
              try {
                await updateGoals(activePerson.id, goals)
                addToast('Ziele gespeichert.', 'success')
                setShowGoals(false)
              } catch (e) {
                addToast(e.message, 'error')
              }
            }}
            onCancel={() => setShowGoals(false)}
          />
        )}
      </Modal>

      {/* Nährwert-Einstellungen */}
      <Modal isOpen={showNutrientSettings} onClose={() => setShowNutrientSettings(false)} title="Angezeigte Nährwerte" size="sm">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500">Wähle welche Nährwerte in der Tages- und Wochenübersicht angezeigt werden.</p>
          <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
            {NUTRIENT_FIELDS.map(field => (
              <label key={field.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleNutrients.includes(field.key)}
                  onChange={() => toggleNutrient(field.key)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm text-gray-700">{field.label}</span>
                <span className="text-xs text-gray-400 ml-auto">{field.unit}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <button onClick={resetNutrients} className="text-sm text-gray-400 hover:text-gray-600">Zurücksetzen</button>
            <Button onClick={() => setShowNutrientSettings(false)}>Fertig</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function DayDetail({ nutrients, goals, visibleNutrients, personColor, onOpenGoals, onOpenSettings }) {
  const hasData = nutrients.calories && nutrients.calories > 0
  const displayKeys = visibleNutrients.filter(k => nutrients[k] > 0 || goals[k] > 0)

  return (
    <div className="flex flex-col gap-4">
      {!hasData ? (
        <p className="text-center text-gray-400 py-4">Keine Mahlzeiten an diesem Tag.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {displayKeys.map(key => {
            const field = NUTRIENT_FIELDS.find(f => f.key === key)
            if (!field) return null
            const val = nutrients[key] || 0
            const goal = goals[key] || 0
            const pct = goal > 0 ? Math.min(100, (val / goal) * 100) : 0
            const isOver = goal > 0 && val > goal
            const formatted = field.unit === 'kcal'
              ? `${Math.round(val)} kcal`
              : field.unit === 'mg' ? `${val.toFixed(1)} mg`
              : field.unit === 'µg' ? `${val.toFixed(1)} µg`
              : `${val.toFixed(1)} g`

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm text-gray-700">{field.label}</span>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className={`font-medium ${isOver ? 'text-red-600' : 'text-gray-800'}`}>{formatted}</span>
                    {goal > 0 && (
                      <span className="text-gray-400 text-xs">
                        / {field.unit === 'kcal' ? `${Math.round(goal)} kcal` : `${goal % 1 === 0 ? goal : goal.toFixed(1)} ${field.unit}`}
                      </span>
                    )}
                  </div>
                </div>
                {goal > 0 && (
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isOver ? '#ef4444' : personColor,
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
          {displayKeys.length === 0 && (
            <p className="text-sm text-gray-400 text-center">Keine konfigurierten Nährwerte vorhanden.</p>
          )}
        </div>
      )}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onOpenGoals}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Target size={14} /> Ziele anpassen
        </button>
        <button
          onClick={onOpenSettings}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Settings size={14} /> Anzeige anpassen
        </button>
      </div>
    </div>
  )
}

const GOAL_GROUPS = [
  { label: 'Grundnährwerte', keys: ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar'] },
  { label: 'Fettsäuren',     keys: ['sat_fat', 'omega3', 'omega6'] },
  { label: 'Mineralstoffe',  keys: ['sodium', 'calcium', 'magnesium', 'iron', 'zinc', 'potassium'] },
  { label: 'Vitamine',       keys: ['vit_c', 'vit_d', 'vit_b12', 'vit_a', 'vit_e', 'folate'] },
]

function GoalsEditor({ person, onSave, onCancel }) {
  // Store daily goals as strings for easy editing
  const [daily, setDaily] = useState(() => {
    const g = person.nutrient_goals || {}
    const result = {}
    for (const f of NUTRIENT_FIELDS) result[f.key] = g[f.key] != null ? String(g[f.key]) : ''
    return result
  })
  const [saving, setSaving] = useState(false)
  const [openGroup, setOpenGroup] = useState('Grundnährwerte')

  function setDailyVal(key, val) {
    setDaily(prev => ({ ...prev, [key]: val }))
  }

  function setWeeklyVal(key, val) {
    const n = parseFloat(val)
    if (!isNaN(n) && n > 0) {
      setDaily(prev => ({ ...prev, [key]: String(+(n / 7).toFixed(4)) }))
    } else {
      setDaily(prev => ({ ...prev, [key]: '' }))
    }
  }

  function weeklyDisplay(key) {
    const n = parseFloat(daily[key])
    if (!isNaN(n) && n > 0) {
      const w = n * 7
      return w % 1 === 0 ? String(w) : w.toFixed(1)
    }
    return ''
  }

  async function handleSave() {
    setSaving(true)
    const cleaned = {}
    for (const [k, v] of Object.entries(daily)) {
      const n = parseFloat(v)
      if (!isNaN(n) && n > 0) cleaned[k] = n
    }
    await onSave(cleaned)
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        Tagesziel eingeben → Wochenziel wird automatisch berechnet (×7), und umgekehrt.
      </p>

      <div className="flex flex-col gap-2">
        {GOAL_GROUPS.map(group => {
          const fields = group.keys.map(k => NUTRIENT_FIELDS.find(f => f.key === k)).filter(Boolean)
          const isOpen = openGroup === group.label
          const filledCount = fields.filter(f => parseFloat(daily[f.key]) > 0).length
          return (
            <div key={group.label} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : group.label)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{group.label}</span>
                <div className="flex items-center gap-2">
                  {filledCount > 0 && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{filledCount} Ziele</span>
                  )}
                  <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div className="p-3">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 gap-y-2.5 items-center">
                    <div />
                    <div className="text-xs font-medium text-gray-500 text-center w-24">Täglich</div>
                    <div className="text-xs font-medium text-gray-500 text-center w-24">Wöchentlich</div>

                    {fields.map(field => (
                      <>
                        <label key={`lbl-${field.key}`} className="text-xs text-gray-600 truncate">
                          {field.label} <span className="text-gray-400">({field.unit})</span>
                        </label>
                        <input
                          key={`d-${field.key}`}
                          type="number"
                          min="0"
                          step="any"
                          value={daily[field.key]}
                          placeholder="–"
                          onChange={e => setDailyVal(field.key, e.target.value)}
                          className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          key={`w-${field.key}`}
                          type="number"
                          min="0"
                          step="any"
                          value={weeklyDisplay(field.key)}
                          placeholder="–"
                          onChange={e => setWeeklyVal(field.key, e.target.value)}
                          className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancel}>Abbrechen</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Speichern...' : 'Ziele speichern'}
        </Button>
      </div>
    </div>
  )
}
