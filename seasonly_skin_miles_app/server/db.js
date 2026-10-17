'use strict';
// SQLite through Node's built-in driver: no native build step, one file on disk.
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first TEXT NOT NULL,
  last TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE COLLATE NOCASE,
  phone TEXT UNIQUE,
  verified INTEGER NOT NULL DEFAULT 0,
  -- Each contact detail is trusted only once a code sent to it was entered.
  email_verified INTEGER NOT NULL DEFAULT 0,
  phone_verified INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  state TEXT NOT NULL,
  avatar_id TEXT,
  address TEXT,
  gender TEXT NOT NULL DEFAULT 'undisclosed',
  lang TEXT NOT NULL DEFAULT 'fr',
  created_at INTEGER NOT NULL,
  last_login INTEGER
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS otps (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  purpose TEXT NOT NULL,
  sms_hash TEXT,
  email_hash TEXT,
  channel TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  mime TEXT NOT NULL,
  private INTEGER NOT NULL,
  iv BLOB,
  tag BLOB,
  data BLOB NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS push_subs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  topic TEXT,
  ref TEXT,
  rating INTEGER,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  reply TEXT,
  replied_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS contests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  period TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  prize_kind TEXT NOT NULL,
  prize_ref TEXT NOT NULL,
  prize_label TEXT NOT NULL,
  winners INTEGER NOT NULL DEFAULT 1,
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  status TEXT NOT NULL,
  winner_ids TEXT,
  title_en TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS contest_entries (
  contest_id INTEGER NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (contest_id, user_id)
);
CREATE TABLE IF NOT EXISTS gifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  ref TEXT NOT NULL,
  label TEXT NOT NULL,
  source TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL,
  code TEXT,
  address TEXT,
  created_at INTEGER NOT NULL,
  shipped_at INTEGER
);
CREATE TABLE IF NOT EXISTS collabs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner TEXT NOT NULL,
  kind TEXT NOT NULL,
  data TEXT NOT NULL,
  image_id TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS collab_regs (
  collab_id INTEGER NOT NULL REFERENCES collabs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (collab_id, user_id)
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subs(user_id);
`;

function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  // Columns added after the first release.
  const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!cols.includes('address')) db.exec('ALTER TABLE users ADD COLUMN address TEXT');
  if (!cols.includes('gender')) db.exec("ALTER TABLE users ADD COLUMN gender TEXT NOT NULL DEFAULT 'undisclosed'");
  if (!cols.includes('lang')) db.exec("ALTER TABLE users ADD COLUMN lang TEXT NOT NULL DEFAULT 'fr'");
  const ccols = db.prepare('PRAGMA table_info(contests)').all().map((c) => c.name);
  if (!ccols.includes('title_en')) db.exec("ALTER TABLE contests ADD COLUMN title_en TEXT NOT NULL DEFAULT ''");
  if (!ccols.includes('description_en')) db.exec("ALTER TABLE contests ADD COLUMN description_en TEXT NOT NULL DEFAULT ''");

  const q = (sql) => db.prepare(sql);
  db.tx = (fn) => {
    db.exec('BEGIN IMMEDIATE');
    try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
  };
  db.getSetting = (key, fallback = null) => {
    const row = q('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : fallback;
  };
  db.setSetting = (key, value) => {
    q('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(value));
  };
  return db;
}

module.exports = { openDb };
