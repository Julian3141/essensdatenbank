import { useState } from 'react'
import { Input, Select } from '../ui/Input'
import Button from '../ui/Button'
import { NUTRIENT_FIELDS, FOOD_CATEGORIES, NUTRIENT_DEFAULTS } from '../../lib/nutrients'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const NUTRIENT_GROUPS = [
  {
    label: 'Grundnährwerte',
    keys: ['calories', 'protein', 'carbs', 'fat', 'sat_fat', 'fiber', 'sugar'],
  },
  {
    label: 'Fettsäuren',
    keys: ['omega3', 'omega6'],
  },
  {
    label: 'Mineralstoffe',
    keys: ['sodium', 'calcium', 'magnesium', 'iron', 'zinc', 'potassium'],
  },
  {
    label: 'Vitamine',
    keys: ['vit_c', 'vit_d', 'vit_b12', 'vit_a', 'vit_e', 'folate'],
  },
]

export default function FoodForm({ initial = null, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [category, setCategory] = useState(initial?.category || 'Sonstiges')
  const [nutrients, setNutrients] = useState(() => {
    const base = { ...NUTRIENT_DEFAULTS }
    if (initial?.nutrients) return { ...base, ...initial.nutrients }
    return base
  })
  const [extraFields, setExtraFields] = useState(() => {
    if (!initial?.nutrients) return []
    const knownKeys = NUTRIENT_FIELDS.map(f => f.key)
    return Object.keys(initial.nutrients).filter(k => !knownKeys.includes(k))
  })
  const [newFieldName, setNewFieldName] = useState('')
  const [expandedGroups, setExpandedGroups] = useState(['Grundnährwerte'])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function toggleGroup(label) {
    setExpandedGroups(prev =>
      prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
    )
  }

  function validate() {
    const e = {}
    if (!name.trim()) e.name = 'Bitte einen Namen eingeben.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitting(true)
    try {
      const nutrientData = {}
      for (const [k, v] of Object.entries(nutrients)) {
        const num = parseFloat(v)
        if (!isNaN(num) && num !== 0) nutrientData[k] = num
      }
      for (const k of extraFields) {
        const num = parseFloat(nutrients[k])
        if (!isNaN(num) && num !== 0) nutrientData[k] = num
      }
      await onSubmit({ name: name.trim(), category, nutrients: nutrientData })
    } finally {
      setSubmitting(false)
    }
  }

  function addExtraField() {
    const key = newFieldName.trim().toLowerCase().replace(/\s+/g, '_')
    if (!key || extraFields.includes(key) || NUTRIENT_FIELDS.some(f => f.key === key)) return
    setExtraFields(prev => [...prev, key])
    setNutrients(prev => ({ ...prev, [key]: 0 }))
    setNewFieldName('')
  }

  function removeExtraField(key) {
    setExtraFields(prev => prev.filter(k => k !== key))
    setNutrients(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Name des Lebensmittels *"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="z.B. Haferflocken"
        error={errors.name}
        autoFocus
      />
      <Select label="Kategorie" value={category} onChange={e => setCategory(e.target.value)}>
        {FOOD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </Select>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Nährwerte pro 100g</p>
        <div className="flex flex-col gap-2">
          {NUTRIENT_GROUPS.map(group => {
            const isExpanded = expandedGroups.includes(group.label)
            const fields = group.keys.map(k => NUTRIENT_FIELDS.find(f => f.key === k)).filter(Boolean)
            return (
              <div key={group.label} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700">{group.label}</span>
                  {isExpanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                </button>
                {isExpanded && (
                  <div className="grid grid-cols-2 gap-3 p-3">
                    {fields.map(field => (
                      <Input
                        key={field.key}
                        label={`${field.label} (${field.unit})`}
                        type="number"
                        min="0"
                        step="0.001"
                        value={nutrients[field.key] ?? ''}
                        placeholder="0"
                        onChange={e => setNutrients(prev => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Eigene Felder */}
          {extraFields.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">Eigene Felder</p>
              <div className="grid grid-cols-2 gap-3">
                {extraFields.map(key => (
                  <div key={key} className="flex items-end gap-2">
                    <Input
                      label={`${key} (g)`}
                      type="number"
                      min="0"
                      step="0.001"
                      value={nutrients[key] ?? ''}
                      placeholder="0"
                      onChange={e => setNutrients(prev => ({ ...prev, [key]: e.target.value }))}
                      className="flex-1"
                    />
                    <button type="button" onClick={() => removeExtraField(key)}
                      className="mb-0.5 p-2 text-red-400 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Eigenes Nährwertfeld (z.B. Lycopin)"
              value={newFieldName}
              onChange={e => setNewFieldName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addExtraField())}
            />
            <Button type="button" variant="secondary" onClick={addExtraField} icon={Plus} size="md">
              Hinzufügen
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Speichern...' : (initial ? 'Änderungen speichern' : 'Lebensmittel anlegen')}
        </Button>
      </div>
    </form>
  )
}
