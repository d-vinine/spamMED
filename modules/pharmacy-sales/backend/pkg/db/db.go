package db

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite"
)

func InitDB(filepath string) *sql.DB {
	db, err := sql.Open("sqlite", filepath)
	if err != nil {
		log.Fatal("Failed to connect into database:", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	createTables(db)
	return db
}

func createTables(db *sql.DB) {
	queryItems := `
	CREATE TABLE IF NOT EXISTS items (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL UNIQUE,
		description TEXT,
		threshold INTEGER DEFAULT 10,
		unit TEXT DEFAULT 'Unit',
		price REAL NOT NULL
	);`

	queryBatches := `
	CREATE TABLE IF NOT EXISTS batches (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		item_id INTEGER NOT NULL,
		batch_number TEXT NOT NULL,
		expiry DATETIME NOT NULL,
		quantity INTEGER NOT NULL,
		mrp REAL DEFAULT 0,
		location TEXT,
		FOREIGN KEY(item_id) REFERENCES items(id)
	);`

	queryAliases := `
	CREATE TABLE IF NOT EXISTS medicine_aliases (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		canonical_name TEXT NOT NULL,
		alias TEXT NOT NULL,
		UNIQUE(canonical_name, alias)
	);`

	if _, err := db.Exec(queryItems); err != nil {
		log.Fatal("Failed to create items table:", err)
	}
	if _, err := db.Exec(queryBatches); err != nil {
		log.Fatal("Failed to create batches table:", err)
	}
	if _, err := db.Exec(queryAliases); err != nil {
		log.Fatal("Failed to create medicine_aliases table:", err)
	}
}
