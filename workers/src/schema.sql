-- Epic Studio D1 Schema
-- Apply with: wrangler d1 execute epic-studio-db --file=src/schema.sql

CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  event_info  TEXT NOT NULL DEFAULT '{}',  -- JSON: { venue, date, theme, client }
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generations (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_type    TEXT NOT NULL,               -- e.g. "banner", "backdrop", "signage"
  prompt       TEXT NOT NULL,
  image_r2_key TEXT,                        -- R2 object key, null until generated
  size_spec    TEXT NOT NULL DEFAULT '{}',  -- JSON: { width_mm, height_mm, dpi, orientation }
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | generating | done | error
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reference_images (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_url  TEXT NOT NULL,
  style_tags  TEXT NOT NULL DEFAULT '[]',   -- JSON array of tags
  selected    INTEGER NOT NULL DEFAULT 0,   -- 0 = false, 1 = true
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generations_project_id ON generations(project_id);
CREATE INDEX IF NOT EXISTS idx_reference_images_project_id ON reference_images(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
