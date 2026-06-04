import { createRequire } from 'module'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// .env manuell einlesen (kein dotenv nötig)
function loadEnv() {
  try {
    const lines = readFileSync(join(ROOT, '.env'), 'utf-8').split('\n')
    for (const line of lines) {
      const m = line.match(/^([^=\s#]+)\s*=\s*(.*)$/)
      if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim()
    }
  } catch {
    console.error('❌ .env Datei nicht gefunden')
    process.exit(1)
  }
}
loadEnv()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('placeholder')) {
  console.error('❌ Supabase nicht konfiguriert. Bitte VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in .env setzen.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── BLS Code-Präfix → App-Kategorie ─────────────────────────────────────────
// Bitte nach dem ersten Lauf prüfen und ggf. anpassen!
// Das Script gibt alle gefundenen Präfixe aus.
const CATEGORY_MAP = {
  B: 'Getreide',        // Brot
  C: 'Getreide',        // Getreide/Cerealien (bestätigt: C131000 = Hafer)
  D: 'Sonstiges',       // Dauergebäck, Kekse
  E: 'Getreide',        // Teigwaren/Pasta
  F: 'Obst',
  G: 'Gemüse',
  H: 'Hülsenfrüchte',   // Hülsenfrüchte, Sprossen, Tofu
  K: 'Gemüse',          // Kartoffeln, Stärke
  M: 'Milchprodukte',
  N: 'Getränke',        // Alkoholfrei (Kaffee, Tee, Wasser)
  P: 'Getränke',        // Alkohol
  Q: 'Fette & Öle',
  R: 'Gewürze & Saucen',
  S: 'Sonstiges',       // Zucker, Süßwaren, Honig
  T: 'Fleisch & Fisch', // Fisch
  U: 'Fleisch & Fisch', // Fleisch
  V: 'Fleisch & Fisch', // Geflügel, Wild
  W: 'Fleisch & Fisch', // Wurstwaren
  X: 'Sonstiges',       // Fertiggerichte, Brühen
  Y: 'Sonstiges',       // Fertiggerichte, Gerichte
}

// ─── BLS-Code → App Nährstoff-Key ─────────────────────────────────────────────
const NUTRIENT_MAP = {
  ENERCC:  'calories',   // kcal
  PROT625: 'protein',    // g
  CHO:     'carbs',      // g
  FAT:     'fat',        // g
  FASAT:   'sat_fat',    // g
  FAPUN3:  'omega3',     // g
  FAPUN6:  'omega6',     // g
  FIBT:    'fiber',      // g
  SUGAR:   'sugar',      // g
  NA:      'sodium',     // mg
  CA:      'calcium',    // mg
  MG:      'magnesium',  // mg
  FE:      'iron',       // mg
  ZN:      'zinc',       // mg
  K:       'potassium',  // mg
  VITC:    'vit_c',      // mg
  VITD:    'vit_d',      // µg
  VITB12:  'vit_b12',    // µg
  VITA:    'vit_a',      // µg
  VITE:    'vit_e',      // mg
  FOL:     'folate',     // µg
}

const EXCEL_PATH = join(ROOT, 'BLS', 'BLS_4_0_Daten_2025_DE.xlsx')
const BATCH_SIZE = 200

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📂 Lese Excel-Datei (kann einen Moment dauern)...')
  const workbook = XLSX.readFile(EXCEL_PATH)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })

  if (rows.length === 0) {
    console.error('❌ Keine Daten in der Excel-Datei gefunden')
    process.exit(1)
  }
  console.log(`✅ ${rows.length} Zeilen geladen\n`)

  const headers = Object.keys(rows[0])

  // Name- und Code-Spalte finden (Spalten A und B)
  const codeCol  = headers[0]  // BLS Code (Spalte A)
  const nameCol  = headers[1]  // Lebensmittelbezeichnung (Spalte B)
  console.log(`📋 Code-Spalte:  "${codeCol}"`)
  console.log(`📋 Name-Spalte:  "${nameCol}"\n`)

  // Für jeden BLS-Code die Wert-Spalte finden (nicht Datenherkunft, nicht Referenz)
  const colMap = {}  // appKey → excelHeaderName
  const missing = []
  for (const [blsCode, appKey] of Object.entries(NUTRIENT_MAP)) {
    const col = headers.find(h =>
      h.startsWith(blsCode + ' ') &&
      !h.includes('Datenherkunft') &&
      !h.includes('Referenz')
    )
    if (col) colMap[appKey] = col
    else missing.push(blsCode)
  }

  console.log(`✅ ${Object.keys(colMap).length}/${Object.keys(NUTRIENT_MAP).length} Nährstoff-Spalten gefunden`)
  if (missing.length > 0) console.log(`⚠️  Nicht gefunden: ${missing.join(', ')}\n`)

  // BLS-Präfixe analysieren
  const prefixCounts = {}
  for (const row of rows) {
    const code = row[codeCol]
    if (code) {
      const p = String(code)[0].toUpperCase()
      prefixCounts[p] = (prefixCounts[p] || 0) + 1
    }
  }
  console.log('📊 BLS Code-Präfixe (für Kategorie-Prüfung):')
  for (const [p, count] of Object.entries(prefixCounts).sort()) {
    console.log(`   ${p}: ${count} Einträge → "${CATEGORY_MAP[p] || 'Sonstiges'}"`)
  }
  console.log()

  // Lebensmittel aufbauen
  const foods = []
  for (const row of rows) {
    const name    = row[nameCol]
    const blsCode = row[codeCol]
    if (!name || !blsCode) continue

    const prefix   = String(blsCode)[0].toUpperCase()
    const category = CATEGORY_MAP[prefix] || 'Sonstiges'

    const nutrients = {}
    for (const [appKey, col] of Object.entries(colMap)) {
      const val = row[col]
      if (val !== null && val !== undefined && val !== '') {
        const num = parseFloat(String(val).replace(',', '.'))
        if (!isNaN(num)) nutrients[appKey] = num
      }
    }

    foods.push({ name, category, nutrients })
  }

  console.log(`🍎 ${foods.length} Lebensmittel vorbereitet für Import\n`)

  // In Supabase einfügen (in Batches)
  let inserted = 0
  let errCount = 0

  for (let i = 0; i < foods.length; i += BATCH_SIZE) {
    const batch = foods.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('foods').insert(batch)
    if (error) {
      console.error(`\n❌ Fehler bei Batch ${i}–${i + batch.length}: ${error.message}`)
      errCount++
    } else {
      inserted += batch.length
      process.stdout.write(`\r⏳ ${inserted}/${foods.length} eingefügt...`)
    }
  }

  console.log(`\n\n✅ Fertig! ${inserted} Lebensmittel importiert.`)
  if (errCount > 0) console.log(`⚠️  ${errCount} Batches mit Fehlern`)
  console.log('\n💡 Tipp: Kategorie-Zuordnung oben in CATEGORY_MAP anpassen falls nötig.')
}

main().catch(err => {
  console.error('❌ Unerwarteter Fehler:', err.message)
  process.exit(1)
})
