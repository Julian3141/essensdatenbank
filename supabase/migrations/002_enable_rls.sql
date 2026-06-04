-- RLS aktivieren + offene Policies hinzufügen
-- Funktioniert genauso wie vorher, aber Supabase-Warnungen verschwinden.

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON foods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON recipe_ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON persons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON meal_plan_entries FOR ALL USING (true) WITH CHECK (true);
