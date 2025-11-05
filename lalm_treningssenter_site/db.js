const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'lalm_treningssenter.sqlite'));

// Init schema
db.exec(`
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | active | canceled | failed
  stripe_session_id TEXT,
  stripe_customer_id TEXT,
  consent BOOLEAN NOT NULL DEFAULT 0,
  consent_at TEXT,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS members_updated_at
AFTER UPDATE ON members
FOR EACH ROW
BEGIN
  UPDATE members SET updated_at = datetime('now') WHERE id = OLD.id;
END;
`);

module.exports = db;