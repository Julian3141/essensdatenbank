import { useState } from 'react'
import { Apple } from 'lucide-react'

const CORRECT_PIN = '7537'
const STORAGE_KEY = 'app_unlocked'

export function isUnlocked() {
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export default function PinLock({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function handleDigit(d) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === 4) {
      if (next === CORRECT_PIN) {
        localStorage.setItem(STORAGE_KEY, '1')
        onUnlock()
      } else {
        setShake(true)
        setError(true)
        setTimeout(() => { setPin(''); setShake(false) }, 600)
      }
    }
  }

  function handleDelete() {
    setPin(prev => prev.slice(0, -1))
    setError(false)
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
          <p className="text-gray-500 text-sm">Bitte PIN eingeben</p>
        </div>

        {/* PIN-Punkte */}
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

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {digits.map((d, i) => {
            if (d === '') return <div key={i} />
            return (
              <button
                key={i}
                onClick={() => d === '⌫' ? handleDelete() : handleDigit(d)}
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
      </div>
    </div>
  )
}
