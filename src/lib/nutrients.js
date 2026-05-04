export const NUTRIENT_FIELDS = [
  { key: 'calories',   label: 'Kalorien',        unit: 'kcal', color: 'orange' },
  { key: 'protein',    label: 'Eiweiß',           unit: 'g',    color: 'blue' },
  { key: 'carbs',      label: 'Kohlenhydrate',    unit: 'g',    color: 'yellow' },
  { key: 'fat',        label: 'Fett (gesamt)',    unit: 'g',    color: 'red' },
  { key: 'sat_fat',    label: 'Gesättigte Fetts.', unit: 'g',   color: 'red' },
  { key: 'omega3',     label: 'Omega-3',          unit: 'g',    color: 'teal' },
  { key: 'omega6',     label: 'Omega-6',          unit: 'g',    color: 'teal' },
  { key: 'fiber',      label: 'Ballaststoffe',    unit: 'g',    color: 'green' },
  { key: 'sugar',      label: 'Zucker',           unit: 'g',    color: 'pink' },
  { key: 'sodium',     label: 'Natrium',          unit: 'mg',   color: 'gray' },
  { key: 'calcium',    label: 'Calcium',          unit: 'mg',   color: 'gray' },
  { key: 'magnesium',  label: 'Magnesium',        unit: 'mg',   color: 'gray' },
  { key: 'iron',       label: 'Eisen',            unit: 'mg',   color: 'gray' },
  { key: 'zinc',       label: 'Zink',             unit: 'mg',   color: 'gray' },
  { key: 'potassium',  label: 'Kalium',           unit: 'mg',   color: 'gray' },
  { key: 'vit_c',      label: 'Vitamin C',        unit: 'mg',   color: 'purple' },
  { key: 'vit_d',      label: 'Vitamin D',        unit: 'µg',   color: 'purple' },
  { key: 'vit_b12',    label: 'Vitamin B12',      unit: 'µg',   color: 'purple' },
  { key: 'vit_a',      label: 'Vitamin A',        unit: 'µg',   color: 'purple' },
  { key: 'vit_e',      label: 'Vitamin E',        unit: 'mg',   color: 'purple' },
  { key: 'folate',     label: 'Folsäure',         unit: 'µg',   color: 'purple' },
]

// Nur diese werden standardmäßig im Lebensmittel-Formular und in der Kurzansicht angezeigt
export const NUTRIENT_FIELDS_CORE = [
  'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar',
]

export const NUTRIENT_DEFAULTS = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
}

// Standardmäßig in Tages-/Wochenübersicht angezeigte Nährwerte
export const DEFAULT_SUMMARY_NUTRIENTS = ['calories', 'protein', 'carbs', 'fat', 'fiber']

export function calculateNutrients(nutrients, grams) {
  const factor = grams / 100
  const result = {}
  for (const key of Object.keys(nutrients)) {
    result[key] = (parseFloat(nutrients[key]) || 0) * factor
  }
  return result
}

export function sumNutrients(nutrientsList) {
  const result = {}
  for (const nutrients of nutrientsList) {
    for (const [key, value] of Object.entries(nutrients)) {
      result[key] = (result[key] || 0) + (parseFloat(value) || 0)
    }
  }
  return result
}

export function formatNutrientValue(key, value) {
  const field = NUTRIENT_FIELDS.find(f => f.key === key)
  const unit = field?.unit || 'g'
  if (unit === 'kcal') return `${Math.round(value)} kcal`
  if (unit === 'mg') return `${value.toFixed(1)} mg`
  if (unit === 'µg') return `${value.toFixed(1)} µg`
  return `${value.toFixed(1)} g`
}

export const FOOD_CATEGORIES = [
  'Getreide',
  'Gemüse',
  'Obst',
  'Milchprodukte',
  'Fleisch & Fisch',
  'Hülsenfrüchte',
  'Fette & Öle',
  'Nüsse & Samen',
  'Gewürze & Saucen',
  'Getränke',
  'Sonstiges',
]

export const MEAL_TYPES = [
  { key: 'breakfast', label: 'Frühstück',   icon: '🌅' },
  { key: 'lunch',     label: 'Mittagessen', icon: '☀️' },
  { key: 'dinner',    label: 'Abendessen',  icon: '🌙' },
  { key: 'snack',     label: 'Snack',       icon: '🍎' },
]

export const PERSON_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
]

export const CATEGORICAL_FIELDS = [
  {
    key: 'glycemic_index',
    label: 'Glykäm. Index',
    options: [
      { value: 'low', label: 'Niedrig' },
      { value: 'high', label: 'Hoch' },
    ],
    levelColors: { low: 'green', high: 'red' },
  },
  {
    key: 'fodmap',
    label: 'FODMAP',
    options: [
      { value: 'low', label: 'Niedrig' },
      { value: 'medium', label: 'Mittel' },
      { value: 'high', label: 'Hoch' },
    ],
    levelColors: { low: 'green', medium: 'yellow', high: 'red' },
  },
  {
    key: 'sorbitol',
    label: 'Sorbitol',
    options: [
      { value: 'low', label: 'Niedrig' },
      { value: 'medium', label: 'Mittel' },
      { value: 'high', label: 'Hoch' },
    ],
    levelColors: { low: 'green', medium: 'yellow', high: 'red' },
  },
]
