import { NUTRIENT_FIELDS } from '../../lib/nutrients'

const colorMap = {
  orange: 'bg-orange-100 text-orange-700',
  blue:   'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red:    'bg-red-100 text-red-700',
  green:  'bg-green-100 text-green-700',
  pink:   'bg-pink-100 text-pink-700',
  teal:   'bg-teal-100 text-teal-700',
  purple: 'bg-purple-100 text-purple-700',
  gray:   'bg-gray-100 text-gray-600',
}

function formatVal(key, value) {
  const field = NUTRIENT_FIELDS.find(f => f.key === key)
  const unit = field?.unit || 'g'
  if (unit === 'kcal') return `${Math.round(value)} kcal`
  if (unit === 'mg')   return `${Number(value).toFixed(1)} mg`
  if (unit === 'µg')   return `${Number(value).toFixed(1)} µg`
  return `${Number(value).toFixed(1)} g`
}

// Zeigt alle Nährwerte als Grid — optional gefiltert nach visibleKeys
export function NutrientGrid({ nutrients, compact = false, visibleKeys = null }) {
  if (!nutrients) return null

  // Reihenfolge nach NUTRIENT_FIELDS, dann unbekannte Keys
  const knownKeys = NUTRIENT_FIELDS.map(f => f.key).filter(k => nutrients[k] != null && nutrients[k] !== 0)
  const unknownKeys = Object.keys(nutrients).filter(k => !NUTRIENT_FIELDS.some(f => f.key === k) && nutrients[k] != null)
  const allKeys = [...knownKeys, ...unknownKeys]

  const displayKeys = visibleKeys ? allKeys.filter(k => visibleKeys.includes(k)) : allKeys

  if (displayKeys.length === 0) return <p className="text-xs text-gray-400">Keine Nährwerte vorhanden.</p>

  return (
    <div className={`grid gap-1.5 ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {displayKeys.map(key => {
        const value = nutrients[key]
        const field = NUTRIENT_FIELDS.find(f => f.key === key)
        const label = field?.label || key
        const color = field?.color || 'gray'
        const colorClass = colorMap[color] || 'bg-gray-100 text-gray-600'
        return (
          <div key={key} className={`${colorClass} rounded-lg p-2 text-center`}>
            <div className="text-xs opacity-70 truncate">{label}</div>
            <div className="font-semibold text-sm">{formatVal(key, value)}</div>
          </div>
        )
      })}
    </div>
  )
}
