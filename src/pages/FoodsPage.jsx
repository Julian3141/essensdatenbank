import { useState, useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useFoods } from '../hooks/useFoods'
import { useToast } from '../components/ui/Toast'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import FoodForm from '../components/foods/FoodForm'
import { NutrientGrid } from '../components/ui/NutrientBadge'
import { Input, Select } from '../components/ui/Input'
import { Plus, Search, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { FOOD_CATEGORIES, CATEGORICAL_FIELDS } from '../lib/nutrients'

const CAT_BADGE_COLORS = {
  low:    'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-red-100 text-red-700',
}
const CAT_LEVEL_LABELS = { low: 'Niedrig', medium: 'Mittel', high: 'Hoch' }

export default function FoodsPage() {
  const { foods, loading, error, createFood, updateFood, deleteFood } = useFoods()
  const { addToast } = useToast()

  const [showCreate, setShowCreate] = useState(false)
  const [editFood, setEditFood] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const filtered = foods.filter(f => {
    const matchName = f.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || f.category === filterCat
    return matchName && matchCat
  })

  // Virtual list setup
  const scrollRef = useRef(null)
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: useCallback((i) => expandedId === filtered[i]?.id ? 260 : 80, [expandedId, filtered]),
    overscan: 8,
    measureElement: (el) => el?.getBoundingClientRect().height ?? 80,
  })

  async function handleCreate(data) {
    try {
      await createFood(data)
      addToast('Lebensmittel wurde angelegt.', 'success')
      setShowCreate(false)
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  async function handleUpdate(data) {
    try {
      await updateFood(editFood.id, data)
      addToast('Lebensmittel wurde aktualisiert.', 'success')
      setEditFood(null)
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  async function handleDelete() {
    try {
      await deleteFood(deleteId)
      addToast('Lebensmittel wurde gelöscht.', 'success')
    } catch (e) {
      addToast(e.message, 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lebensmittel</h1>
          <p className="text-gray-500 text-sm mt-1">{foods.length} Lebensmittel in der Datenbank</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreate(true)}>Neues Lebensmittel</Button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Lebensmittel suchen..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Alle Kategorien</option>
          {FOOD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Lade Lebensmittel...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search || filterCat ? 'Keine Lebensmittel gefunden.' : 'Noch keine Lebensmittel angelegt.'}
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map(vItem => {
              const food = filtered[vItem.index]
              const isExpanded = expandedId === food.id
              return (
                <div
                  key={food.id}
                  data-index={vItem.index}
                  ref={virtualizer.measureElement}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${vItem.start}px)` }}
                  className="pb-2"
                >
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedId(isExpanded ? null : food.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{food.name}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{food.category}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {food.nutrients?.calories != null ? `${Math.round(food.nutrients.calories)} kcal` : ''}{' '}
                          {food.nutrients?.protein != null ? `· ${food.nutrients.protein}g Eiweiß` : ''}{' '}
                          {food.nutrients?.carbs != null ? `· ${food.nutrients.carbs}g KH` : ''}{' '}
                          {food.nutrients?.fat != null ? `· ${food.nutrients.fat}g Fett` : ''}
                          <span className="text-gray-400"> pro 100g</span>
                        </div>
                        {CATEGORICAL_FIELDS.some(f => food[f.key]) && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {CATEGORICAL_FIELDS.filter(f => food[f.key]).map(f => (
                              <span key={f.key} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CAT_BADGE_COLORS[food[f.key]]}`}>
                                {f.label}: {CAT_LEVEL_LABELS[food[f.key]]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => { e.stopPropagation(); setEditFood(food) }}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteId(food.id) }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <p className="text-xs text-gray-500 mb-2">Nährwerte pro 100g</p>
                        <NutrientGrid nutrients={food.nutrients} compact />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Neues Lebensmittel anlegen" size="lg">
        <FoodForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal isOpen={!!editFood} onClose={() => setEditFood(null)} title="Lebensmittel bearbeiten" size="lg">
        {editFood && <FoodForm initial={editFood} onSubmit={handleUpdate} onCancel={() => setEditFood(null)} />}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Lebensmittel löschen"
        message="Soll dieses Lebensmittel wirklich gelöscht werden? Wenn es in einem Rezept verwendet wird, kann es nicht gelöscht werden."
      />
    </div>
  )
}
