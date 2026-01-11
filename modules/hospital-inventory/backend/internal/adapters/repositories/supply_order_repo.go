package repositories

import (
	"hospital-inventory/internal/core/domain"

	"gorm.io/gorm"
)

type SupplyOrderRepository struct {
	db *gorm.DB
}

func NewSupplyOrderRepository(db *gorm.DB) *SupplyOrderRepository {
	return &SupplyOrderRepository{db: db}
}

func (r *SupplyOrderRepository) CreateOrder(order *domain.SupplyOrder) error {
	return r.db.Create(order).Error
}

func (r *SupplyOrderRepository) ListOrders() ([]domain.SupplyOrder, error) {
	var orders []domain.SupplyOrder
	result := r.db.Order("created_at desc").Find(&orders)
	return orders, result.Error
}

func (r *SupplyOrderRepository) UpdateStatus(id string, status string) error {
	return r.db.Model(&domain.SupplyOrder{}).Where("id = ?", id).Update("status", status).Error
}
