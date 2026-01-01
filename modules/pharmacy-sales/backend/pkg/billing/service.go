package billing

import (
	"billing-module/pkg/finder"
	"billing-module/pkg/inventory"
	"billing-module/pkg/parser"
)

type SaleItem struct {
	CapturedName string         `json:"captured_name"`
	MatchedItem  inventory.Item `json:"matched_item"`
	Quantity     int            `json:"quantity"`
	Confidence   float64        `json:"confidence"`
	Status       string         `json:"status"` // "Available" or "OutOfStock"
}

func ProcessNote(note string, knowledgeBase map[string][]string) []SaleItem {
	var results []SaleItem

	// Parse
	parsed := parser.ParseLine(note)
	if parsed.LikelyName == "" {
		return results
	}

	// Find
	match := finder.FindBestMatch(parsed.LikelyName, inventory.MockInventory, knowledgeBase)

	if match != nil {
		status := "Available"
		if match.IsOutOfStock {
			status = "OutOfStock"
		}

		item := SaleItem{
			CapturedName: parsed.OriginalString,
			MatchedItem:  match.MatchedItem,
			Quantity:     parsed.Quantity,
			Confidence:   match.Confidence,
			Status:       status,
		}
		results = append(results, item)
	} else {
		// Unknown Item
		item := SaleItem{
			CapturedName: parsed.OriginalString,
			MatchedItem:  inventory.Item{Name: parsed.LikelyName, Price: 0, TotalQuantity: 0},
			Quantity:     parsed.Quantity,
			Confidence:   0,
			Status:       "Unknown",
		}
		results = append(results, item)
	}

	return results
}
