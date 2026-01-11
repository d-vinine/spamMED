package repositories

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
		created_at DATETIME,
		updated_at DATETIME,
		deleted_at DATETIME,
		name TEXT NOT NULL UNIQUE,
		description TEXT,
		threshold INTEGER DEFAULT 10,
		unit TEXT DEFAULT 'Unit',
		price REAL NOT NULL,
		category_id INTEGER,
		restock_level INTEGER
	);`

	queryBatches := `
	CREATE TABLE IF NOT EXISTS pharmacy_batches (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		created_at DATETIME,
		updated_at DATETIME,
		deleted_at DATETIME,
		item_id INTEGER NOT NULL,
		batch_number TEXT NOT NULL,
		expiry_date DATETIME NOT NULL,
		quantity INTEGER NOT NULL,
		mrp REAL DEFAULT 0,
		purchase_price REAL DEFAULT 0,
		location TEXT,
		supplier_id INTEGER
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
		log.Fatal("Failed to create pharmacy_batches table:", err)
	}
	if _, err := db.Exec(queryAliases); err != nil {
		log.Fatal("Failed to create medicine_aliases table:", err)
	}
}
