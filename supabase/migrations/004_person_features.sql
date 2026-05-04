ALTER TABLE foods ADD COLUMN IF NOT EXISTS glycemic_index TEXT CHECK (glycemic_index IN ('low', 'medium', 'high'));
ALTER TABLE foods ADD COLUMN IF NOT EXISTS fodmap TEXT CHECK (fodmap IN ('low', 'medium', 'high'));
ALTER TABLE foods ADD COLUMN IF NOT EXISTS sorbitol TEXT CHECK (sorbitol IN ('low', 'medium', 'high'));

ALTER TABLE persons ADD COLUMN IF NOT EXISTS pin TEXT;
