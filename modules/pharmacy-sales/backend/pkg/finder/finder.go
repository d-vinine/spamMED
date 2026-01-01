package finder

import (
	"billing-module/pkg/inventory"
	"sort"
	"strings"
)

type MatchResult struct {
	MatchedItem  inventory.Item
	Confidence   float64
	IsOutOfStock bool
}

// simple levenshtein implementation
func levenshtein(s1, s2 string) int {
	r1, r2 := []rune(s1), []rune(s2)
	n, m := len(r1), len(r2)
	if n > m {
		return levenshtein(s2, s1)
	}
	currentRow := make([]int, n+1)
	for i := 0; i <= n; i++ {
		currentRow[i] = i
	}
	for i := 1; i <= m; i++ {
		previousRow := currentRow
		currentRow = make([]int, n+1)
		currentRow[0] = i
		for j := 1; j <= n; j++ {
			add, del, change := previousRow[j]+1, currentRow[j-1]+1, previousRow[j-1]
			if r1[j-1] != r2[i-1] {
				change++
			}
			if add < del && add < change {
				currentRow[j] = add
			} else if del < change {
				currentRow[j] = del
			} else {
				currentRow[j] = change
			}
		}
	}
	return currentRow[n]
}

type conceptMatch struct {
	ConceptName string
	Score       float64
}

func FindBestMatch(query string, items []inventory.Item, knowledgeBase map[string][]string) *MatchResult {
	query = strings.ToLower(strings.TrimSpace(query))
	bestMatch := &MatchResult{Confidence: 0.0}

	// 1. Search Knowledge Base
	var possibleConcepts []conceptMatch

	for canonicalName, aliases := range knowledgeBase {
		bestScore := 0.0
		// Check canonical name
		dist := levenshtein(query, strings.ToLower(canonicalName))
		score := 1.0 - (float64(dist) / float64(max(len(query), len(canonicalName))))

		if strings.HasPrefix(strings.ToLower(canonicalName), query) {
			score += 0.2 // Boost prefix
		}
		if score > bestScore {
			bestScore = score
		}

		// Check aliases
		for _, alias := range aliases {
			dist := levenshtein(query, alias)
			aliasScore := 1.0 - (float64(dist) / float64(max(len(query), len(alias))))
			if strings.HasPrefix(alias, query) {
				aliasScore += 0.2
			}
			if aliasScore > bestScore {
				bestScore = aliasScore
			}
		}

		if bestScore > 0.4 {
			possibleConcepts = append(possibleConcepts, conceptMatch{ConceptName: canonicalName, Score: bestScore})
		}
	}

	// Sort by score
	sort.Slice(possibleConcepts, func(i, j int) bool {
		return possibleConcepts[i].Score > possibleConcepts[j].Score
	})

	if len(possibleConcepts) == 0 {
		return nil
	}

	bestConcept := possibleConcepts[0]

	// 2. Link to Inventory
	foundInInventory := false
	for _, item := range items {
		if strings.EqualFold(item.Name, bestConcept.ConceptName) {
			bestMatch.MatchedItem = item
			bestMatch.Confidence = bestConcept.Score
			bestMatch.IsOutOfStock = false
			foundInInventory = true
			break
		}
	}

	// 3. Handle OOS
	if !foundInInventory {
		bestMatch.MatchedItem = inventory.Item{Name: bestConcept.ConceptName, Price: 0, TotalQuantity: 0}
		bestMatch.Confidence = bestConcept.Score
		bestMatch.IsOutOfStock = true
	}

	return bestMatch
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
