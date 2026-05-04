import { useState, useRef } from 'react'
import { Search, Loader } from 'lucide-react'

const NUTRIMENT_MAP = [
  { off: 'energy-kcal_100g',   key: 'calories',  factor: 1       },
  { off: 'proteins_100g',      key: 'protein',   factor: 1       },
  { off: 'carbohydrates_100g', key: 'carbs',     factor: 1       },
  { off: 'fat_100g',           key: 'fat',       factor: 1       },
  { off: 'saturated-fat_100g', key: 'sat_fat',   factor: 1       },
  { off: 'fiber_100g',         key: 'fiber',     factor: 1       },
  { off: 'sugars_100g',        key: 'sugar',     factor: 1       },
  { off: 'omega-3-fat_100g',   key: 'omega3',    factor: 1       },
  { off: 'omega-6-fat_100g',   key: 'omega6',    factor: 1       },
  { off: 'sodium_100g',        key: 'sodium',    factor: 1000    }, // g → mg
  { off: 'calcium_100g',       key: 'calcium',   factor: 1000    },
  { off: 'magnesium_100g',     key: 'magnesium', factor: 1000    },
  { off: 'iron_100g',          key: 'iron',      factor: 1000    },
  { off: 'zinc_100g',          key: 'zinc',      factor: 1000    },
  { off: 'potassium_100g',     key: 'potassium', factor: 1000    },
  { off: 'vitamin-c_100g',     key: 'vit_c',     factor: 1000    }, // g → mg
  { off: 'vitamin-e_100g',     key: 'vit_e',     factor: 1000    },
  { off: 'vitamin-d_100g',     key: 'vit_d',     factor: 1000000 }, // g → µg
  { off: 'vitamin-b12_100g',   key: 'vit_b12',   factor: 1000000 },
  { off: 'vitamin-a_100g',     key: 'vit_a',     factor: 1000000 },
  { off: 'folates_100g',       key: 'folate',    factor: 1000000 },
]

function mapNutriments(nutriments) {
  const result = {}
  for (const { off, key, factor } of NUTRIMENT_MAP) {
    const val = nutriments[off]
    if (val != null && val > 0) result[key] = +(val * factor).toFixed(4)
  }
  return result
}

function guessCategory(tags = []) {
  const s = tags.join(' ').toLowerCase()
  if (/cereal|grain|bread|flour|oat|rice|pasta|noodle/.test(s)) return 'Getreide'
  if (/vegetable|veggie/.test(s)) return 'Gemüse'
  if (/fruit/.test(s)) return 'Obst'
  if (/dairy|milk|cheese|yogurt|cream/.test(s)) return 'Milchprodukte'
  if (/meat|fish|seafood|poultry|chicken|beef|pork|salmon/.test(s)) return 'Fleisch & Fisch'
  if (/legume|bean|lentil|pea|soy/.test(s)) return 'Hülsenfrüchte'
  if (/oil|fat|butter|margarine/.test(s)) return 'Fette & Öle'
  if (/nut|seed|almond|walnut/.test(s)) return 'Nüsse & Samen'
  if (/spice|sauce|condiment|vinegar|mustard/.test(s)) return 'Gewürze & Saucen'
  if (/beverage|drink|water|juice|soda|tea|coffee/.test(s)) return 'Getränke'
  return 'Sonstiges'
}

export function mapOFFProduct(product) {
  return {
    name: product.product_name || '',
    category: guessCategory(product.categories_tags),
    nutrients: mapNutriments(product.nutriments || {}),
  }
}

export default function OpenFoodFactsSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState(null)

  async function search() {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const url =
        `https://world.openfoodfacts.org/api/v2/search` +
        `?search_terms=${encodeURIComponent(q)}` +
        `&fields=product_name,brands,nutriments,categories_tags` +
        `&page_size=15`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResults((data.products || []).filter(p => p.product_name?.trim()))
    } catch (e) {
      setError(`Suche fehlgeschlagen: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="z.B. Haferflocken, Mozzarella..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
        </div>
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          {loading ? <Loader size={15} className="animate-spin" /> : <Search size={15} />}
          Suchen
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {searched && !loading && results.length === 0 && !error && (
        <p className="text-sm text-gray-500 text-center py-4">Keine Ergebnisse gefunden.</p>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
          {results.map((product, i) => {
            const kcal = product.nutriments?.['energy-kcal_100g']
            const protein = product.nutriments?.['proteins_100g']
            const carbs = product.nutriments?.['carbohydrates_100g']
            const fat = product.nutriments?.['fat_100g']
            return (
              <button
                key={i}
                onClick={() => onSelect(mapOFFProduct(product))}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary-50 text-left transition-colors border border-transparent hover:border-primary-100"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{product.product_name}</div>
                  {product.brands && (
                    <div className="text-xs text-gray-400 truncate">{product.brands}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-2">
                    {kcal != null && <span>{Math.round(kcal)} kcal</span>}
                    {protein != null && <span>{protein.toFixed(1)}g Eiweiß</span>}
                    {carbs != null && <span>{carbs.toFixed(1)}g KH</span>}
                    {fat != null && <span>{fat.toFixed(1)}g Fett</span>}
                    {kcal == null && protein == null && <span className="text-gray-400">Keine Nährwerte vorhanden</span>}
                    <span className="text-gray-300">/ 100g</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center pt-1 border-t border-gray-100">
        Daten von Open Food Facts (openfoodfacts.org) · Lizenz: ODbL
      </p>
    </div>
  )
}
