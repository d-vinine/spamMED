package ports

import (
	"context"
	"hospital-inventory/internal/core/domain"
)

type ItemRepository interface {
	Create(ctx context.Context, item *domain.Item) error
	GetByID(ctx context.Context, id uint) (*domain.Item, error)
	GetByName(ctx context.Context, name string) (*domain.Item, error)
	Update(ctx context.Context, item *domain.Item) error
	Delete(ctx context.Context, id uint) error
	List(ctx context.Context) ([]domain.Item, error)
}

type BatchRepository interface {
	Create(ctx context.Context, batch *domain.Batch) error
	Update(ctx context.Context, batch *domain.Batch) error
	GetByID(ctx context.Context, id uint) (*domain.Batch, error)
	Delete(ctx context.Context, id uint) error
	GetByItemID(ctx context.Context, itemID uint) ([]domain.Batch, error)
}

type TransactionRepository interface {
	Create(ctx context.Context, tx *domain.InventoryTransaction) error
	GetByItemID(ctx context.Context, itemID uint) ([]domain.InventoryTransaction, error)
	List(ctx context.Context) ([]domain.InventoryTransaction, error)
}

type RequestRepository interface {
	Create(ctx context.Context, req *domain.EmergencyRequest) error
	UpdateStatus(ctx context.Context, id uint, status string) error
	List(ctx context.Context) ([]domain.EmergencyRequest, error)
}

type IndentRepository interface {
	Create(ctx context.Context, indent *domain.Indent) error
	UpdateStatus(ctx context.Context, id uint, status string) error
	Update(ctx context.Context, indent *domain.Indent) error
	List(ctx context.Context) ([]domain.Indent, error)
	GetByID(ctx context.Context, id uint) (*domain.Indent, error)
}
