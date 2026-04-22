const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "showtracker.db");

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS Venue (
      venue_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      capacity INTEGER,
      genreTags TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Show (
      show_id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      ticketPrice DECIMAL,
      genre TEXT,
      venue_id INTEGER NOT NULL,
      FOREIGN KEY (venue_id) REFERENCES Venue(venue_id) ON DELETE CASCADE
    )
  `);

  save();
  return db;
}

function save() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

module.exports = { getDb, save };