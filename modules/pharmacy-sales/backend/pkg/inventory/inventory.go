package inventory

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"time"
)

// Item represents the logical medicine
type Item struct {
	ID            int     `json:"id"`
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	Threshold     int     `json:"threshold"`
	Unit          string  `json:"unit"`
	Price         float64 `json:"price"`
	TotalQuantity int     `json:"total_quantity"` // Aggregated from batches
	Batches       []Batch `json:"batches"`
}

// Batch represents a physical batch of the medicine
type Batch struct {
	ID          int       `json:"id"`
	ItemID      int       `json:"item_id"`
	BatchNumber string    `json:"batch_number"`
	Expiry      time.Time `json:"expiry_date"`
	Quantity    int       `json:"quantity"`
	MRP         float64   `json:"mrp"`
	Location    string    `json:"location"`
}

type Repository struct {
	DB *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{DB: db}
}

// GetAllItems returns items with their associated batches
func (r *Repository) GetAllItems() ([]Item, error) {
	// First fetch all items
	rows, err := r.DB.Query(`SELECT id, name, coalesce(description,''), coalesce(threshold,10), coalesce(unit,'Unit'), price FROM items`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []Item
	itemMap := make(map[int]*Item)

	for rows.Next() {
		var i Item
		if err := rows.Scan(&i.ID, &i.Name, &i.Description, &i.Threshold, &i.Unit, &i.Price); err != nil {
			return nil, err
		}
		i.Batches = []Batch{}
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
		var b Batch
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

func (r *Repository) CreateItem(item Item) (int64, error) {
	res, err := r.DB.Exec("INSERT INTO items (name, description, threshold, unit, price) VALUES (?, ?, ?, ?, ?)",
		item.Name, item.Description, item.Threshold, item.Unit, item.Price)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) UpdateItem(id string, item Item) error {
	_, err := r.DB.Exec("UPDATE items SET name=?, description=?, threshold=? WHERE id=?",
		item.Name, item.Description, item.Threshold, id)
	return err
}

func (r *Repository) AddBatch(batch Batch) (int64, error) {
	res, err := r.DB.Exec("INSERT INTO batches (item_id, batch_number, expiry, quantity, mrp, location) VALUES (?, ?, ?, ?, ?, ?)",
		batch.ItemID, batch.BatchNumber, batch.Expiry.Format(time.RFC3339), batch.Quantity, batch.MRP, batch.Location)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) UpdateBatch(id string, batch Batch) error {
	_, err := r.DB.Exec("UPDATE batches SET quantity=?, batch_number=?, location=?, mrp=?, expiry=? WHERE id=?",
		batch.Quantity, batch.BatchNumber, batch.Location, batch.MRP, batch.Expiry.Format(time.RFC3339), id)
	return err
}

// SeedData processes the old MockInventory and inserts it into the DB if empty
func (r *Repository) SeedData() {
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

var MockInventory []Item
