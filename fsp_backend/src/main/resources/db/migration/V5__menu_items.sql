-- V5: "Our usual orders": the shared menu of foods we always get.
CREATE TABLE IF NOT EXISTS menu_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(60)  NOT NULL,
  doodle      varchar(24)  NOT NULL DEFAULT 'utensils',
  loved_by    varchar(4)   NOT NULL DEFAULT 'both' CHECK (loved_by IN ('her','him','both')),
  place       varchar(80),
  price_php   integer      CHECK (price_php IS NULL OR (price_php >= 0 AND price_php <= 99999)),
  note        varchar(200),
  sort_order  integer      NOT NULL,
  version     bigint       NOT NULL DEFAULT 0,
  created_by  bigint,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort ON menu_items (sort_order);

INSERT INTO menu_items (name, doodle, loved_by, place, sort_order)
SELECT v.name, v.doodle, v.loved_by, v.place, v.sort_order FROM (VALUES
  ('matcha',                          'matcha',  'her',  NULL,       1000),
  ('cookies & cream',                 'cookie',  'him',  NULL,       2000),
  ('Yowell',                          'yogurt',  'both', NULL,       3000),
  ('yogurt + fries',                  'fries',   'both', NULL,       4000),
  ('churros',                         'churro',  'both', NULL,       5000),
  ('lasagna',                         'lasagna', 'both', NULL,       6000),
  ('Angel''s spinach pizza',          'pizza',   'both', 'Angel''s', 7000),
  ('Alcapone & Boston creme donuts',  'donut',   'both', NULL,       8000),
  ('lechon pares',                    'lechon',  'both', NULL,       9000),
  ('Mr. B bulalo',                    'bowl',    'both', NULL,      10000)
) AS v(name, doodle, loved_by, place, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM menu_items);
