-- V7: bouquets are small JSON "recipes"; the picture is drawn by the app (SVG) and exported to PNG on demand.
CREATE TABLE IF NOT EXISTS bouquets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       varchar(40)  NOT NULL,
  recipe      jsonb        NOT NULL,        -- { v, wrap, ribbon, items[], card }, max ~6 KB
  version     bigint       NOT NULL DEFAULT 0,
  created_by  bigint       NOT NULL,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT bouquets_recipe_size CHECK (pg_column_size(recipe) <= 8192)
);
CREATE INDEX IF NOT EXISTS idx_bouquets_created ON bouquets (created_at DESC);
