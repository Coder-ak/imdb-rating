import fs from "fs-extra";
import path from "path";
import Database from "better-sqlite3";

const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, "db");
const DB_PATH = path.join(DATA_DIR, "imdb.db");

// Singleton database instance
let db: Database.Database | null = null;

export async function initializeDatabase(): Promise<Database.Database> {
  try {
    console.log("Initializing database...");
    // Ensure data directory exists
    await fs.ensureDir(DATA_DIR);

    // Create or open the database
    db = new Database(DB_PATH);

    // Create tables if they don't exist (simplified schema)
    db.exec(`
      CREATE TABLE IF NOT EXISTS imdb_ratings (
        id TEXT PRIMARY KEY,
        rating REAL NOT NULL
      )
    `);

    console.log("Database initialized successfully");
    return db;
  } catch (error) {
    console.error(`Failed to initialize database: ${(error as Error).message}`);
    throw error;
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log("Database connection closed");
  }
}

// Handle application shutdown
process.on("SIGINT", () => {
  closeDatabase();
  process.exit(0);
});

process.on("SIGTERM", () => {
  closeDatabase();
  process.exit(0);
});
