package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"hospital-inventory/models"
	"net/http"
	"testing"
	"time"
)

// Helper to ignore errors for simplicity in this script or panic
func assert(t *testing.T, condition bool, msg string) {
	if !condition {
		t.Fatal(msg)
	}
}

func TestAPI(t *testing.T) {
	// Wait for server to start if needed, but assuming it's running on 8080 from previous step
	// OR we can start it here in a goroutine, but it's already running in background.
	baseURL := "http://localhost:8080/api"

	// 1. Create Item
	newItem := models.Item{
		Name:        "Test Item",
		Description: "Test Desc",
		Threshold:   10,
		Unit:        "pcs",
	}
	jsonData, _ := json.Marshal(newItem)
	resp, err := http.Post(baseURL+"/items", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatalf("Failed to create item: %v", err)
	}
	assert(t, resp.StatusCode == http.StatusCreated, "Expected 201 Created")

	var createdItem models.Item
	json.NewDecoder(resp.Body).Decode(&createdItem)
	assert(t, createdItem.ID != 0, "Item ID should be set")

	// 2. Add Batch
	newBatch := models.Batch{
		ItemID:     createdItem.ID,
		Quantity:   5,                           // Below threshold 10
		ExpiryDate: time.Now().AddDate(0, 1, 0), // 1 month from now
		Location:   "A1",
	}
	jsonData, _ = json.Marshal(newBatch)
	resp, err = http.Post(baseURL+"/batches", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatalf("Failed to add batch: %v", err)
	}
	assert(t, resp.StatusCode == http.StatusCreated, "Expected 201 Created")

	// 3. Check Alerts
	resp, err = http.Get(baseURL + "/alerts")
	if err != nil {
		t.Fatalf("Failed to get alerts: %v", err)
	}
	var alerts []map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&alerts)

	foundLowStock := false
	for _, a := range alerts {
		if a["item"] == "Test Item" && a["type"] == "Low Stock" {
			foundLowStock = true
			break
		}
	}
	assert(t, foundLowStock, "Expected Low Stock alert for Test Item")

	// 4. Create Request
	req := models.EmergencyRequest{
		RequesterName: "Remote Hospital",
		ItemName:      "Test Item",
		Quantity:      20,
	}
	jsonData, _ = json.Marshal(req)
	resp, err = http.Post(baseURL+"/requests", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	assert(t, resp.StatusCode == http.StatusCreated, "Expected 201 Created")

	// 5. Check Logs
	resp, err = http.Get(baseURL + "/logs")
	if err != nil {
		t.Fatalf("Failed to get logs: %v", err)
	}
	var logs []models.Log
	json.NewDecoder(resp.Body).Decode(&logs)
	assert(t, len(logs) > 0, "Expected logs to exist")

	fmt.Println("All API tests passed!")
}
