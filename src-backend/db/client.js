const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const DB_FILE = path.join(__dirname, 'database.sqlite');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const supabase = isSupabaseConfigured
	? createClient(supabaseUrl, supabaseKey)
	: {
			from: () => {
				throw new Error('Supabase no configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
			}
		};

const openDatabase = (dbFile = DB_FILE) => {
	const db = new sqlite3.Database(dbFile);

	return {
		run(sql, params = []) {
			return new Promise((resolve, reject) => {
				db.run(sql, params, function onRun(err) {
					if (err) return reject(err);
					resolve({ lastID: this.lastID, changes: this.changes });
				});
			});
		},
		get(sql, params = []) {
			return new Promise((resolve, reject) => {
				db.get(sql, params, (err, row) => {
					if (err) return reject(err);
					resolve(row);
				});
			});
		},
		all(sql, params = []) {
			return new Promise((resolve, reject) => {
				db.all(sql, params, (err, rows) => {
					if (err) return reject(err);
					resolve(rows);
				});
			});
		},
		exec(sql) {
			return new Promise((resolve, reject) => {
				db.exec(sql, (err) => {
					if (err) return reject(err);
					resolve(true);
				});
			});
		},
		close() {
			return new Promise((resolve, reject) => {
				db.close((err) => {
					if (err) return reject(err);
					resolve(true);
				});
			});
		}
	};
};

module.exports = {
	DB_FILE,
	openDatabase,
	isSupabaseConfigured,
	supabase
};