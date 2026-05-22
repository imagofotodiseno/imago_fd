const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.sqlite');

function openDatabase() {
  const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
  return {
    db,
    run: (sql, params = []) => new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    }),
    get: (sql, params = []) => new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    }),
    all: (sql, params = []) => new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    }),
    exec: (sql) => new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    }),
    close: () => new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    })
  };
}

module.exports = { openDatabase, DB_FILE };
