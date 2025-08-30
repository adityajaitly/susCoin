// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'suscoin.db'));

db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`CREATE TABLE IF NOT EXISTS users(
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    occupation TEXT CHECK(occupation IN ('student', 'professional')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS activities(
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,                -- 'transport' | 'utility' | 'solar'
    mode TEXT,                         -- e.g., 'bike', 'train (city)'
    distance_km REAL DEFAULT 0,
    co2e_saved_kg REAL DEFAULT 0,
    score REAL DEFAULT 0,              -- from CSV table (0..10)
    coins INTEGER DEFAULT 0,
    evidence_url TEXT,
    status TEXT DEFAULT 'verified',    -- 'pending' | 'verified' | 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS wallet_ledger(
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    delta INTEGER NOT NULL,            -- +/- coins
    reason TEXT,                       -- 'activity:<id>' | 'redeem:<id>'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS partners(
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    catalog_json TEXT NOT NULL         -- [{id,title,price_coins}] as JSON
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS redemptions(
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    partner_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    coins INTEGER NOT NULL,
    status TEXT DEFAULT 'used',        -- 'pending' | 'used' | 'void'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(partner_id) REFERENCES partners(id)
  )`);
});

function getBalance(userId){
  return new Promise((resolve, reject)=>{
    db.get(`SELECT COALESCE(SUM(delta),0) AS bal FROM wallet_ledger WHERE user_id=?`, [userId],
      (e,row)=> e?reject(e):resolve(row.bal));
  });
}

module.exports = { db, getBalance };
