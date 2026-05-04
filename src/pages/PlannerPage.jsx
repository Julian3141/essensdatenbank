import { useState, useMemo } from 'react'
import { useMealPlan } from '../hooks/useMealPlan'
import { usePersons } from '../hooks/usePersons'
import { useRecipes } from '../hooks/useRecipes'
import { useToast } from '../components/ui/Toast'
import { useNutrientSettings } from '../hooks/useNutrientSettings'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { NutrientGrid } from '../components/ui/NutrientBadge'
import { calculateNutrients, sumNutrients, MEAL_TYPES, PERSON_COLORS, NUTRIENT_FIELDS } from '../lib/nutrients'
import { ChevronLeft, ChevronRight, Plus, X, Users, Edit2, Trash2, Search, Settings } from 'lucide-react'

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
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const { entries, loading, addEntry, removeEntry } = useMealPlan(weekStart)
  const { persons, createPerson, updatePerson, deletePerson } = usePersons()
  const { recipes } = useRecipes()
  const { addToast } = useToast()

  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [addModal, setAddModal] = useState(null)
  const [managePersons, setManagePersons] = useState(false)
  const [showNutrientSettings, setShowNutrientSettings] = useState(false)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [selectedServings, setSelectedServings] = useState(1)
  const { visibleNutrients, toggle: toggleNutrient, reset: resetNutrients } = useNutrientSettings()

  const currentPerson = persons.find(p => p.id === selectedPersonId) || persons[0]

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  const personEntries = useMemo(() =>
    entries.filter(e => e.person_id === currentPerson?.id),
    [entries, currentPerson]
  )

  function getEntriesFor(date, mealType) {
    const dateStr = date.toISOString().split('T')[0]
    return personEntries.filter(e => e.date === dateStr && e.meal_type === mealType)
  }

  function getDayNutrients(date) {
    const dateStr = date.toISOString().split('T')[0]
    const dayEntries = personEntries.filter(e => e.date === dateStr)
    return sumNutrients(dayEntries.map(computeEntryNutrients))
  }

  function getWeekNutrients() {
    return sumNutrients(personEntries.map(computeEntryNutrients))
  }

  async function handleAddRecipe(recipe) {
    try {
      await addEntry({
        person_id: currentPerson.id,
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Wochenplaner</h1>
          <p className="text-gray-500 text-sm mt-1">
            {weekStart.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} –{' '}
            {weekDays[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            Diese Woche
          </button>
          <button
            onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
          >
            Vor <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Personen */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {persons.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPersonId(p.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              currentPerson?.id === p.id
                ? 'shadow-md scale-105'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            style={currentPerson?.id === p.id ? { backgroundColor: p.color, color: 'white' } : {}}
          >
            {p.name}
          </button>
        ))}
        <button
          onClick={() => setManagePersons(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-gray-500 border border-dashed border-gray-300 hover:bg-gray-50 whitespace-nowrap"
        >
          <Users size={14} />
          Personen verwalten
        </button>
      </div>

      {persons.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">Noch keine Personen angelegt.</p>
          <Button onClick={() => setManagePersons(true)} icon={Plus}>Person hinzufügen</Button>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Lade Wochenplan...</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
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

                <div className="grid grid-cols-8 gap-1.5 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-400 font-medium py-1 px-1">Tagesges.</div>
                  {weekDays.map((day, i) => {
                    const n = getDayNutrients(day)
                    const hasData = n.calories && n.calories > 0
                    return (
                      <div key={i} className={`rounded-lg p-1.5 text-center ${hasData ? 'bg-orange-50' : 'bg-gray-50'}`}>
                        {hasData ? (
                          <>
                            {visibleNutrients.slice(0, 3).map(key => {
                              const field = NUTRIENT_FIELDS.find(f => f.key === key)
                              if (!field || n[key] == null) return null
                              const val = key === 'calories' ? `${Math.round(n[key])} kcal` : `${(n[key] || 0).toFixed(0)}${field.unit}`
                              return (
                                <div key={key} className="text-[10px] text-gray-600 truncate">{val}</div>
                              )
                            })}
                          </>
                        ) : (
                          <div className="text-[10px] text-gray-300 pt-1">–</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {personEntries.length > 0 && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">Wochensumme Nährwerte</p>
                <button
                  onClick={() => setShowNutrientSettings(true)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-600 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <Settings size={13} /> Anpassen
                </button>
              </div>
              <NutrientGrid nutrients={getWeekNutrients()} visibleKeys={visibleNutrients} />
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

      {/* Nährwert-Einstellungen */}
      <Modal isOpen={showNutrientSettings} onClose={() => setShowNutrientSettings(false)} title="Angezeigte Nährwerte einstellen" size="sm">
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

      {/* Personen verwalten */}
      <Modal isOpen={managePersons} onClose={() => setManagePersons(false)} title="Personen verwalten" size="sm">
        <PersonManager
          persons={persons}
          onCreate={async (data) => {
            try { await createPerson(data); addToast('Person angelegt.', 'success') }
            catch (e) { addToast(e.message, 'error') }
          }}
          onUpdate={async (id, data) => {
            try { await updatePerson(id, data); addToast('Person aktualisiert.', 'success') }
            catch (e) { addToast(e.message, 'error') }
          }}
          onDelete={async (id) => {
            try { await deletePerson(id); addToast('Person gelöscht.', 'success') }
            catch (e) { addToast(e.message, 'error') }
          }}
        />
      </Modal>
    </div>
  )
}

function PersonManager({ persons, onCreate, onUpdate, onDelete }) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PERSON_COLORS[0])
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    await onCreate({ name: newName.trim(), color: newColor })
    setNewName('')
    setSaving(false)
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return
    setSaving(true)
    await onUpdate(id, { name: editName.trim(), color: editColor })
    setEditId(null)
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {persons.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">Noch keine Personen vorhanden.</p>
        )}
        {persons.map(p => (
          <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
            {editId === p.id ? (
              <>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleUpdate(p.id)}
                />
                <div className="flex gap-1">
                  {PERSON_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${editColor === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button onClick={() => handleUpdate(p.id)} className="text-xs text-primary-600 font-semibold" disabled={saving}>OK</button>
                <button onClick={() => setEditId(null)} className="text-xs text-gray-400">✕</button>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="flex-1 text-sm text-gray-700">{p.name}</span>
                <button onClick={() => { setEditId(p.id); setEditName(p.name); setEditColor(p.color) }}
                  className="p-1 text-gray-400 hover:text-primary-600 rounded"><Edit2 size={14} /></button>
                <button onClick={() => setDeleteId(p.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Neue Person hinzufügen</p>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="Name eingeben..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {PERSON_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setNewColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${newColor === c ? 'border-gray-700 scale-110' : 'border-white shadow'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <Button onClick={handleCreate} disabled={!newName.trim() || saving} className="w-full justify-center" icon={Plus}>
          {saving ? 'Wird hinzugefügt...' : 'Person hinzufügen'}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { onDelete(deleteId); setDeleteId(null) }}
        title="Person löschen"
        message="Soll diese Person wirklich gelöscht werden? Alle Wochenplan-Einträge dieser Person werden ebenfalls entfernt."
      />
    </div>
  )
}
