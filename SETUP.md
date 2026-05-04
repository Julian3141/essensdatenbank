# Einrichtungsanleitung

## 1. Supabase einrichten

### Schritt 1: Supabase-Konto erstellen
1. Gehe auf [supabase.com](https://supabase.com) und klicke "Start your project"
2. Registriere dich oder melde dich an
3. Klicke "New Project"
4. Wähle einen Namen (z.B. "Essensdatenbank") und ein Passwort
5. Region: Wähle "West EU (Ireland)" für beste Geschwindigkeit in Deutschland
6. Klicke "Create new project" – das dauert ca. 1-2 Minuten

### Schritt 2: Datenbank einrichten
1. Klicke im linken Menü auf "SQL Editor"
2. Klicke auf "New query"
3. Öffne die Datei `supabase/migrations/001_initial_schema.sql` in einem Texteditor
4. Kopiere den gesamten Inhalt und füge ihn in den SQL Editor ein
5. Klicke "Run" (oder Strg+Enter)
6. Du solltest "Success" sehen

### Schritt 3: API-Schlüssel holen
1. Klicke im linken Menü auf "Project Settings" (Zahnrad)
2. Klicke auf "API"
3. Kopiere die "Project URL" (sieht aus wie https://xxxx.supabase.co)
4. Kopiere den "anon public" Key

### Schritt 4: .env Datei anlegen
1. Öffne den Projektordner
2. Erstelle eine neue Datei namens `.env` (genau so, mit Punkt vorne!)
3. Füge folgendes ein und ersetze die Werte:

```
VITE_SUPABASE_URL=https://deine-projekt-id.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key-hier
```

---

## 2. App lokal starten

Voraussetzung: [Node.js](https://nodejs.org) muss installiert sein (Version 18 oder neuer)

```bash
# Abhängigkeiten installieren (einmalig)
npm install

# App starten
npm run dev
```

Die App ist dann unter http://localhost:5173 erreichbar.

---

## 3. Auf GitHub Pages deployen

### Schritt 1: GitHub Repository erstellen
1. Gehe auf [github.com](https://github.com) und melde dich an
2. Klicke das "+" oben rechts → "New repository"
3. Name: z.B. "essensdatenbank"
4. Sichtbarkeit: Public (für kostenlose GitHub Pages)
5. Klicke "Create repository"

### Schritt 2: Code hochladen
Im Terminal (im Projektordner):

```bash
git init
git add .
git commit -m "Erstversion"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/essensdatenbank.git
git push -u origin main
```

### Schritt 3: GitHub Secrets eintragen (wichtig für Sicherheit!)
1. Gehe zu deinem Repository auf GitHub
2. Klicke "Settings" → "Secrets and variables" → "Actions"
3. Klicke "New repository secret"
4. Name: `VITE_SUPABASE_URL`, Value: deine Supabase URL
5. Nochmal: Name: `VITE_SUPABASE_ANON_KEY`, Value: dein Anon Key

### Schritt 4: GitHub Actions Workflow anlegen
Erstelle die Datei `.github/workflows/deploy.yml` mit folgendem Inhalt:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Schritt 5: GitHub Pages aktivieren
1. Gehe zu "Settings" → "Pages"
2. Branch: "gh-pages"
3. Klicke "Save"

Nach ca. 2-3 Minuten ist die App unter `https://DEIN-USERNAME.github.io/essensdatenbank` erreichbar!

---

## Alle Freunde einladen
Schicke einfach die GitHub Pages URL. Da alle dieselbe Supabase-Datenbank nutzen, sehen alle dieselben Lebensmittel, Rezepte und können gemeinsam planen.
