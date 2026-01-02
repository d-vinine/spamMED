package repositories

import (
	"context"
	"hospital-inventory/internal/core/domain"
	"hospital-inventory/internal/core/ports"

	"gorm.io/gorm"
)

type GormTransactionRepository struct {
	db *gorm.DB
}

func NewGormTransactionRepository(db *gorm.DB) ports.TransactionRepository {
	return &GormTransactionRepository{db: db}
}

func (r *GormTransactionRepository) Create(ctx context.Context, tx *domain.InventoryTransaction) error {
	return r.db.WithContext(ctx).Create(tx).Error
}

func (r *GormTransactionRepository) GetByItemID(ctx context.Context, itemID uint) ([]domain.InventoryTransaction, error) {
	var txs []domain.InventoryTransaction
	err := r.db.WithContext(ctx).Where("item_id = ?", itemID).Order("timestamp desc").Find(&txs).Error
	return txs, err
}

func (r *GormTransactionRepository) List(ctx context.Context) ([]domain.InventoryTransaction, error) {
	var txs []domain.InventoryTransaction
	// Preload Item and Batch, even if they are soft-deleted (Unscoped)
	err := r.db.WithContext(ctx).
		Preload("Item", func(db *gorm.DB) *gorm.DB {
			return db.Unscoped()
		}).
		Preload("Batch", func(db *gorm.DB) *gorm.DB {
			return db.Unscoped()
		}).
		Order("timestamp desc").
		Limit(100).
		Find(&txs).Error
	return txs, err
}
