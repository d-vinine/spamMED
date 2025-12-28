package models

import (
	"time"
)

type Item struct {
	ID            uint    `gorm:"primaryKey" json:"id"`
	Name          string  `gorm:"not null" json:"name"`
	Description   string  `json:"description"`
	Threshold     int     `json:"threshold"` // Low stock threshold
	Unit          string  `json:"unit"`
	TotalQuantity int     `json:"total_quantity" gorm:"-"` // Calculated field
	Batches       []Batch `json:"batches"`
}

type Batch struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ItemID     uint      `json:"item_id"`
	Quantity   int       `json:"quantity"`
	ExpiryDate time.Time `json:"expiry_date"`
	Location   string    `json:"location"`
}

type Log struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Action    string    `json:"action"` // e.g., "Added Stock", "Removed Stock"
	Details   string    `json:"details"`
	Timestamp time.Time `json:"timestamp"`
}

type EmergencyRequest struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	RequesterName string    `json:"requester_name"`
	ItemName      string    `json:"item_name"`
	Quantity      int       `json:"quantity"`
	Status        string    `json:"status"` // "Pending", "Approved", "Rejected"
	CreatedAt     time.Time `json:"created_at"`
}
