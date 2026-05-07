# Ernährungsplaner

Eine Web-App zur Verwaltung von Lebensmitteln, Rezepten, Wochenplänen und Einkaufslisten — mit automatischer Nährwertberechnung und Mehrbenutzerverwaltung.

---

## Inhaltsverzeichnis

1. [Was macht die App?](#1-was-macht-die-app)
2. [Der Tech-Stack — womit ist das gebaut?](#2-der-tech-stack--womit-ist-das-gebaut)
3. [Wie hängt alles zusammen?](#3-wie-hängt-alles-zusammen)
4. [Projektstruktur](#4-projektstruktur)
5. [Die vier Seiten der App](#5-die-vier-seiten-der-app)
6. [Komponenten](#6-komponenten)
7. [Hooks — die Datenschicht](#7-hooks--die-datenschicht)
8. [Context — globaler Zustand](#8-context--globaler-zustand)
9. [Datenbanklogik & Supabase](#9-datenbanklogik--supabase)
10. [Nährwertberechnung](#10-nährwertberechnung)
11. [Deployment: GitHub → GitHub Actions → GitHub Pages](#11-deployment-github--github-actions--github-pages)
12. [Lokale Entwicklung](#12-lokale-entwicklung)

---

## 1. Was macht die App?

Der Ernährungsplaner ist eine **Single-Page Web-App** (läuft komplett im Browser) mit vier Hauptbereichen:

| Bereich | Funktion |
|---|---|
| **Lebensmittel** | Datenbank aller Zutaten mit Nährwerten (Kalorien, Eiweiß, Fett, …) |
| **Rezepte** | Gerichte aus Lebensmitteln zusammenstellen, Nährwerte werden automatisch berechnet |
| **Wochenplan** | Rezepte auf Wochentage und Mahlzeiten (Frühstück, Mittag, Abend, Snack) planen |
| **Einkaufsliste** | Automatisch aus dem Wochenplan generiert, nach Supermarkt-Kategorien sortiert |

Die App unterstützt mehrere Benutzerprofile mit individuellem PIN-Schutz und persönlichen Nährstoffzielen.

---

## 2. Der Tech-Stack — womit ist das gebaut?

### React
**Was ist das?** React ist eine JavaScript-Bibliothek von Meta (Facebook) um Benutzeroberflächen zu bauen. Das Grundprinzip: Die UI besteht aus kleinen, wiederverwendbaren **Komponenten** (z.B. ein Button, eine Karte, ein Modal). Jede Komponente ist eine JavaScript-Funktion, die HTML zurückgibt (als JSX — eine Mischung aus JS und HTML-Syntax).

**Warum React?** Wenn sich Daten ändern (z.B. ein neues Rezept wird gespeichert), aktualisiert React automatisch nur die betroffenen Teile der Seite — ohne dass die ganze Seite neu geladen werden muss.

### Vite
**Was ist das?** Vite ist ein Build-Tool. Es übersetzt den modernen Code (JSX, ES-Module, Tailwind-Klassen) in normales JavaScript und CSS, das jeder Browser versteht. Im Entwicklungsmodus startet es einen lokalen Server (`localhost:5173`) mit Hot-Reload — Änderungen im Code sind sofort im Browser sichtbar.

**Warum Vite?** Es ist deutlich schneller als ältere Tools wie Webpack, besonders beim Start und beim Speichern von Dateien.

### Tailwind CSS
**Was ist das?** Ein CSS-Framework, bei dem man Styles direkt als Klassen im HTML schreibt — statt separate CSS-Dateien. Zum Beispiel: `className="text-sm font-bold text-gray-800 mt-4"` bedeutet: kleiner Text, fett, dunkelgrau, Abstand oben.

**Warum Tailwind?** Kein Hin-und-Her zwischen HTML und CSS-Dateien. Die Styles sieht man direkt am Element. Tailwind baut außerdem beim Kompilieren nur die wirklich verwendeten Klassen ein — die finale CSS-Datei ist deshalb sehr klein.

### Supabase
**Was ist das?** Supabase ist ein "Backend as a Service" — eine fertige Serverinfrastruktur, die man nicht selbst aufbauen muss. Es stellt zur Verfügung:
- Eine **PostgreSQL-Datenbank** (relationale Datenbank, ähnlich wie MySQL)
- Eine **REST-API**, über die der Browser direkt mit der Datenbank reden kann
- Ein **JavaScript-SDK** (`@supabase/supabase-js`) mit dem man bequem Abfragen schreibt

**Warum Supabase?** Ohne Supabase bräuchte man einen eigenen Server (z.B. Node.js + Express) der zwischen Browser und Datenbank sitzt. Supabase übernimmt das komplett — man braucht keinen eigenen Backend-Code.

### GitHub Pages
**Was ist das?** GitHub kann statische Webseiten direkt aus einem Repository hosten. Nach dem Build (Vite erstellt einen `dist/`-Ordner mit reinen HTML/JS/CSS-Dateien) werden diese Dateien öffentlich zugänglich gemacht — kostenlos.

### GitHub Actions
**Was ist das?** Ein Automatisierungssystem direkt in GitHub. Man definiert in einer YAML-Datei was passieren soll wenn ein bestimmtes Ereignis eintritt (z.B. "push auf main"). In diesem Projekt: Bei jedem Push auf `main` wird automatisch `npm run build` ausgeführt und das Ergebnis auf GitHub Pages deployed.

---

## 3. Wie hängt alles zusammen?

```
Entwickler schreibt Code
        │
        ▼
  git push → GitHub (Quellcode)
        │
        ▼
  GitHub Actions startet automatisch
        │  (liest Secrets: Supabase-URL, PIN, …)
        │  (führt npm install + npm run build aus)
        ▼
  dist/-Ordner wird auf GitHub Pages deployed
        │
        ▼
  Nutzer öffnet die URL im Browser
        │
        ▼
  Browser lädt HTML/JS/CSS von GitHub Pages
        │
        ▼
  App läuft im Browser, spricht direkt mit Supabase
  (Daten lesen/schreiben per HTTPS-API)
```

**Wichtig zu verstehen:** Die App hat keinen eigenen Server der dauerhaft läuft. GitHub Pages liefert nur statische Dateien aus. Die gesamte Logik (Filtern, Berechnen, Anzeigen) passiert im Browser des Nutzers. Nur für die Datenpersistenz (Speichern und Laden) wird Supabase kontaktiert.

---

## 4. Projektstruktur

```
essensdatenbank/
│
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions: automatisches Deployment
│
├── src/                        # Gesamter Anwendungscode
│   │
│   ├── main.jsx                # Einstiegspunkt: rendert <App /> in den Browser
│   ├── App.jsx                 # Wurzel der App: Navigation, Login, Layout
│   │
│   ├── pages/                  # Die vier Hauptseiten
│   │   ├── FoodsPage.jsx       # Lebensmitteldatenbank
│   │   ├── RecipesPage.jsx     # Rezeptbuch
│   │   ├── PlannerPage.jsx     # Wochenplaner
│   │   └── ShoppingPage.jsx    # Einkaufsliste
│   │
│   ├── components/
│   │   ├── ui/                 # Wiederverwendbare UI-Bausteine
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx       # Benachrichtigungen ("Gespeichert!")
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── NutrientBadge.jsx  # Nährwert-Anzeige (Badges + Grid)
│   │   │   ├── CircleProgress.jsx # Kreisdiagramm für Nährstoffziele
│   │   │   ├── PersonSelect.jsx   # Login-Screen + Admin-Bereich
│   │   │   └── PinLock.jsx        # App-weite PIN-Sperre
│   │   │
│   │   ├── foods/
│   │   │   ├── FoodForm.jsx        # Formular: Lebensmittel anlegen/bearbeiten
│   │   │   └── BuiltinFoodSearch.jsx  # Suche in der eingebauten Lebensmitteldatenbank
│   │   │
│   │   └── recipes/
│   │       └── RecipeForm.jsx      # Formular: Rezept anlegen/bearbeiten
│   │
│   ├── hooks/                  # Datenzugriff-Logik (Supabase-Abfragen)
│   │   ├── useFoods.js         # Lebensmittel aus Context holen
│   │   ├── useRecipes.js       # Rezepte laden, erstellen, bearbeiten, löschen
│   │   ├── useMealPlan.js      # Wochenplan-Einträge für eine Woche laden
│   │   ├── usePersons.js       # Personen verwalten
│   │   └── useNutrientSettings.js  # Welche Nährwerte werden im Planer angezeigt?
│   │
│   ├── context/
│   │   ├── PersonContext.jsx   # Aktive Person global verfügbar machen
│   │   └── FoodsContext.jsx    # Lebensmittel global laden (einmalig für alle Seiten)
│   │
│   └── lib/
│       ├── supabase.js         # Supabase-Client initialisieren
│       └── nutrients.js        # Nährwert-Definitionen, Berechnungsfunktionen
│
├── .env                        # Lokale Geheimnisse (nicht im Git!)
├── .env.example                # Vorlage für .env (ist im Git)
├── vite.config.js              # Vite-Konfiguration (PWA, Build-Einstellungen)
├── tailwind.config.js          # Tailwind-Farben und -Einstellungen
└── package.json                # Abhängigkeiten und npm-Skripte
```

---

## 5. Die vier Seiten der App

### `FoodsPage.jsx` — Lebensmitteldatenbank

Zeigt alle gespeicherten Lebensmittel als scrollbare Liste. Jeder Eintrag kann aufgeklappt werden um alle Nährwerte zu sehen.

**Wichtige Funktionen:**
- **Suche** nach Name, **Filter** nach Kategorie (Gemüse, Fleisch, …)
- **Virtualisierung** (`@tanstack/react-virtual`): Nur die gerade sichtbaren Listeneinträge werden wirklich gerendert. Bei 500+ Lebensmitteln würde ohne das der Browser einfrieren.
- **Inline-Bearbeitung**: Klick auf ein Lebensmittel öffnet ein Formular im Modal
- **Import aus Standarddatenbank**: Über `BuiltinFoodSearch` kann man Lebensmittel aus einer vordefinierten Datenbank in die eigene Supabase-Datenbank kopieren

### `RecipesPage.jsx` — Rezeptbuch

Zeigt alle Rezepte als Kachelraster. Jede Kachel zeigt Name, Portionenanzahl, Tags und ausgewählte Nährwerte pro Portion.

**Wichtige Funktionen:**
- **Filter** nach Name, Tag, enthaltenen Zutaten, Favoriten
- **Favoriten** werden pro Person in `localStorage` gespeichert (nicht in der DB)
- **Konfigurierbarer Nährwert-Filter**: Über den "Nährstoffe"-Button können die angezeigten Nährwerte pro Kachel individuell eingestellt werden (Standard: 6 Makronährstoffe). Einstellung wird in `localStorage` gespeichert.
- **Detail-Ansicht**: Öffnet ein Modal mit Zutaten, Zubereitung und vollständigen Nährwerten

### `PlannerPage.jsx` — Wochenplaner

Zeigt eine Woche als 7-Spalten-Grid. Jede Spalte ist ein Tag, jede Zeile eine Mahlzeit (Frühstück, Mittag, Abend, Snack).

**Wichtige Funktionen:**
- **Woche vor/zurück** navigieren
- **Rezept hinzufügen**: Klick auf einen Slot öffnet eine Suche, das gewählte Rezept wird dem Tag zugeordnet
- **Portionen anpassen**: Pro Eintrag kann die Portionenzahl geändert werden — Nährwerte skalieren entsprechend
- **"1 Portion"-Toggle**: Schaltet die Nährwertanzeige so um, dass immer die Werte für genau 1 Portion gezeigt werden, egal wie viele Portionen im Plan stehen
- **Nährwertübersicht**: Pro Tag und für die ganze Woche werden Nährwertsummen angezeigt, optional als Balken gegen persönliche Tagesziele
- **Nährstoffziele**: Einstellbar pro Person, werden als Fortschrittsbalken/-kreise visualisiert

### `ShoppingPage.jsx` — Einkaufsliste

Generiert automatisch eine Einkaufsliste aus dem aktuellen Wochenplan.

**Wichtige Funktionen:**
- **Aggregation**: Gleiche Zutaten aus verschiedenen Rezepten werden zusammengefasst und die Gramm-Mengen addiert
- **Supermarkt-Kategorien**: Zutaten sind nach Lebensmittelkategorie gruppiert (Gemüse zuerst, dann Milchprodukte, usw.)
- **Manuell abhaken**: Erledigte Artikel können abgehakt werden (Zustand in `localStorage`)
- **Eigene Artikel**: Freie Eingabe zusätzlicher Artikel die nicht aus dem Wochenplan stammen
- **Export**: Liste als Text in die Zwischenablage kopieren

---

## 6. Komponenten

### UI-Bausteine

**`Modal.jsx`**
Ein wiederverwendbares Dialog-Fenster. Nimmt `isOpen`, `onClose`, `title` und `children` als Props. Sperrt den Seiten-Scroll solange es offen ist. Hintergrund-Klick schließt das Modal.

**`Toast.jsx`**
Kurze Benachrichtigungen ("Rezept gespeichert", "Fehler aufgetreten") die nach 4 Sekunden automatisch verschwinden. Nutzt React Context damit jede Komponente tief im Baum eine Benachrichtigung auslösen kann (`useToast()`).

**`NutrientBadge.jsx`**
Rendert Nährwerte als farbige Badges. Die Farbe hängt vom Nährstoff ab (Kalorien = orange, Eiweiß = blau, …). Nimmt optional `visibleKeys` — dann werden nur die gewünschten Nährwerte angezeigt.

**`CircleProgress.jsx`**
SVG-Kreisdiagramm für die Visualisierung von Nährstoffzielen. Zeigt wie viel Prozent des Tagesziels bereits erreicht wurde.

**`PersonSelect.jsx`**
Der Login-Screen der App. Zeigt alle angelegten Personen als auswählbare Kacheln. Personen mit PIN müssen diesen eingeben. Enthält auch den Admin-Bereich (eigener PIN) zum Verwalten von Personen.

**`PinLock.jsx`**
Optionaler App-weiter Sperrbildschirm. Wenn aktiviert, muss beim Öffnen der App ein PIN eingegeben werden — unabhängig vom Person-Profil.

### Formular-Komponenten

**`FoodForm.jsx`**
Formular zum Anlegen und Bearbeiten von Lebensmitteln. Enthält Felder für Name, Kategorie, alle ~20 Nährwerte sowie kategorische Felder (FODMAP, Glykämischer Index, Sorbitol). Zeigt standardmäßig nur die 6 Kernfelder, weitere können aufgeklappt werden.

**`RecipeForm.jsx`**
Formular für Rezepte. Zutaten werden per Suche hinzugefügt, die Grammangabe wird inline eingegeben. Nährwerte werden live beim Eingeben berechnet und angezeigt.

**`BuiltinFoodSearch.jsx`**
Sucht in der Supabase-Tabelle `builtin_foods` (eine vorgefüllte Referenzdatenbank). Gefundene Einträge können direkt in die eigene `foods`-Tabelle übernommen werden.

---

## 7. Hooks — die Datenschicht

In React sind **Hooks** Funktionen die mit `use` beginnen und besondere Fähigkeiten haben (Zustand speichern, Seiteneffekte auslösen, …). In diesem Projekt kapseln benutzerdefinierte Hooks die gesamte Datenbanklogik — die Seiten selbst wissen nichts von Supabase.

### Prinzip eines Hooks

```js
// Vereinfachtes Beispiel
export function useRecipes() {
  const [recipes, setRecipes] = useState([])   // lokaler Zustand im Browser

  useEffect(() => {
    // Wird einmalig beim ersten Anzeigen der Seite ausgeführt
    supabase.from('recipes').select('*').then(({ data }) => setRecipes(data))
  }, [])

  return { recipes }  // Seite bekommt die Daten
}
```

Die Seite ruft einfach `const { recipes } = useRecipes()` auf — kein SQL, kein fetch(), kein Loading-State selbst verwalten.

### `usePersons.js`
Lädt alle Personen aus der `persons`-Tabelle. Stellt Funktionen bereit: `createPerson`, `updatePerson`, `updateGoals` (Nährstoffziele), `deletePerson`. Wird nur in `App.jsx` verwendet, da Personen-Management global ist.

### `useFoods.js`
Dünne Wrapper-Funktion die den `FoodsContext` ausliest (siehe [Context](#8-context--globaler-zustand)). Lebensmittel werden nur einmal geladen und dann geteilt.

### `useRecipes.js`
Lädt alle Rezepte **inklusive ihrer Zutaten und deren Nährwerte** in einem einzigen Supabase-Query mit verschachteltem Select:
```js
supabase.from('recipes').select(`
  *,
  recipe_ingredients (
    id, amount_grams, food_id,
    foods (id, name, nutrients, category)
  )
`)
```
Das ist ein sogenannter **Join** — Supabase verbindet automatisch die drei Tabellen `recipes`, `recipe_ingredients` und `foods` anhand ihrer Fremdschlüssel.

Beim Speichern eines Rezepts passieren zwei Schritte:
1. Rezept in `recipes` einfügen
2. Alle Zutaten in `recipe_ingredients` einfügen (mit der neuen `recipe_id`)

Beim Bearbeiten: Alle alten Zutaten werden gelöscht und neu eingefügt (einfacher als einzelne Zeilen zu vergleichen).

### `useMealPlan.js`
Lädt alle Wochenplan-Einträge für eine bestimmte Woche und Person. Der Query filtert nach Datumsbereich (`gte` = "greater than or equal", `lte` = "less than or equal") und lädt ebenfalls verschachtelt Rezept → Zutaten → Nährwerte mit — damit die Nährwertberechnung ohne weitere Datenbankabfragen möglich ist.

### `useNutrientSettings.js`
Kein Supabase-Zugriff — speichert nur in `localStorage` welche Nährwerte im Wochenplaner in der Tages-/Wochenübersicht angezeigt werden sollen.

---

## 8. Context — globaler Zustand

React-Props fließen immer von oben nach unten (Eltern → Kind). Wenn eine tief verschachtelte Komponente Daten braucht, müsste man sie durch viele Zwischenschichten "durchreichen" — das nennt sich **Prop Drilling** und wird schnell unübersichtlich.

**React Context** löst das: Daten werden einmal in einen "Container" gelegt, und jede Komponente im Baum darunter kann direkt darauf zugreifen.

### `PersonContext.jsx`
Macht die aktive Person (das eingeloggte Profil) überall verfügbar. Jede Seite und Komponente kann mit `useActivePerson()` auf `activePerson`, `logout` und `updateGoals` zugreifen — ohne dass `App.jsx` diese Props durch alle Ebenen weitergeben muss.

### `FoodsContext.jsx`
Lebensmittel sind auf allen vier Seiten nötig (Rezepte brauchen sie, der Planer braucht sie indirekt, die Einkaufsliste auch). Ohne Context würde jede Seite die gleichen 500+ Lebensmittel einzeln aus der Datenbank laden — ineffizient.

`FoodsProvider` lädt alle Lebensmittel einmalig beim App-Start und stellt sie per Context bereit. Die Paginierung (`PAGE = 1000`) stellt sicher, dass auch bei sehr vielen Einträgen alle Seiten geladen werden.

```
App.jsx
└── PersonContext.Provider        ← aktive Person für alle verfügbar
    └── FoodsProvider             ← Lebensmittel einmalig laden
        └── ToastProvider         ← Benachrichtigungen für alle
            ├── FoodsPage         ← greift auf FoodsContext zu
            ├── RecipesPage       ← greift auf FoodsContext zu
            ├── PlannerPage       ← greift auf FoodsContext zu
            └── ShoppingPage      ← greift auf PersonContext zu
```

---

## 9. Datenbanklogik & Supabase

### Was ist eine relationale Datenbank?

Daten werden in **Tabellen** gespeichert (wie Excel-Tabellen). Tabellen sind durch **Fremdschlüssel** miteinander verbunden. Zum Beispiel: Jede Zeile in `recipe_ingredients` enthält eine `recipe_id` (auf welches Rezept gehört diese Zutat?) und eine `food_id` (welches Lebensmittel ist es?).

### Tabellen-Übersicht

**`persons`** — Benutzerprofile
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID | Eindeutige ID (automatisch generiert) |
| `name` | text | Anzeigename |
| `color` | text | Profilfarbe (Hex-Code) |
| `pin` | text | PIN-Code (optional) |
| `nutrient_goals` | jsonb | Nährstoffziele als JSON-Objekt `{"calories": 2000, "protein": 150, …}` |

**`foods`** — Lebensmitteldatenbank
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID | Eindeutige ID |
| `name` | text | Name des Lebensmittels |
| `category` | text | Kategorie (Gemüse, Fleisch, …) |
| `nutrients` | jsonb | Alle Nährwerte als JSON `{"calories": 89, "protein": 1.1, …}` — immer pro 100g |
| `glycemic_index` | text | low / high (optional) |
| `fodmap` | text | low / medium / high (optional) |
| `updated_at` | timestamp | Letztes Update |

**`builtin_foods`** — Vorgegebene Referenzdatenbank (read-only)
Gleiche Struktur wie `foods`. Nutzer können Einträge von hier in ihre eigene `foods`-Tabelle kopieren.

**`recipes`** — Rezepte
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID | Eindeutige ID |
| `name` | text | Rezeptname |
| `servings` | integer | Anzahl Portionen |
| `description` | text | Kurzbeschreibung (optional) |
| `instructions` | text | Zubereitungsschritte (optional) |
| `tags` | text[] | Array von Tags z.B. `["vegan", "schnell"]` |

**`recipe_ingredients`** — Zutaten eines Rezepts
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID | Eindeutige ID |
| `recipe_id` | UUID | Fremdschlüssel → `recipes.id` |
| `food_id` | UUID | Fremdschlüssel → `foods.id` |
| `amount_grams` | numeric | Menge in Gramm |

**`meal_plan_entries`** — Wochenplan-Einträge
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | UUID | Eindeutige ID |
| `person_id` | UUID | Fremdschlüssel → `persons.id` |
| `recipe_id` | UUID | Fremdschlüssel → `recipes.id` |
| `date` | date | Datum des Eintrags |
| `meal_type` | text | breakfast / lunch / dinner / snack |
| `servings` | numeric | Geplante Portionen |

### Beziehungsdiagramm

```
persons ──────────────────────── meal_plan_entries
                                        │
                                        │ recipe_id
                                        ▼
                  recipe_ingredients ── recipes
                        │
                        │ food_id
                        ▼
                       foods
```

### Wie kommuniziert die App mit Supabase?

Supabase stellt für jedes Projekt eine HTTPS-API bereit. Das JavaScript-SDK übersetzt Methodenaufrufe in HTTP-Anfragen:

```js
// Das schreibt man im Code:
supabase.from('recipes').select('*').order('name')

// Supabase schickt intern eine Anfrage an:
// GET https://[projekt-id].supabase.co/rest/v1/recipes?order=name
// mit dem API-Key im Header
```

Der **Anon Key** (in `.env` als `VITE_SUPABASE_ANON_KEY`) ist ein öffentlicher Schlüssel der nur lesenden und schreibenden Zugriff auf explizit freigegebene Tabellen erlaubt. Er ist kein Passwort und kann im Browser-Code stehen.

### Was ist JSONB?

`jsonb` ist ein PostgreSQL-Datentyp für strukturierte JSON-Daten. Statt für jeden Nährstoff eine eigene Tabellenspalte anzulegen, liegen alle Nährwerte in einem einzigen JSON-Objekt in der `nutrients`-Spalte. Das macht das Schema flexibler — neue Nährwerte können hinzugefügt werden ohne die Datenbankstruktur zu ändern.

---

## 10. Nährwertberechnung

Alle Nährwerte in der Datenbank sind **pro 100g** gespeichert. Die Berechnungen in `src/lib/nutrients.js`:

### Für ein einzelnes Lebensmittel mit bestimmter Menge

```js
function calculateNutrients(nutrients, grams) {
  const factor = grams / 100
  // Wenn 100g Hähnchen 25g Eiweiß haben,
  // dann haben 200g → factor=2 → 50g Eiweiß
  return { protein: nutrients.protein * factor, … }
}
```

### Für ein Rezept (pro Portion)

```js
function computeRecipeNutrients(recipe) {
  // 1. Nährwerte jeder Zutat berechnen (nach Grammangabe)
  const parts = recipe.recipe_ingredients.map(i =>
    calculateNutrients(i.foods.nutrients, i.amount_grams)
  )
  // 2. Alle Zutaten addieren
  const total = sumNutrients(parts)
  // 3. Durch Portionenzahl teilen → Werte pro Portion
  return { calories: total.calories / recipe.servings, … }
}
```

### Im Wochenplaner (mit Portionsanzahl)

Wenn ein Rezept für 4 Portionen geplant wird aber nur 2 Personen essen:

```js
const entryServings = parseFloat(entry.servings) || 1
// Nährwerte pro Rezept-Portion × geplante Portionen
result[k] = (total[k] / recipeServings) * entryServings
```

Der **"1 Portion"-Toggle** setzt `entryServings` immer auf `1` — nützlich um zu sehen was man selbst isst, egal wie viele Portionen insgesamt geplant sind.

### Nährstoff-Definitionen

In `NUTRIENT_FIELDS` (nutrients.js) sind alle 21 unterstützten Nährstoffe definiert mit Key, deutschem Label, Einheit und Farbe für die Darstellung. `NUTRIENT_FIELDS_CORE` enthält die 6 Standard-Makronährstoffe die standardmäßig angezeigt werden.

---

## 11. Deployment: GitHub → GitHub Actions → GitHub Pages

### Der Ablauf Schritt für Schritt

1. **Entwickler pusht Code** auf den `main`-Branch
2. **GitHub Actions** erkennt den Push und startet den Workflow (`.github/workflows/deploy.yml`)
3. Der Workflow läuft auf einem temporären Ubuntu-Server bei GitHub:
   ```yaml
   - uses: actions/checkout@v4          # Code herunterladen
   - uses: actions/setup-node@v4        # Node.js installieren
   - run: npm install                   # Abhängigkeiten installieren
   - run: npm run build                 # Vite baut die App (→ dist/)
     env:
       VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
       VITE_ADMIN_PIN: ${{ secrets.VITE_ADMIN_PIN }}
       # … weitere Secrets
   ```
4. **Vite kompiliert** JSX → JavaScript, Tailwind-Klassen → CSS, alles landet im `dist/`-Ordner als reine HTML/JS/CSS-Dateien
5. Der `dist/`-Ordner wird auf den **`gh-pages`-Branch** gepusht
6. **GitHub Pages** liefert diesen Branch öffentlich aus

### Was sind GitHub Secrets?

Umgebungsvariablen (wie Supabase-URL, PIN) dürfen nicht im Quellcode stehen (öffentlich sichtbar). GitHub Secrets sind verschlüsselt gespeicherte Werte die nur im Workflow verfügbar sind — im Build-Prozess werden sie als Umgebungsvariablen eingesetzt.

Vite liest diese Variablen beim Build aus (`import.meta.env.VITE_...`) und baut sie direkt in den JavaScript-Code ein. Das heißt: Der Wert ist im fertigen Bundle vorhanden, aber nicht im Quellcode auf GitHub.

---

## 12. Lokale Entwicklung

### Voraussetzungen
- Node.js 18 oder neuer
- Ein Supabase-Projekt mit den oben beschriebenen Tabellen

### Setup

```bash
# 1. Repository klonen
git clone https://github.com/Julian3141/essensdatenbank.git
cd essensdatenbank

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen anlegen
cp .env.example .env
# .env mit eigenen Werten befüllen (Supabase URL, Key, PINs)

# 4. Entwicklungsserver starten
npm run dev
# → App läuft auf http://localhost:5173
```

### Nützliche Befehle

```bash
npm run dev      # Entwicklungsserver starten (mit Hot-Reload)
npm run build    # Produktions-Build erstellen (→ dist/)
npm run preview  # Fertig gebaute App lokal testen
```

### .env Datei

```env
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key
VITE_ADMIN_PIN=1234
VITE_APP_PIN=1234
```

Die `.env`-Datei ist in `.gitignore` eingetragen und wird **nie** in das Repository gepusht.
