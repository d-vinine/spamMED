package repositories

import (
	"context"
	"hospital-inventory/internal/core/domain"
	"hospital-inventory/internal/core/ports"

	"gorm.io/gorm"
)

type GormItemRepository struct {
	db *gorm.DB
}

func NewGormItemRepository(db *gorm.DB) ports.ItemRepository {
	return &GormItemRepository{db: db}
}

func (r *GormItemRepository) Create(ctx context.Context, item *domain.Item) error {
	return r.db.WithContext(ctx).Create(item).Error
}

func (r *GormItemRepository) GetByID(ctx context.Context, id uint) (*domain.Item, error) {
	var item domain.Item
	// Preload Batches and Category
	err := r.db.WithContext(ctx).Preload("Batches").Preload("Category").First(&item, id).Error
	return &item, err
}

func (r *GormItemRepository) GetByName(ctx context.Context, name string) (*domain.Item, error) {
	var item domain.Item
	err := r.db.WithContext(ctx).Preload("Batches").Preload("Category").Where("name = ?", name).First(&item).Error
	return &item, err
}

func (r *GormItemRepository) Update(ctx context.Context, item *domain.Item) error {
	return r.db.WithContext(ctx).Omit("Batches", "Category").Save(item).Error
}

func (r *GormItemRepository) List(ctx context.Context) ([]domain.Item, error) {
	var items []domain.Item
	// Only list items clearly associated with hospital inventory (have batches)
	err := r.db.WithContext(ctx).
		Distinct("items.*").
		Joins("INNER JOIN hospital_batches ON hospital_batches.item_id = items.id").
		Preload("Batches").
		Preload("Category").
		Find(&items).Error
	return items, err
}

func (r *GormItemRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.Item{}, id).Error
}

func (r *GormItemRepository) GetKnowledgeBase(ctx context.Context) ([]domain.Item, error) {
	var items []domain.Item
	// Fetch ALL items, ignoring batch associations (except for preloading category/batches if we want details, but usually just name/desc is enough)
	// We still preload to keep struct consistent, but we DO NOT JOIN with hospital_batches here.
	err := r.db.WithContext(ctx).Preload("Category").Find(&items).Error
	return items, err
}

type GormBatchRepository struct {
	db *gorm.DB
}

func NewGormBatchRepository(db *gorm.DB) ports.BatchRepository {
	return &GormBatchRepository{db: db}
}

func (r *GormBatchRepository) Create(ctx context.Context, batch *domain.Batch) error {
	return r.db.WithContext(ctx).Create(batch).Error
}

func (r *GormBatchRepository) Update(ctx context.Context, batch *domain.Batch) error {
	return r.db.WithContext(ctx).Save(batch).Error
}

func (r *GormBatchRepository) GetByID(ctx context.Context, id uint) (*domain.Batch, error) {
	var batch domain.Batch
	err := r.db.WithContext(ctx).First(&batch, id).Error
	return &batch, err
}

func (r *GormBatchRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.Batch{}, id).Error
}

func (r *GormBatchRepository) GetByItemID(ctx context.Context, itemID uint) ([]domain.Batch, error) {
	var batches []domain.Batch
	err := r.db.WithContext(ctx).Where("item_id = ?", itemID).Order("expiry_date asc").Find(&batches).Error
	return batches, err
}
