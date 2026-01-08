package repositories

import (
	"context"
	"hospital-inventory/internal/core/domain"
	"hospital-inventory/internal/core/ports"

	"gorm.io/gorm"
)

type GormIndentRepository struct {
	db *gorm.DB
}

func NewGormIndentRepository(db *gorm.DB) ports.IndentRepository {
	return &GormIndentRepository{db: db}
}

func (r *GormIndentRepository) Create(ctx context.Context, indent *domain.Indent) error {
	return r.db.WithContext(ctx).Create(indent).Error
}

func (r *GormIndentRepository) UpdateStatus(ctx context.Context, id uint, status string) error {
	return r.db.WithContext(ctx).Model(&domain.Indent{}).Where("id = ?", id).Update("status", status).Error
}

func (r *GormIndentRepository) Update(ctx context.Context, indent *domain.Indent) error {
	return r.db.WithContext(ctx).Save(indent).Error
}

func (r *GormIndentRepository) List(ctx context.Context) ([]domain.Indent, error) {
	var indents []domain.Indent
	err := r.db.WithContext(ctx).Order("created_at desc").Find(&indents).Error
	return indents, err
}

func (r *GormIndentRepository) GetByID(ctx context.Context, id uint) (*domain.Indent, error) {
	var indent domain.Indent
	err := r.db.WithContext(ctx).First(&indent, id).Error
	return &indent, err
}
