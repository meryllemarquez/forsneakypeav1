-- V6: decision wheels and their spin history. Choices are a small JSON array (no table per choice).
CREATE TABLE IF NOT EXISTS wheels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(40) NOT NULL,
  choices     jsonb       NOT NULL DEFAULT '[]'::jsonb,   -- [{ "id":"a1b2c3d4", "label":"Lasagna", "color":"sea", "doodle":"lasagna" }]
  version     bigint      NOT NULL DEFAULT 0,
  created_by  bigint,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wheels_choices_array CHECK (jsonb_typeof(choices) = 'array' AND jsonb_array_length(choices) BETWEEN 2 AND 12)
);
CREATE TABLE IF NOT EXISTS wheel_spins (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id     uuid        NOT NULL REFERENCES wheels(id) ON DELETE CASCADE,
  choice_id    varchar(16) NOT NULL,
  label        varchar(40) NOT NULL,       -- copied, so history survives edits/removals
  doodle       varchar(24),
  accepted     boolean     NOT NULL DEFAULT false,
  spun_by      bigint,
  spun_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_wheel_time ON wheel_spins (wheel_id, spun_at DESC);
