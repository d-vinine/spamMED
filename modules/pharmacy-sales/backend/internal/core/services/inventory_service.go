package services

import (
	"billing-module/internal/core/domain"
	"billing-module/internal/core/ports"
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
