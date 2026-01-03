package domain

import "time"

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
	IsOutOfStock  bool    `json:"is_out_of_stock,omitempty"` // Computed field
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

// SaleItem represents an item identified from a sales note
type SaleItem struct {
	CapturedName string  `json:"captured_name"`
	MatchedItem  Item    `json:"matched_item"`
	Quantity     int     `json:"quantity"`
	Confidence   float64 `json:"confidence"`
	Status       string  `json:"status"` // "Available", "OutOfStock", "Unknown"
}
