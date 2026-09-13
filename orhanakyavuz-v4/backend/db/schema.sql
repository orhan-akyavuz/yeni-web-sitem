-- orhanakyavuz.com — SQLite şeması
-- node:sqlite (Node.js 22+ yerleşik modülü) ile çalışır, harici native
-- bağımlılık (better-sqlite3 vb.) gerektirmez.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  auth_user_id TEXT UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Matematikçi',
  role       TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS weekly_problems (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  problem_content TEXT NOT NULL,
  solution_content TEXT,
  topic           TEXT NOT NULL,
  grade_level     TEXT NOT NULL,
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  answer_key      TEXT NOT NULL,
  published_at    TEXT NOT NULL,
  ends_at         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by      INTEGER REFERENCES users(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id      INTEGER NOT NULL REFERENCES weekly_problems(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer_text     TEXT NOT NULL,
  solution_text   TEXT,
  is_correct      INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  has_explanation INTEGER NOT NULL DEFAULT 0 CHECK (has_explanation IN (0, 1)),
  score           INTEGER NOT NULL DEFAULT 0,
  submitted_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS score_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_id INTEGER REFERENCES submissions(id) ON DELETE SET NULL,
  event_type    TEXT NOT NULL,
  points        INTEGER NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS streaks (
  user_id                 INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak          INTEGER NOT NULL DEFAULT 0,
  longest_streak           INTEGER NOT NULL DEFAULT 0,
  last_participation_week  TEXT,
  updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS badges (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  icon          TEXT NOT NULL,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL,
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS problem_highlights (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id    INTEGER NOT NULL REFERENCES weekly_problems(id) ON DELETE CASCADE,
  submission_id INTEGER NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
  highlight_type TEXT NOT NULL DEFAULT 'weekly_solution',
  approved_by   INTEGER NOT NULL REFERENCES users(id),
  approved_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  subtitle      TEXT NOT NULL,
  excerpt       TEXT NOT NULL,
  body_html     TEXT NOT NULL,
  category_id   INTEGER NOT NULL REFERENCES categories(id),
  author_name   TEXT NOT NULL DEFAULT 'Orhan Akyavuz',
  cover_image   TEXT NOT NULL,
  published_at  TEXT NOT NULL,
  updated_at    TEXT,
  read_minutes  INTEGER NOT NULL,
  view_count    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id     INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_user ON submissions(problem_id, user_id);
CREATE INDEX IF NOT EXISTS idx_score_events_user ON score_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_highlights_problem ON problem_highlights(problem_id);
