-- Lebensmitteldatenbank
CREATE TABLE IF NOT EXISTS foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Sonstiges',
  nutrients JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- nutrients JSONB structure:
-- { "calories": 100, "protein": 10, "carbs": 20, "fat": 5, "fiber": 2, "sugar": 3, ... }
-- Alle Werte pro 100g

-- Rezepte
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  servings INTEGER NOT NULL DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zutaten eines Rezepts
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
  amount_grams NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personen
CREATE TABLE IF NOT EXISTS persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#22c55e',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wochenplan-Einträge
CREATE TABLE IF NOT EXISTS meal_plan_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  servings NUMERIC(4, 2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_food_id ON recipe_ingredients(food_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_entries_person_id ON meal_plan_entries(person_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_entries_date ON meal_plan_entries(date);

-- Row Level Security ausschalten (alle teilen dieselben Daten)
ALTER TABLE foods DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE persons DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_entries DISABLE ROW LEVEL SECURITY;

-- Beispiel-Lebensmittel einfügen
INSERT INTO foods (name, category, nutrients) VALUES
  ('Haferflocken', 'Getreide', '{"calories": 370, "protein": 13, "carbs": 59, "fat": 7, "fiber": 10, "sugar": 1}'),
  ('Vollmilch (3,5%)', 'Milchprodukte', '{"calories": 61, "protein": 3.3, "carbs": 4.7, "fat": 3.5, "fiber": 0, "sugar": 4.7}'),
  ('Banane', 'Obst', '{"calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3, "fiber": 2.6, "sugar": 12}'),
  ('Hühnerbrust (roh)', 'Fleisch & Fisch', '{"calories": 109, "protein": 23, "carbs": 0, "fat": 1.2, "fiber": 0, "sugar": 0}'),
  ('Reis (roh)', 'Getreide', '{"calories": 356, "protein": 7, "carbs": 78, "fat": 0.7, "fiber": 1, "sugar": 0}'),
  ('Brokkoli', 'Gemüse', '{"calories": 35, "protein": 2.4, "carbs": 6, "fat": 0.4, "fiber": 2.6, "sugar": 1.5}'),
  ('Olivenöl', 'Fette & Öle', '{"calories": 884, "protein": 0, "carbs": 0, "fat": 100, "fiber": 0, "sugar": 0}'),
  ('Ei (Hühnerei)', 'Milchprodukte', '{"calories": 143, "protein": 13, "carbs": 0.7, "fat": 10, "fiber": 0, "sugar": 0.4}'),
  ('Volllkornbrot', 'Getreide', '{"calories": 230, "protein": 7, "carbs": 41, "fat": 3, "fiber": 7, "sugar": 3}'),
  ('Magerquark', 'Milchprodukte', '{"calories": 67, "protein": 12, "carbs": 4, "fat": 0.3, "fiber": 0, "sugar": 4}')
ON CONFLICT DO NOTHING;

-- Beispiel-Person einfügen
INSERT INTO persons (name, color) VALUES
  ('Person 1', '#22c55e')
ON CONFLICT DO NOTHING;
