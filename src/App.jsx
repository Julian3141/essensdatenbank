import { useState, useEffect } from 'react'
import { ToastProvider } from './components/ui/Toast'
import FoodsPage from './pages/FoodsPage'
import RecipesPage from './pages/RecipesPage'
import PlannerPage from './pages/PlannerPage'
import ShoppingPage from './pages/ShoppingPage'
import { Apple, BookOpen, Calendar, ShoppingCart, AlertCircle, Download } from 'lucide-react'

const TABS = [
  { key: 'foods', label: 'Lebensmittel', icon: Apple, description: 'Zutaten & Nährwerte' },
  { key: 'recipes', label: 'Rezepte', icon: BookOpen, description: 'Gerichte zusammenstellen' },
  { key: 'planner', label: 'Wochenplan', icon: Calendar, description: 'Mahlzeiten planen' },
  { key: 'shopping', label: 'Einkaufen', icon: ShoppingCart, description: 'Einkaufsliste' },
]

const hasSupabaseConfig = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://deine-projekt-id.supabase.co'
)

export default function App() {
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

  const ActivePage = {
    foods: FoodsPage,
    recipes: RecipesPage,
    planner: PlannerPage,
    shopping: ShoppingPage,
  }[activeTab]

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
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
  )
}
