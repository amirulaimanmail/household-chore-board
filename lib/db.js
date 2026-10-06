import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

// OBJECTIVE: Working with database connections
//
// This is the ONLY file that's different from Module 9's app — every
// route, page, and component that imports from here keeps working
// unchanged. Module 9 used a plain in-memory array; this connects to
// a real SQLite database instead. The connection itself is one line:
const DB_PATH = path.join(process.cwd(), "data", "app.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// OBJECTIVE: Implementing CRUD operations
db.exec(`
  CREATE TABLE IF NOT EXISTS chores (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    chore_name TEXT NOT NULL,
    date TEXT NOT NULL
  )
`);

function rowToChore(row) {
  return { id: row.id, choreName: row.chore_name, date: row.date };
}

// Read
export function getAllChores() {
  const rows = db.prepare("SELECT * FROM chores ORDER BY id").all();
  return rows.map(rowToChore);
}

// Create
export function createChore(choreName, date) {
  const info = db
    .prepare("INSERT INTO chores (chore_name, date) VALUES (?, ?)")
    .run(choreName, date);
  const row = db
    .prepare("SELECT * FROM chores WHERE id = ?")
    .get(info.lastInsertRowid);
  return rowToChore(row);
}

// Update — the CRUD operation Module 9's app didn't have yet
export function updateChore(id, choreName, date) {
  const existing = db.prepare("SELECT * FROM chores WHERE id = ?").get(id);
  if (!existing) return null;
  db
    .prepare("UPDATE chores SET chore_name = ?, date = ? WHERE id = ?")
    .run(choreName, date, id);
  return rowToChore({ id, chore_name: choreName, date });
}

// Delete
export function deleteChore(id) {
  const info = db.prepare("DELETE FROM chores WHERE id = ?").run(id);
  return info.changes > 0;
}
