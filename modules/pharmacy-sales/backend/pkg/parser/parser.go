package parser

import (
	"regexp"
	"strconv"
	"strings"
)

type ParsedItem struct {
	OriginalString string
	LikelyName     string
	Quantity       int
}

var quantityRegex = regexp.MustCompile(`(\d+)`)

// Stopwords to filter out during parsing
var stopWords = map[string]bool{
	"goli": true, "tablet": true, "tablets": true, "strip": true, "patta": true,
	"pack": true, "pcs": true, "dawa": true, "chaiye": true, "dena": true,
}

func ParseLine(line string) ParsedItem {
	line = strings.ToLower(line)
	qty := 1

	// Extract quantity
	matches := quantityRegex.FindStringSubmatch(line)
	if len(matches) > 1 {
		if q, err := strconv.Atoi(matches[1]); err == nil {
			qty = q
		}
		// Remove quantity from line
		line = quantityRegex.ReplaceAllString(line, "")
	}

	// Clean up words
	words := strings.Fields(line)
	var cleanWords []string
	for _, w := range words {
		if !stopWords[w] {
			cleanWords = append(cleanWords, w)
		}
	}

	likelyName := strings.Join(cleanWords, " ")

	return ParsedItem{
		OriginalString: line,
		LikelyName:     likelyName,
		Quantity:       qty,
	}
}
