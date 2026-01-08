package ports

import "billing-module/internal/core/domain"

type ItemRepository interface {
	GetAllItems() ([]domain.Item, error)
	CreateItem(item domain.Item) (int64, error)
	UpdateItem(id string, item domain.Item) error
	AddBatch(batch domain.Batch) (int64, error)
	UpdateBatch(id string, batch domain.Batch) error
	SeedData() // For demo purposes
}

type KnowledgeRepository interface {
	GetAllAliases() (map[string][]string, error)
	SeedKnowledge() // For demo purposes
}

type BillingService interface {
	ProcessNote(note string) []domain.SaleItem
}

type InventoryService interface {
	GetAllItems() ([]domain.Item, error)
	CreateItem(item domain.Item) (int64, error)
	UpdateItem(id string, item domain.Item) error
	AddBatch(batch domain.Batch) (int64, error)
	UpdateBatch(id string, batch domain.Batch) error
	ReceiveIndent(indentID int) error
}
