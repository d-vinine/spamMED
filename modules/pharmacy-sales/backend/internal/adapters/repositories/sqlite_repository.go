package repositories

import (
	"billing-module/internal/core/domain"
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"time"
)

type SQLiteRepository struct {
	DB *sql.DB
}

func NewSQLiteRepository(db *sql.DB) *SQLiteRepository {
	return &SQLiteRepository{DB: db}
}

// --- ItemRepository Implementation ---

func (r *SQLiteRepository) GetAllItems() ([]domain.Item, error) {
	// First fetch all items
	rows, err := r.DB.Query(`SELECT id, name, coalesce(description,''), coalesce(threshold,10), coalesce(unit,'Unit'), price FROM items`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []domain.Item
	itemMap := make(map[int]*domain.Item)

	for rows.Next() {
		var i domain.Item
		if err := rows.Scan(&i.ID, &i.Name, &i.Description, &i.Threshold, &i.Unit, &i.Price); err != nil {
			return nil, err
		}
		i.Batches = []domain.Batch{}
		items = append(items, i)
	}

	// Re-map for efficient batch assignment
	for i := range items {
		itemMap[items[i].ID] = &items[i]
	}

	// Fetch all batches
	batchRows, err := r.DB.Query(`SELECT id, item_id, batch_number, expiry, quantity, coalesce(mrp,0), coalesce(location,'') FROM batches`)
	if err != nil {
		return nil, err
	}
	defer batchRows.Close()

	for batchRows.Next() {
		var b domain.Batch
		var expiryStr string
		if err := batchRows.Scan(&b.ID, &b.ItemID, &b.BatchNumber, &expiryStr, &b.Quantity, &b.MRP, &b.Location); err != nil {
			return nil, err
		}

		if expiryStr != "" {
			parsed, err := time.Parse(time.RFC3339, expiryStr)
			if err == nil {
				b.Expiry = parsed
			}
		}

		if item, exists := itemMap[b.ItemID]; exists {
			item.Batches = append(item.Batches, b)
			item.TotalQuantity += b.Quantity
		}
	}

	return items, nil
}

func (r *SQLiteRepository) CreateItem(item domain.Item) (int64, error) {
	res, err := r.DB.Exec("INSERT INTO items (name, description, threshold, unit, price) VALUES (?, ?, ?, ?, ?)",
		item.Name, item.Description, item.Threshold, item.Unit, item.Price)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *SQLiteRepository) UpdateItem(id string, item domain.Item) error {
	_, err := r.DB.Exec("UPDATE items SET name=?, description=?, threshold=? WHERE id=?",
		item.Name, item.Description, item.Threshold, id)
	return err
}

func (r *SQLiteRepository) AddBatch(batch domain.Batch) (int64, error) {
	res, err := r.DB.Exec("INSERT INTO batches (item_id, batch_number, expiry, quantity, mrp, location) VALUES (?, ?, ?, ?, ?, ?)",
		batch.ItemID, batch.BatchNumber, batch.Expiry.Format(time.RFC3339), batch.Quantity, batch.MRP, batch.Location)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *SQLiteRepository) UpdateBatch(id string, batch domain.Batch) error {
	_, err := r.DB.Exec("UPDATE batches SET quantity=?, batch_number=?, location=?, mrp=?, expiry=? WHERE id=?",
		batch.Quantity, batch.BatchNumber, batch.Location, batch.MRP, batch.Expiry.Format(time.RFC3339), id)
	return err
}

func (r *SQLiteRepository) SeedData() {
	var count int
	r.DB.QueryRow("SELECT COUNT(*) FROM items").Scan(&count)
	if count > 0 {
		return
	}

	log.Println("Seeding database with initial inventory...")

	type SeedItem struct {
		Name     string
		Price    float64
		Quantity int
		Expiry   string
	}

	seeds := []SeedItem{
		{"Dolo-650", 30.0, 100, "Dec 2025"},
		{"Paracetamol 500mg", 20.0, 50, "Nov 2024"},
		{"Azithral 500", 120.0, 30, "Mar 2026"},
		{"Pan 40", 150.0, 40, "Aug 2025"},
		{"Crocin 650", 35.0, 80, "Jan 2027"},
		{"Augmentin 625", 200.0, 15, "Feb 2025"},
		{"Allegra 120", 160.0, 30, "Dec 2026"},
	}

	for _, s := range seeds {
		res, err := r.DB.Exec("INSERT INTO items (name, price) VALUES (?, ?)", s.Name, s.Price)
		if err != nil {
			log.Printf("Failed to insert item %s: %v", s.Name, err)
			continue
		}

		id, _ := res.LastInsertId()
		parsedTime, _ := time.Parse("Jan 2006", s.Expiry)
		if parsedTime.IsZero() {
			parsedTime = time.Now().AddDate(1, 0, 0)
		}

		batchNo := fmt.Sprintf("B-%d-%d", id, rand.Intn(999))
		_, err = r.DB.Exec("INSERT INTO batches (item_id, batch_number, expiry, quantity, mrp, location) VALUES (?, ?, ?, ?, ?, ?)",
			id, batchNo, parsedTime.Format(time.RFC3339), s.Quantity, s.Price+5, "Shelf A")
	}
	log.Println("Seeding complete.")
}

// --- KnowledgeRepository Implementation ---

func (r *SQLiteRepository) GetAllAliases() (map[string][]string, error) {
	rows, err := r.DB.Query("SELECT canonical_name, alias FROM medicine_aliases")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string][]string)
	for rows.Next() {
		var canonical, alias string
		if err := rows.Scan(&canonical, &alias); err != nil {
			return nil, err
		}
		result[canonical] = append(result[canonical], alias)
	}
	return result, nil
}

