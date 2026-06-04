import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const __dirname = dirname(fileURLToPath(import.meta.url))
const EXCEL_PATH = join(__dirname, '..', 'BLS', 'BLS_4_0_Daten_2025_DE.xlsx')

console.log('📂 Lese Excel...')
const workbook = XLSX.readFile(EXCEL_PATH)
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })

const codeCol = Object.keys(rows[0])[0]
const nameCol = Object.keys(rows[0])[1]

// Pro Präfix: 5 Beispiel-Namen sammeln
const prefixExamples = {}
for (const row of rows) {
  const code = row[codeCol]
  const name = row[nameCol]
  if (!code || !name) continue
  const p = String(code)[0].toUpperCase()
  if (!prefixExamples[p]) prefixExamples[p] = []
  if (prefixExamples[p].length < 5) prefixExamples[p].push(name)
}

console.log('\n📊 BLS Code-Präfixe mit Beispielen:\n')
for (const [prefix, examples] of Object.entries(prefixExamples).sort()) {
  console.log(`${prefix} (${rows.filter(r => r[codeCol]?.[0]?.toUpperCase() === prefix).length} Einträge):`)
  for (const ex of examples) console.log(`   • ${ex}`)
  console.log()
}
