package services

import (
	"context"
	"fmt"
	"hospital-inventory/internal/core/domain"
	"hospital-inventory/internal/core/ports"
	"strings"
	"time"
)

type InventoryService struct {
	itemRepo  ports.ItemRepository
	batchRepo ports.BatchRepository
	txRepo    ports.TransactionRepository
}

func NewInventoryService(itemRepo ports.ItemRepository, batchRepo ports.BatchRepository, txRepo ports.TransactionRepository) *InventoryService {
	return &InventoryService{
		itemRepo:  itemRepo,
		batchRepo: batchRepo,
		txRepo:    txRepo,
	}
}

func (s *InventoryService) CreateItem(ctx context.Context, item *domain.Item, initialBatch *domain.Batch) error {
	if err := s.itemRepo.Create(ctx, item); err != nil {
		return err
	}

	if initialBatch != nil {
		initialBatch.ItemID = item.ID
		if err := s.batchRepo.Create(ctx, initialBatch); err != nil {
			// Ideally we should rollback item creation here (transaction needed), but for now we'll just return error
			// Or just log it. A proper transactional unit of work would be better.
			// For this MVP, let's just create it.
			return err
		}

		// Update item total quantity
		item.TotalQuantity = initialBatch.Quantity // Since it's new item
		if err := s.itemRepo.Update(ctx, item); err != nil {
			return err
		}

		// Log transaction
		_ = s.txRepo.Create(ctx, &domain.InventoryTransaction{
			ItemID:         item.ID,
			BatchID:        &initialBatch.ID,
			QuantityChange: initialBatch.Quantity,
			Reason:         "Item Added",
			Timestamp:      time.Now(),
		})
	}

	return nil
}

func (s *InventoryService) UpdateBatch(ctx context.Context, batch *domain.Batch, reason string, userID string) error {
	// 1. Get existing batch for quantity comparison
	oldBatch, err := s.batchRepo.GetByID(ctx, batch.ID)
	if err != nil {
		return err
	}

	qtyDiff := batch.Quantity - oldBatch.Quantity

	// 2. Update Batch
	if err := s.batchRepo.Update(ctx, batch); err != nil {
		return err
	}

	// 3. Update Item Stock if quantity changed
	if qtyDiff != 0 {
		item, err := s.GetItem(ctx, batch.ItemID)
		if err != nil {
			return err
		}
		item.TotalQuantity += qtyDiff
		if err := s.itemRepo.Update(ctx, item); err != nil {
			return err
		}

		// 4. Log Transaction
		_ = s.txRepo.Create(ctx, &domain.InventoryTransaction{
			ItemID:         batch.ItemID,
			BatchID:        &batch.ID,
			QuantityChange: qtyDiff,
			Reason:         reason,
			Timestamp:      time.Now(),
		})
	}
	return nil
}

func (s *InventoryService) DeleteBatch(ctx context.Context, batchID uint, userID string) error {
	// 1. Get batch to know quantity
	batch, err := s.batchRepo.GetByID(ctx, batchID)
	if err != nil {
		return err
	}

	// 2. Delete Batch
	if err := s.batchRepo.Delete(ctx, batchID); err != nil {
		return err
	}

	// 3. Update Item Stock
	item, err := s.GetItem(ctx, batch.ItemID)
	if err != nil {
		return err
	}
	item.TotalQuantity -= batch.Quantity
	if err := s.itemRepo.Update(ctx, item); err != nil {
		return err
	}

	// 4. Log Transaction
	_ = s.txRepo.Create(ctx, &domain.InventoryTransaction{
		ItemID:         batch.ItemID,
		BatchID:        &batch.ID,
		QuantityChange: -batch.Quantity,
		Reason:         "Batch Deleted",
		Timestamp:      time.Now(),
	})

	return nil
}

func (s *InventoryService) GetItem(ctx context.Context, id uint) (*domain.Item, error) {
	return s.itemRepo.GetByID(ctx, id)
}

func (s *InventoryService) UpdateItem(ctx context.Context, item *domain.Item) error {
	if err := s.itemRepo.Update(ctx, item); err != nil {
		return err
	}
	// Log Transaction for Metadata Update
	_ = s.txRepo.Create(ctx, &domain.InventoryTransaction{
		ItemID:    item.ID,
		Reason:    "Item Details Updated",
		Timestamp: time.Now(),
		Notes:     fmt.Sprintf("Item %s details updated", item.Name),
	})
	return nil
}

