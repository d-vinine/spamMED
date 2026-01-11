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
	// 1. Create Items & Batches
	items := []struct {
		Item    ItemPayload
		Batches []BatchPayload
	}{
		{
			Item: ItemPayload{Name: "Dolo 650", Description: "Fever reducer", Threshold: 50, Unit: "strips"},
			Batches: []BatchPayload{
				{BatchNumber: "DOLO-001", Quantity: 100, MRP: 30.0, ExpiryDate: "2026-12-31T00:00:00Z", Location: "Shelf A"},
				{BatchNumber: "DOLO-002", Quantity: 20, MRP: 30.0, ExpiryDate: "2024-03-01T00:00:00Z", Location: "Shelf B"}, // Expiring soon
			},
		},
		{
			Item: ItemPayload{Name: "Paracetamol 500mg", Description: "Pain reliever", Threshold: 30, Unit: "strips"},
			Batches: []BatchPayload{
				{BatchNumber: "PARA-100", Quantity: 10, MRP: 15.0, ExpiryDate: "2025-06-15T00:00:00Z", Location: "Shelf A"}, // Low stock
			},
		},
		{
			Item: ItemPayload{Name: "Amoxicillin 500mg", Description: "Antibiotic", Threshold: 25, Unit: "strips"},
			Batches: []BatchPayload{
				{BatchNumber: "AMOX-22", Quantity: 200, MRP: 55.0, ExpiryDate: "2027-01-20T00:00:00Z", Location: "Shelf C"},
			},
		},
	}

	for _, data := range items {
		// Create Item
		itemBody, _ := json.Marshal(data.Item)
		resp, err := http.Post(baseURL+"/items", "application/json", bytes.NewBuffer(itemBody))
		if err != nil {
			fmt.Printf("Error creating item %s: %v\n", data.Item.Name, err)
			continue
		}

		var createdItem struct {
			ID uint `json:"id"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&createdItem); err != nil {
			fmt.Printf("Error decoding response for %s: %v\n", data.Item.Name, err)
			resp.Body.Close()
			continue
		}
		resp.Body.Close()
		fmt.Printf("Created Item: %s (ID: %d)\n", data.Item.Name, createdItem.ID)

		// Create Batches
		for _, batch := range data.Batches {
			batch.ItemID = createdItem.ID
			batchBody, _ := json.Marshal(batch)
			respB, err := http.Post(baseURL+"/batches", "application/json", bytes.NewBuffer(batchBody))
			if err != nil {
				fmt.Printf("Error adding batch %s: %v\n", batch.BatchNumber, err)
				continue
			}
			respB.Body.Close()
			fmt.Printf("  -> Added Batch: %s\n", batch.BatchNumber)
		}
	}

}
