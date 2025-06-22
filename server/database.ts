import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, 'student_world_social_network.db'), { verbose: console.log });

db.prepare(`CREATE TABLE IF NOT EXISTS friend_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, requester_uid TEXT NOT NULL, requested_uid TEXT NOT NULL, status TEXT CHECK(status IN ('pending','accepted','rejected')) NOT NULL DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();

export default db;