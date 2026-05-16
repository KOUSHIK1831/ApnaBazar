-- Add banner_url and theme_color to sellers
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS theme_color text DEFAULT '#8B5CF6';
