import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  tier: 'free' | 'premium';
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'shandon.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      tier TEXT DEFAULT 'free' CHECK(tier IN ('free', 'premium')),
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  return db;
}

export function getUsers(): User[] {
  const database = getDb();
  const rows = database.prepare('SELECT * FROM users').all() as Array<{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    tier: string;
    createdAt: string;
  }>;
  return rows.map((row) => ({
    ...row,
    tier: row.tier as 'free' | 'premium',
  }));
}

export function findUserByEmail(email: string): User | undefined {
  const database = getDb();
  const row = database.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    tier: string;
    createdAt: string;
  } | undefined;
  if (!row) return undefined;
  return { ...row, tier: row.tier as 'free' | 'premium' };
}

export function findUserById(id: string): User | undefined {
  const database = getDb();
  const row = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    tier: string;
    createdAt: string;
  } | undefined;
  if (!row) return undefined;
  return { ...row, tier: row.tier as 'free' | 'premium' };
}

export function createUser(name: string, email: string, passwordHash: string): User {
  const database = getDb();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  database
    .prepare('INSERT INTO users (id, name, email, passwordHash, tier, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, email.toLowerCase(), passwordHash, 'free', createdAt);

  return {
    id,
    name,
    email: email.toLowerCase(),
    passwordHash,
    tier: 'free',
    createdAt,
  };
}

export function updateUserTier(userId: string, tier: 'free' | 'premium'): void {
  const database = getDb();
  const result = database.prepare('UPDATE users SET tier = ? WHERE id = ?').run(tier, userId);
  if (result.changes === 0) throw new Error('User not found');
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
