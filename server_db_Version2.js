const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'data.db'));

// Jadval yaratish
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  plate TEXT,
  lat REAL,
  lng REAL,
  available INTEGER DEFAULT 1
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS rides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  driverId INTEGER,
  status TEXT,
  pickupLat REAL,
  pickupLng REAL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

// Boshlang'ich haydovchilarni seed qilish
const count = db.prepare('SELECT COUNT(*) as c FROM drivers').get().c;
if (count === 0) {
  const BASE_LAT = 41.311081;
  const BASE_LNG = 69.240562;
  const stmt = db.prepare('INSERT INTO drivers (name, plate, lat, lng, available) VALUES (?, ?, ?, ?, ?)');
  for (let i = 1; i <= 6; i++) {
    stmt.run(`Haydovchi ${i}`, `UZ ${1000 + i}`, BASE_LAT + (Math.random() - 0.5) * 0.05, BASE_LNG + (Math.random() - 0.5) * 0.05, 1);
  }
}

module.exports = db;