-- V4: remember each person's theme choice across devices (light | dark | system).
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_pref varchar(8) NOT NULL DEFAULT 'system';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_theme_pref_chk') THEN
    ALTER TABLE users ADD CONSTRAINT users_theme_pref_chk CHECK (theme_pref IN ('light', 'dark', 'system'));
  END IF;
END $$;
