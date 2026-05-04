import { useState } from 'react'
import { Apple, ArrowLeft, Settings, Plus, Edit2, Trash2, Eye, EyeOff, Download, CheckCircle } from 'lucide-react'
import Button from './Button'
import ConfirmDialog from './ConfirmDialog'
import { PERSON_COLORS } from '../../lib/nutrients'
import { BUILTIN_FOODS } from '../../lib/builtinFoods'
import { supabase } from '../../lib/supabase'

const ADMIN_PIN = '7537'

export default function PersonSelect({ persons, onLogin, onCreate, onUpdate, onDelete }) {
  const [step, setStep] = useState('select') // 'select' | 'pin' | 'admin-pin' | 'admin'
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function handlePersonClick(person) {
    if (!person.pin) {
      onLogin(person.id)
    } else {
      setSelectedPerson(person)
      setPin('')
      setError(false)
      setStep('pin')
    }
  }

  function handleDigit(d) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === 4) {
      if (step === 'pin') {
        if (next === selectedPerson.pin) {
          onLogin(selectedPerson.id)
        } else {
          triggerError()
        }
      } else if (step === 'admin-pin') {
        if (next === ADMIN_PIN) {
          setStep('admin')
          setPin('')
        } else {
          triggerError()
        }
      }
    }
  }

  function triggerError() {
    setShake(true)
    setError(true)
    setTimeout(() => { setPin(''); setShake(false) }, 600)
  }

  function handleBackspace() {
    setPin(prev => prev.slice(0, -1))
    setError(false)
  }

  function goBack() {
    setStep('select')
    setPin('')
    setError(false)
  }

  if (step === 'admin') {
    return (
      <AdminScreen
        persons={persons}
        onBack={() => setStep('select')}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    )
  }

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Apple size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Ernährungsplaner</h1>
          {step === 'select' && (
            <p className="text-gray-500 text-sm text-center">Wer bist du?</p>
          )}
          {step === 'pin' && (
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: selectedPerson?.color }}>
                {selectedPerson?.name[0]?.toUpperCase()}
              </div>
              <p className="text-gray-700 font-medium">{selectedPerson?.name}</p>
              <p className="text-gray-400 text-sm">PIN eingeben</p>
            </div>
          )}
          {step === 'admin-pin' && (
            <p className="text-gray-500 text-sm">Admin-PIN eingeben</p>
          )}
        </div>

        {step === 'select' && (
          <>
            {persons.length === 0 ? (
              <div className="text-center text-gray-500 text-sm flex flex-col gap-1">
                <p>Noch keine Personen vorhanden.</p>
                <p>Bitte Admin-Bereich öffnen.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                {persons.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePersonClick(p)}
                    className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all active:scale-[0.98]"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800 flex-1 text-left">{p.name}</span>
                    {p.pin
                      ? <span className="text-gray-400 text-xs">🔒</span>
                      : <span className="text-gray-300 text-xs">offen</span>
                    }
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => { setStep('admin-pin'); setPin(''); setError(false) }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Settings size={13} /> Admin-Bereich
            </button>
          </>
        )}

        {(step === 'pin' || step === 'admin-pin') && (
          <>
            <div className={`flex gap-4 ${shake ? 'animate-shake' : ''}`}>
              {[0,1,2,3].map(i => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    i < pin.length
                      ? error ? 'bg-red-500 border-red-500' : 'bg-primary-600 border-primary-600'
                      : 'border-gray-300'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-sm -mt-4">Falsche PIN. Bitte nochmal versuchen.</p>
            )}

            <div className="grid grid-cols-3 gap-3 w-full">
              {digits.map((d, i) => {
                if (d === '') return <div key={i} />
                return (
                  <button
                    key={i}
                    onClick={() => d === '⌫' ? handleBackspace() : handleDigit(d)}
                    className={`h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${
                      d === '⌫'
                        ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-200 hover:bg-primary-50 hover:border-primary-300'
                    }`}
                  >
                    {d}
                  </button>
                )
              })}
            </div>

            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={16} /> Zurück
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function AdminScreen({ persons, onBack, onCreate, onUpdate, onDelete }) {
  const [importState, setImportState] = useState('idle') // 'idle' | 'running' | 'done' | 'error'
  const [importResult, setImportResult] = useState(null)

  async function handleImportFoods() {
    setImportState('running')
    setImportResult(null)
    try {
      const { data: existing } = await supabase.from('foods').select('name')
      const existingNames = new Set((existing || []).map(f => f.name.toLowerCase()))
      const toInsert = BUILTIN_FOODS
        .filter(f => !existingNames.has(f.name.toLowerCase()))
        .map(({ name, category, nutrients }) => ({ name, category, nutrients }))
      if (toInsert.length === 0) {
        setImportResult({ inserted: 0, skipped: BUILTIN_FOODS.length })
        setImportState('done')
        return
      }
      const { error } = await supabase.from('foods').insert(toInsert)
      if (error) throw error
      setImportResult({ inserted: toInsert.length, skipped: BUILTIN_FOODS.length - toInsert.length })
      setImportState('done')
    } catch (e) {
      setImportResult({ error: e.message })
      setImportState('error')
    }
  }

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PERSON_COLORS[0])
  const [newPin, setNewPin] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editPin, setEditPin] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showNewPin, setShowNewPin] = useState(false)
  const [showEditPin, setShowEditPin] = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    await onCreate({ name: newName.trim(), color: newColor, pin: newPin.trim() || null })
    setNewName('')
    setNewPin('')
    setSaving(false)
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return
    setSaving(true)
    await onUpdate(id, { name: editName.trim(), color: editColor, pin: editPin.trim() || null })
    setEditId(null)
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="font-bold text-gray-800">Personen verwalten</h2>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full p-4 flex flex-col gap-4">
        {/* Existing persons */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700">Vorhandene Personen</p>
          {persons.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">Noch keine Personen vorhanden.</p>
          )}
          {persons.map(p => (
            <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
              {editId === p.id ? (
                <div className="flex flex-col gap-2 w-full">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleUpdate(p.id)}
                  />
                  <div className="relative">
                    <input
                      type={showEditPin ? 'text' : 'password'}
                      value={editPin}
                      onChange={e => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="PIN (leer = kein PIN)"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button type="button" onClick={() => setShowEditPin(s => !s)}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                      {showEditPin ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {PERSON_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setEditColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${editColor === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdate(p.id)} disabled={saving} size="sm">
                      {saving ? 'Speichern...' : 'Speichern'}
                    </Button>
                    <Button variant="secondary" onClick={() => setEditId(null)} size="sm">Abbrechen</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="flex-1 text-sm text-gray-700">{p.name}</span>
                  {p.pin && <span className="text-xs text-gray-400">🔒</span>}
                  <button
                    onClick={() => { setEditId(p.id); setEditName(p.name); setEditColor(p.color); setEditPin(p.pin || '') }}
                    className="p-1 text-gray-400 hover:text-primary-600 rounded transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Lebensmittel-Import */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700">Lebensmitteldatenbank importieren</p>
          <p className="text-xs text-gray-400">
            Fügt {BUILTIN_FOODS.length} generische Lebensmittel (Getreide, Gemüse, Obst, Fleisch, Tofu, asiatische Zutaten, …) direkt in die Datenbank ein. Bereits vorhandene werden übersprungen.
          </p>
          {importState === 'done' && importResult && !importResult.error && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <CheckCircle size={15} />
              {importResult.inserted > 0
                ? `${importResult.inserted} Lebensmittel importiert${importResult.skipped > 0 ? `, ${importResult.skipped} bereits vorhanden` : ''}.`
                : `Alle ${importResult.skipped} Lebensmittel bereits vorhanden.`}
            </div>
          )}
          {importState === 'error' && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{importResult?.error}</p>
          )}
          <Button
            onClick={handleImportFoods}
            disabled={importState === 'running' || importState === 'done'}
            icon={importState === 'done' ? CheckCircle : Download}
            variant={importState === 'done' ? 'secondary' : 'primary'}
          >
            {importState === 'running' ? 'Importiere…' : importState === 'done' ? 'Importiert' : 'Lebensmittel importieren'}
          </Button>
        </div>

        {/* New person form */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Neue Person hinzufügen</p>
          <div className="flex flex-col gap-3">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Name..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="relative">
              <input
                type={showNewPin ? 'text' : 'password'}
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="PIN (optional, 4 Ziffern)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button type="button" onClick={() => setShowNewPin(s => !s)}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                {showNewPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {PERSON_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${newColor === c ? 'border-gray-700 scale-110' : 'border-white shadow'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <Button onClick={handleCreate} disabled={!newName.trim() || saving} icon={Plus}>
              {saving ? 'Wird angelegt...' : 'Person hinzufügen'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { onDelete(deleteId); setDeleteId(null) }}
        title="Person löschen"
        message="Soll diese Person wirklich gelöscht werden? Alle Wochenplan-Einträge werden ebenfalls entfernt."
      />
    </div>
  )
}