func (s *InventoryService) DeleteItem(ctx context.Context, id uint) error {
	// 1. Delete associated batches (Soft Delete)
	batches, err := s.batchRepo.GetByItemID(ctx, id)
	if err == nil {
		for _, batch := range batches {
			_ = s.batchRepo.Delete(ctx, batch.ID)
		}
	}

	// 2. Delete the item (Soft Delete)
	if err := s.itemRepo.Delete(ctx, id); err != nil {
		return err
	}

	// 3. Log Transaction
	_ = s.txRepo.Create(ctx, &domain.InventoryTransaction{
		ItemID:    id,
		Reason:    "Item Deleted",
		Timestamp: time.Now(),
		Notes:     "Item and associated batches deleted",
	})
	return nil
}

func (s *InventoryService) ListItems(ctx context.Context) ([]domain.Item, error) {
	// Logic to calculate total quantity from batches could be here or in repo
	items, err := s.itemRepo.List(ctx)
	if err != nil {
		return nil, err
	}

	// Recalculate totals (Business Logic)
	for i := range items {
		total := 0
		for _, b := range items[i].Batches {
			// Filter expired? Maybe not, keep it simple for now
			total += b.Quantity
		}
		items[i].TotalQuantity = total
	}
	return items, nil
}

func (s *InventoryService) GetKnowledgeBase(ctx context.Context) ([]domain.Item, error) {
	return s.itemRepo.GetKnowledgeBase(ctx)
}

func (s *InventoryService) AddBatch(ctx context.Context, batch *domain.Batch, userID string) error {
	// 1. Save Batch
	if err := s.batchRepo.Create(ctx, batch); err != nil {
		return err
	}

	// 2. Create Transaction Log
	tx := &domain.InventoryTransaction{
		ItemID:         batch.ItemID,
		BatchID:        &batch.ID,
		QuantityChange: batch.Quantity,
		Reason:         "Purchase/Entry",
		PerformedBy:    userID, // From JWT or header
		Timestamp:      time.Now(),
		Notes:          fmt.Sprintf("Initial stock for batch %s", batch.BatchNumber),
	}

	return s.txRepo.Create(ctx, tx)
}

func (s *InventoryService) ListTransactions(ctx context.Context) ([]domain.InventoryTransaction, error) {
	return s.txRepo.List(ctx)
}

func (s *InventoryService) GetDashboardStats(ctx context.Context) (*domain.DashboardStats, error) {
	// 1. Get All Items
	items, err := s.itemRepo.List(ctx)
	if err != nil {
		return nil, err
	}

	stats := &domain.DashboardStats{
		TotalItems:    int64(len(items)),
		TotalValue:    0,
		LowStockItems: 0,
		ExpiredItems:  0,
	}

	now := time.Now()

	for _, item := range items {
		// Low Stock Check
		if item.TotalQuantity < item.Threshold {
			stats.LowStockItems++
		}

		for _, batch := range item.Batches {
			// Total Value Calculation
			if batch.MRP != nil {
				stats.TotalValue += float64(batch.Quantity) * (*batch.MRP)
			}

			// Expired Check
			if batch.ExpiryDate.Before(now) {
				stats.ExpiredItems++
			}
		}
	}

	return stats, nil
}

func (s *InventoryService) CheckItemExistence(ctx context.Context, name string) (bool, string, error) {
	// 1. Exact Match
	_, err := s.itemRepo.GetByName(ctx, name)
	if err == nil {
		return true, name, nil // Found exact
	}

	// 2. Fuzzy Match (Hyphens -> Space)
	normalized := strings.ReplaceAll(name, "-", " ")
	if normalized != name {
		_, err := s.itemRepo.GetByName(ctx, normalized)
		if err == nil {
			return true, normalized, nil // Found similar
		}
	}

	// 3. Case Insensitive Check (if repository doesn't handle it, we might need to list all or do DB query)
	// For now, assuming GetByName is exact or case-sensitive depending on DB collation.
	// If GetByName returns error, we assume not found.

	return false, "", nil
}
