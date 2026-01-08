package services

import (
	"context"
	"encoding/json"
	"fmt"
	"hospital-inventory/internal/core/domain"
	"hospital-inventory/internal/core/ports"
	"time"
)

type IndentService struct {
	repo      ports.IndentRepository
	itemRepo  ports.ItemRepository
	batchRepo ports.BatchRepository
	txRepo    ports.TransactionRepository
}

func NewIndentService(
	repo ports.IndentRepository,
	itemRepo ports.ItemRepository,
	batchRepo ports.BatchRepository,
	txRepo ports.TransactionRepository,
) ports.IndentService {
	return &IndentService{
		repo:      repo,
		itemRepo:  itemRepo,
		batchRepo: batchRepo,
		txRepo:    txRepo,
	}
}

func (s *IndentService) CreateIndent(ctx context.Context, indent *domain.Indent) error {
	indent.Status = "PENDING"
	return s.repo.Create(ctx, indent)
}

func (s *IndentService) ListIndents(ctx context.Context) ([]domain.Indent, error) {
	return s.repo.List(ctx)
}

func (s *IndentService) GetIndent(ctx context.Context, id uint) (*domain.Indent, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *IndentService) ProcessIndent(ctx context.Context, indentID uint, status string) error {
	indent, err := s.repo.GetByID(ctx, indentID)
	if err != nil {
		return err
	}

	// Helper struct for JSON details
	type BatchDetail struct {
		BatchNumber string    `json:"batch_number"`
		Quantity    int       `json:"quantity"`
		ExpiryDate  time.Time `json:"expiry_date"`
		MRP         float64   `json:"mrp"`
		Location    string    `json:"location"`
	}

	// PENDING -> PROCESSING (Suggest Batches)
	if status == "PROCESSING" && indent.Status == "PENDING" {
		item, err := s.itemRepo.GetByName(ctx, indent.ItemName)
		if err != nil {
			return err
		}

		batches, err := s.batchRepo.GetByItemID(ctx, item.ID)
		if err != nil {
			return err
		}

		// FIFO Logic Calculation
		remainingQty := indent.Quantity
		var suggestions []BatchDetail

		for _, b := range batches {
			if remainingQty <= 0 {
				break
			}
			if b.Quantity > 0 {
				take := b.Quantity
				if take > remainingQty {
					take = remainingQty
				}

				mrp := 0.0
				if b.MRP != nil {
					mrp = *b.MRP
				}

				suggestions = append(suggestions, BatchDetail{
					BatchNumber: b.BatchNumber,
					Quantity:    take,
					ExpiryDate:  b.ExpiryDate,
					MRP:         mrp,
					Location:    b.Location,
				})
				remainingQty -= take
			}
		}

		detailsJSON, _ := json.Marshal(suggestions)
		indent.Status = "PROCESSING"
		indent.DispatchDetails = string(detailsJSON)
		return s.repo.Update(ctx, indent)
	}

	// PROCESSING -> DISPATCHED (Deduct Stock)
	if status == "DISPATCHED" && indent.Status == "PROCESSING" {
		// In a real app, we should probably re-verify availability here or rely on the JSON suggested
		// For simplicity, we'll re-run the logic to ensure we deduct from current actual stock
		// BUT, to ensure we dispatch exactly what was suggested, we should arguably use the stored JSON.
		// Let's re-run FIFO to be safe against concurrent updates for now, similar to before.

		item, err := s.itemRepo.GetByName(ctx, indent.ItemName)
		if err != nil {
			return err
		}

		batches, err := s.batchRepo.GetByItemID(ctx, item.ID)
		if err != nil {
			return err
		}

		remainingQty := indent.Quantity
		var dispatched []BatchDetail

		for _, b := range batches {
			if remainingQty <= 0 {
				break
			}
			if b.Quantity > 0 {
				take := b.Quantity
				if take > remainingQty {
					take = remainingQty
				}

				// Deduct
				b.Quantity -= take
				if err := s.batchRepo.Update(ctx, &b); err != nil {
					return err
				}

				mrp := 0.0
				if b.MRP != nil {
					mrp = *b.MRP
				}

				dispatched = append(dispatched, BatchDetail{
					BatchNumber: b.BatchNumber,
					Quantity:    take,
					ExpiryDate:  b.ExpiryDate,
					MRP:         mrp,
					Location:    b.Location,
				})

				// Audit
				tx := &domain.InventoryTransaction{
					ItemID:         item.ID,
					BatchID:        &b.ID,
					QuantityChange: -take,
					Reason:         "Indent",
					ReferenceID:    fmt.Sprintf("IND-%d", indent.ID),
					PerformedBy:    "System", // TODO: Get User
					Notes:          fmt.Sprintf("Dispatched to Pharmacy %s", indent.PharmacyID),
				}
				s.txRepo.Create(ctx, tx)

				remainingQty -= take
			}
		}

		detailsJSON, _ := json.Marshal(dispatched)
		indent.Status = "DISPATCHED"
		indent.DispatchDetails = string(detailsJSON)
		return s.repo.Update(ctx, indent)
	}

	// DISPATCHED -> FULFILLED (Confirmation)
	if status == "FULFILLED" && indent.Status == "DISPATCHED" {
		indent.Status = "FULFILLED"
		return s.repo.Update(ctx, indent)
	}

	// Handle Rejection
	if status == "REJECTED" {
		indent.Status = "REJECTED"
		return s.repo.Update(ctx, indent)
	}

	return nil
}
