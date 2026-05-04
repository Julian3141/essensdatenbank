import { useState, useEffect } from 'react'
import { ToastProvider } from './components/ui/Toast'
import { PersonContext } from './context/PersonContext'
import { usePersons } from './hooks/usePersons'
import FoodsPage from './pages/FoodsPage'
import RecipesPage from './pages/RecipesPage'
import PlannerPage from './pages/PlannerPage'
import ShoppingPage from './pages/ShoppingPage'
import PersonSelect from './components/ui/PersonSelect'
import { Apple, BookOpen, Calendar, ShoppingCart, AlertCircle, Download, LogOut } from 'lucide-react'

const TABS = [
  { key: 'foods',    label: 'Lebensmittel', icon: Apple,        description: 'Zutaten & Nährwerte' },
  { key: 'recipes',  label: 'Rezepte',      icon: BookOpen,     description: 'Gerichte zusammenstellen' },
  { key: 'planner',  label: 'Wochenplan',   icon: Calendar,     description: 'Mahlzeiten planen' },
  { key: 'shopping', label: 'Einkaufen',    icon: ShoppingCart, description: 'Einkaufsliste' },
]

const hasSupabaseConfig = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://deine-projekt-id.supabase.co'
)

export default function App() {
  const { persons, loading: personsLoading, createPerson, updatePerson, updateGoals, deletePerson } = usePersons()
  const [activePerson, setActivePerson] = useState(() => {
    try { return JSON.parse(localStorage.getItem('active_person')) } catch { return null }
  })
  const [activeTab, setActiveTab] = useState('foods')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  // Sync activePerson with fresh DB data once persons are loaded
  useEffect(() => {
    if (!personsLoading && activePerson) {
      const fresh = persons.find(p => p.id === activePerson.id)
      if (fresh) {
        setActivePerson(fresh)
        localStorage.setItem('active_person', JSON.stringify(fresh))
      } else {
        setActivePerson(null)
        localStorage.removeItem('active_person')
      }
    }
  }, [personsLoading, persons])

  function login(personId) {
    const person = persons.find(p => p.id === personId)
    if (!person) return
    setActivePerson(person)
    localStorage.setItem('active_person', JSON.stringify(person))
  }

  function logout() {
    setActivePerson(null)
    localStorage.removeItem('active_person')
  }

  if (personsLoading && !activePerson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Lade...</p>
      </div>
    )
  }

  if (!activePerson) {
    return (
      <PersonSelect
        persons={persons}
        onLogin={login}
        onCreate={createPerson}
        onUpdate={updatePerson}
        onDelete={deletePerson}
      />
    )
  }

  const ActivePage = {
    foods:    FoodsPage,
    recipes:  RecipesPage,
    planner:  PlannerPage,
    shopping: ShoppingPage,
  }[activeTab]

  const contextValue = {
    activePerson,
    logout,
    updateGoals: async (id, goals) => {
      await updateGoals(id, goals)
      const updated = { ...activePerson, nutrient_goals: goals }
      setActivePerson(updated)
      localStorage.setItem('active_person', JSON.stringify(updated))
    },
  }

  return (
    <PersonContext.Provider value={contextValue}>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Apple size={18} className="text-white" />
                </div>
                <span className="font-bold text-gray-800 text-lg hidden sm:block">Ernährungsplaner</span>
              </div>
              {installPrompt && !installed && (
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Download size={15} />
                  <span>App installieren</span>
                </button>
              )}
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: activePerson.color }}
                  title={activePerson.name}
                >
                  {activePerson.name[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-gray-600 hidden sm:block">{activePerson.name}</span>
                <button
                  onClick={logout}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Abmelden"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </header>

          {/* Config-Warnung */}
          {!hasSupabaseConfig && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
              <div className="max-w-6xl mx-auto flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Supabase noch nicht konfiguriert</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Lege eine <code className="bg-amber-100 px-1 rounded">.env</code> Datei im Projektordner an mit deiner Supabase URL und dem Anon Key. Weitere Anleitung findest du in der <code>SETUP.md</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex overflow-x-auto">
                {TABS.map(tab => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                        isActive
                          ? 'border-primary-600 text-primary-700 bg-primary-50'
                          : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={17} />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* Content */}
          <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
            <ActivePage />
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-100 py-3 px-4 text-center text-xs text-gray-400">
            Ernährungsplaner · Alle Nährwerte pro 100g
          </footer>
        </div>
      </ToastProvider>
    </PersonContext.Provider>
  )
}
