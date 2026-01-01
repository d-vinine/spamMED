package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// ItemPayload matches the API input
type ItemPayload struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Threshold   int    `json:"threshold"`
	Unit        string `json:"unit"`
}

// BatchPayload matches the API input
type BatchPayload struct {
	ItemID      uint    `json:"item_id"`
	BatchNumber string  `json:"batch_number"`
	Quantity    int     `json:"quantity"`
	MRP         float64 `json:"mrp"`
	ExpiryDate  string  `json:"expiry_date"`
	Location    string  `json:"location"`
}

func main() {
	baseURL := "http://localhost:8080/api"

	// 1. Create Item
	item := ItemPayload{
		Name:        "Epinephrine (Demo)",
		Description: "Emergency Injection - Low and Expiring",
		Threshold:   20,
		Unit:        "vials",
	}

	itemBody, _ := json.Marshal(item)
	resp, err := http.Post(baseURL+"/items", "application/json", bytes.NewBuffer(itemBody))
	if err != nil {
		fmt.Printf("Error creating item: %v\n", err)
		return
	}
	defer resp.Body.Close()

	var createdItem struct {
		ID uint `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&createdItem); err != nil {
		fmt.Printf("Error decoding item response: %v\n", err)
		return
	}
	fmt.Printf("Created Item ID: %d\n", createdItem.ID)

	// 2. Add Batch (Low Stock + Expiring)
	// Current simulated date is Jan 2026.
	// We want it to be expiring soon (< 30 days), so let's say Jan 15, 2026.
	// We want low stock (Total < Threshold 20). So Quantity = 5.

	batch := BatchPayload{
		ItemID:      createdItem.ID,
		BatchNumber: "EPI-DEMO-001",
		Quantity:    5,
		MRP:         120.50,
		ExpiryDate:  "2026-01-15T00:00:00Z", // 13 days from "now" (Jan 2)
		Location:    "ER Cabinet 1",
	}

	batchBody, _ := json.Marshal(batch)
	respBatch, err := http.Post(baseURL+"/batches", "application/json", bytes.NewBuffer(batchBody))
	if err != nil {
		fmt.Printf("Error adding batch: %v\n", err)
		return
	}
	defer respBatch.Body.Close()

	if respBatch.StatusCode == 200 || respBatch.StatusCode == 201 {
		fmt.Println("Successfully added Low Stock + Expiring batch!")
	} else {
		fmt.Printf("Failed to add batch. Status: %s\n", respBatch.Status)
	}
}
