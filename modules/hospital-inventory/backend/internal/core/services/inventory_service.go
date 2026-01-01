package services

import (
	"context"
	"fmt"
	"hospital-inventory/internal/core/domain"
	"hospital-inventory/internal/core/ports"
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
			Reason:         "Initial Stock",
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
	return s.itemRepo.Update(ctx, item)
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
	return s.itemRepo.Delete(ctx, id)
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
