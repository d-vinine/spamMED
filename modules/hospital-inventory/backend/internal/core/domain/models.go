package domain

import (
	"time"

	"gorm.io/gorm"
)

// Standard Model with ID + Timestamps + Soft Delete
type BaseModel struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"` // Soft delete, hidden from JSON
}

type Category struct {
	BaseModel
	Name        string `gorm:"unique;not null" json:"name"`
	Description string `json:"description"`
	Items       []Item `json:"-"` // One-to-many
}

type Item struct {
	BaseModel
	Name         string   `gorm:"not null;index" json:"name"` // Indexed for search
	CategoryID   *uint    `json:"category_id"`                // Pointer to allow null if needed
	Category     Category `json:"category,omitempty"`
	Description  string   `json:"description"`
	Threshold    int      `json:"threshold"`     // Low stock threshold
	Unit         string   `json:"unit"`          // e.g., "Tablets", "Vials"
	RestockLevel int      `json:"restock_level"` // Suggested reorder quantity
	Batches      []Batch  `json:"batches"`

	// Calculated fields (handled at runtime/query time)
	TotalQuantity int `json:"total_quantity" gorm:"-"`
}

type Batch struct {
	BaseModel
	ItemID        uint      `json:"item_id" gorm:"index"`
	BatchNumber   string    `json:"batch_number" gorm:"index"`
	Quantity      int       `json:"quantity"` // Current stock in this batch
	MRP           *float64  `json:"mrp"`
	PurchasePrice float64   `json:"purchase_price"`           // Good to track cost vs MRP
	ExpiryDate    time.Time `json:"expiry_date" gorm:"index"` // Index for quick expiry lookups
	Location      string    `json:"location"`                 // Rack/Shelf ID
	SupplierID    *uint     `json:"supplier_id"`
}

// InventoryTransaction is an immutable ledger of all stock movements.
// NEVER convert this to a soft-delete model; this is your audit trail.
type InventoryTransaction struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	ItemID         uint      `json:"item_id" gorm:"index"`
	BatchID        *uint     `json:"batch_id" gorm:"index"` // Nullable for general adjustments
	QuantityChange int       `json:"quantity_change"`       // Positive (Add) or Negative (Remove)
	Reason         string    `json:"reason"`                // ENUM: "Indent", "Purchase", "Expired", "Correction"
	ReferenceID    string    `json:"reference_id"`          // ID of the Order/Indent/Invoice
	PerformedBy    string    `json:"performed_by"`          // User ID/Name
	Timestamp      time.Time `json:"timestamp" gorm:"autoCreateTime"`
	Notes          string    `json:"notes"`
}

type EmergencyRequest struct {
	BaseModel
	RequesterName string     `json:"requester_name"`
	ItemID        *uint      `json:"item_id"`   // Link to Item if known
	ItemName      string     `json:"item_name"` // Fallback if item not in DB
	Quantity      int        `json:"quantity"`
	Status        string     `json:"status" gorm:"default:'Pending'"` // Pending, Approved, Rejected, Fulfilled
	FulfilledDate *time.Time `json:"fulfilled_date"`
}