func (r *SQLiteRepository) SeedKnowledge() {
	var count int
	r.DB.QueryRow("SELECT COUNT(*) FROM medicine_aliases").Scan(&count)
	if count > 0 {
		return // Already seeded
	}

	log.Println("Seeding knowledge base...")

	initialData := map[string][]string{
		"Dolo-650":          {"dolo", "dolo 650", "bukhar ki dawa"},
		"Paracetamol 500mg": {"para", "pcm", "paracetamol", "crocin"},
		"Azithral 500":      {"azee", "azi", "azithromycine"},
		"Pan 40":            {"pan", "pantop", "gastric"},
		"Cough Syrup":       {"cough", "syrup", "kuf", "benadryl"},
		"Voveran SR":        {"voveran", "painkiller", "diclofenac"},
		"Augmentin 625":     {"aug", "augmentin", "antibiotic"},
		"Metrogyl 400":      {"metro", "loose motion", "stomach"},
		"Pantocid 40":       {"panto", "acidity", "gas capsule"},
		"Montair LC":        {"montair", "allergy", "sardi", "cold"},
		"Allegra 120":       {"allegra", "skin allergy", "khujli"},
		"Combiflam":         {"combi", "body pain", "dard"},
		"Shelcal 500":       {"shelcal", "calcium", "haddi", "bone"},
		"Limcee 500":        {"limcee", "vitamin c", "orange goli"},
		"Becosules":         {"beco", "b complex", "mouth ulcer", "chale"},
		"Ascoril LS":        {"ascoril", "wet cough", "khansi syrup"},
		"Digene Gel":        {"digene", "pink syrup", "acidity liquid"},
		"Telma 40":          {"telma", "bp", "blood pressure"},
		"Glycomet 500":      {"glycomet", "sugar", "diabetes"},
	}

	tx, err := r.DB.Begin()
	if err != nil {
		log.Printf("Failed to begin transaction for knowledge seeding: %v", err)
		return
	}

	stmt, err := tx.Prepare("INSERT INTO medicine_aliases (canonical_name, alias) VALUES (?, ?)")
	if err != nil {
		log.Printf("Failed to prepare statement: %v", err)
		tx.Rollback()
		return
	}
	defer stmt.Close()

	for canonical, aliases := range initialData {
		for _, alias := range aliases {
			_, err := stmt.Exec(canonical, alias)
			if err != nil {
				log.Printf("Failed to insert alias %s -> %s: %v", canonical, alias, err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Failed to commit knowledge seeding: %v", err)
	} else {
		log.Println("Knowledge base seeded successfully.")
	}
}
