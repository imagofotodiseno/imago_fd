const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_FILE = path.join(__dirname, 'database.sqlite');
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

function run() {
  const sql = fs.readFileSync(SCHEMA_FILE, 'utf8');
  const db = new sqlite3.Database(DB_FILE);
  db.exec(sql, (err) => {
    if (err) {
      console.error('Error ejecutando schema.sql', err);
      process.exit(1);
    }
    console.log('Base de datos inicializada en', DB_FILE);
    db.close();
  });
}

run();
