-- V8: the little ones. One small row per pet; stats are computed from the snapshot when read.
CREATE TABLE IF NOT EXISTS pets (
  id               varchar(16) PRIMARY KEY,
  name             varchar(24) NOT NULL,
  kind             varchar(5)  NOT NULL CHECK (kind IN ('dog','plush')),
  fullness_base    smallint    NOT NULL DEFAULT 70 CHECK (fullness_base BETWEEN 0 AND 100),
  energy_base      smallint    NOT NULL DEFAULT 80 CHECK (energy_base BETWEEN 0 AND 100),
  joy_base         smallint    NOT NULL DEFAULT 70 CHECK (joy_base BETWEEN 0 AND 100),
  snapshot_at      timestamptz NOT NULL DEFAULT now(),
  fed_count        integer     NOT NULL DEFAULT 0,
  play_count       integer     NOT NULL DEFAULT 0,
  hug_count        integer     NOT NULL DEFAULT 0,
  walk_count       integer     NOT NULL DEFAULT 0,
  last_action      varchar(5)  CHECK (last_action IN ('feed','play','hug','walk')),
  last_action_by   bigint,
  last_action_at   timestamptz,
  sort_order       smallint    NOT NULL DEFAULT 0
);
INSERT INTO pets (id, name, kind, sort_order) VALUES
  ('zizi','Zizi','dog',1), ('loafie','Loafie','dog',2), ('zoey','Zoey','dog',3),
  ('tato','Tato','dog',4), ('cooper','Cooper','dog',5),
  ('junebug','Junebug','plush',6), ('chimken','Chimken','plush',7),
  ('rorry','Rorry','plush',8), ('skyrie','Skyrie','plush',9)
ON CONFLICT (id) DO NOTHING;
