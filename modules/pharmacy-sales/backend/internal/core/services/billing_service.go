package services

import (
	"billing-module/internal/core/domain"
	"billing-module/internal/core/ports"
	"billing-module/internal/core/services/sales"
	"log"
)

type BillingService struct {
	itemRepo      ports.ItemRepository
	knowledgeRepo ports.KnowledgeRepository
}

func NewBillingService(itemRepo ports.ItemRepository, knowledgeRepo ports.KnowledgeRepository) *BillingService {
	return &BillingService{
		itemRepo:      itemRepo,
		knowledgeRepo: knowledgeRepo,
	}
}

func (s *BillingService) ProcessNote(note string) []domain.SaleItem {
	var results []domain.SaleItem

	// Parse
	parsed := sales.ParseLine(note)
	if parsed.LikelyName == "" {
		return results
	}

	// Fetch data for fuzzy search
	// Optimization: In a real app, these should be cached.
	items, err := s.itemRepo.GetAllItems()
	if err != nil {
		log.Printf("Error fetching items for billing: %v", err)
		return results
	}

	knowledgeBase, err := s.knowledgeRepo.GetAllAliases()
	if err != nil {
		log.Printf("Error fetching knowledge base for billing: %v", err)
		return results
	}

	// Find
	match := sales.FindBestMatch(parsed.LikelyName, items, knowledgeBase)

	if match != nil {
		status := "Available"
		if match.IsOutOfStock {
			status = "OutOfStock"
		}

		item := domain.SaleItem{
			CapturedName: parsed.OriginalString,
			MatchedItem:  match.MatchedItem,
			Quantity:     parsed.Quantity,
			Confidence:   match.Confidence,
			Status:       status,
		}
		results = append(results, item)
	} else {
		// Unknown Item
		item := domain.SaleItem{
			CapturedName: parsed.OriginalString,
			MatchedItem:  domain.Item{Name: parsed.LikelyName, Price: 0, TotalQuantity: 0},
			Quantity:     parsed.Quantity,
			Confidence:   0,
			Status:       "Unknown",
		}
		results = append(results, item)
	}

	return results
}
