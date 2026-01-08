package services

import (
	"billing-module/internal/core/domain"
	"billing-module/internal/core/ports"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type InventoryService struct {
	repo ports.ItemRepository
}

func NewInventoryService(repo ports.ItemRepository) *InventoryService {
	return &InventoryService{repo: repo}
}

func (s *InventoryService) GetAllItems() ([]domain.Item, error) {
	return s.repo.GetAllItems()
}

func (s *InventoryService) CreateItem(item domain.Item) (int64, error) {
	return s.repo.CreateItem(item)
}

func (s *InventoryService) UpdateItem(id string, item domain.Item) error {
	return s.repo.UpdateItem(id, item)
}

func (s *InventoryService) AddBatch(batch domain.Batch) (int64, error) {
	return s.repo.AddBatch(batch)
}

func (s *InventoryService) UpdateBatch(id string, batch domain.Batch) error {
	return s.repo.UpdateBatch(id, batch)
}

// ReceiveIndent fetches indent details from Hospital and ingests stock
func (s *InventoryService) ReceiveIndent(indentID int) error {
	fmt.Printf("Starting ReceiveIndent for ID: %d\n", indentID)

	// 1. Fetch Indent from Hospital Backend
	url := fmt.Sprintf("http://localhost:8080/api/indents/%d", indentID)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Printf("Error fetching indent: %v\n", err)
		return fmt.Errorf("failed to fetch indent: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Error response from hospital: %d\n", resp.StatusCode)
		return fmt.Errorf("failed to fetch indent: status %d", resp.StatusCode)
	}

	var indent struct {
		ID              uint   `json:"id"`
		ItemName        string `json:"item_name"`
		DispatchDetails string `json:"dispatch_details"`
	}

	// Read body first for debugging
	bodyBytes, _ := io.ReadAll(resp.Body)
	fmt.Printf("Hospital Response: %s\n", string(bodyBytes))

	// Decode
	if err := json.Unmarshal(bodyBytes, &indent); err != nil {
		fmt.Printf("Error decoding indent JSON: %v\n", err)
		return fmt.Errorf("failed to decode indent: %v", err)
	}

	fmt.Printf("Parsed Indent: Name=%s, Details=%s\n", indent.ItemName, indent.DispatchDetails)

	// 2. Parse Dispatch Details
	type BatchDetail struct {
		BatchNumber string    `json:"batch_number"`
		Quantity    int       `json:"quantity"`
		ExpiryDate  time.Time `json:"expiry_date"`
		MRP         float64   `json:"mrp"`
		Location    string    `json:"location"`
	}
	var details []BatchDetail
	if err := json.Unmarshal([]byte(indent.DispatchDetails), &details); err != nil {
		fmt.Printf("Error parsing DispatchDetails: %v\n", err)
		return fmt.Errorf("failed to parse dispatch details: %v", err)
	}

	// 3. Find or Create Item
	items, err := s.GetAllItems()
	if err != nil {
		return err
	}

	var targetItemID int
	found := false
	for _, item := range items {
		if item.Name == indent.ItemName {
			targetItemID = item.ID
			found = true
			break
		}
	}

	if !found {
		// Create Item
		newItem := domain.Item{
			Name: indent.ItemName,
			// Category: "General", // Field does not exist in domain.Item
			Description: "Imported via Indent",
			Unit:        "Units",
		}
		id, err := s.CreateItem(newItem)
		if err != nil {
			return err
		}
		targetItemID = int(id)
	}

	// 4. Create Batches
	for _, d := range details {
		batch := domain.Batch{
			ItemID:      targetItemID,
			BatchNumber: d.BatchNumber,
			Quantity:    d.Quantity,
			Expiry:      d.ExpiryDate, // Field is Expiry
			MRP:         d.MRP,        // Field is float64, not *float64
			Location:    "Received-Indent",
		}
		if _, err := s.AddBatch(batch); err != nil {
			return fmt.Errorf("failed to add batch %s: %v", d.BatchNumber, err)
		}
	}

	// 5. Confirm Fulfillment
	client := &http.Client{}
	req, err := http.NewRequest("PUT", fmt.Sprintf("http://localhost:8080/api/indents/%d/status", indentID), bytes.NewBuffer([]byte(`{"status": "FULFILLED"}`)))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	confirmResp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to confirm indent: %v", err)
	}
	defer confirmResp.Body.Close()

	if confirmResp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to confirm indent: status %d", confirmResp.StatusCode)
	}

	return nil
}
