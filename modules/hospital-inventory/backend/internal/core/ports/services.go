package ports

import (
	"context"
	"hospital-inventory/internal/core/domain"
)

type InventoryService interface {
	CreateItem(ctx context.Context, item *domain.Item, initialBatch *domain.Batch) error
	GetItem(ctx context.Context, id uint) (*domain.Item, error)
	UpdateItem(ctx context.Context, item *domain.Item) error
	DeleteItem(ctx context.Context, id uint) error
	ListItems(ctx context.Context) ([]domain.Item, error)
	AddBatch(ctx context.Context, batch *domain.Batch, userID string) error
	UpdateBatch(ctx context.Context, batch *domain.Batch, reason string, userID string) error
	DeleteBatch(ctx context.Context, batchID uint, userID string) error
	// GetAlerts(ctx context.Context) ([]domain.Alert, error) // To be implemented
}

type RequestService interface {
	CreateRequest(ctx context.Context, req *domain.EmergencyRequest) error
	ProcessRequest(ctx context.Context, reqID uint, status string, userID string) error
	ListRequests(ctx context.Context) ([]domain.EmergencyRequest, error)
}
