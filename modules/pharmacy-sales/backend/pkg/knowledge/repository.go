package knowledge

import (
	"database/sql"
	"log"
)

type Repository struct {
	DB *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{DB: db}
}

// GetAllAliases returns the dictionary in the format expected by the finder
func (r *Repository) GetAllAliases() (map[string][]string, error) {
	rows, err := r.DB.Query("SELECT canonical_name, alias FROM medicine_aliases")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string][]string)
	for rows.Next() {
		var canonical, alias string
		if err := rows.Scan(&canonical, &alias); err != nil {
			return nil, err
		}
		result[canonical] = append(result[canonical], alias)
	}
	return result, nil
}

// SeedKnowledge populates the DB with the initial hardcoded dictionary
func (r *Repository) SeedKnowledge() {
	// Check if data exists
	var count int
	r.DB.QueryRow("SELECT COUNT(*) FROM medicine_aliases").Scan(&count)
	if count > 0 {
		return // Already seeded
	}

	log.Println("Seeding knowledge base...")

	// Initial Data (Moved from medicines.go)
	initialData := map[string][]string{
		"Dolo-650":          {"dolo", "dolo 650", "bukhar ki dawa"},
		"Paracetamol 500mg": {"para", "pcm", "paracetamol", "crocin"},
		"Azithral 500":      {"azee", "azi", "azithromycine"},
		"Pan 40":            {"pan", "pantop", "gastric"},
		"Cough Syrup":       {"cough", "syrup", "kuf", "benadryl"},
		"Voveran SR":        {"voveran", "painkiller", "diclofenac"},
		"Augmentin 625":     {"aug", "augmentin", "antibiotic"},
		"Metrogyl 400":      {"metro", "loose motion", "stomach"},
		"Pantocid 40":       {"panto", "acidity", "gas capsule"},
		"Montair LC":        {"montair", "allergy", "sardi", "cold"},
		"Allegra 120":       {"allegra", "skin allergy", "khujli"},
		"Combiflam":         {"combi", "body pain", "dard"},
		"Shelcal 500":       {"shelcal", "calcium", "haddi", "bone"},
		"Limcee 500":        {"limcee", "vitamin c", "orange goli"},
		"Becosules":         {"beco", "b complex", "mouth ulcer", "chale"},
		"Ascoril LS":        {"ascoril", "wet cough", "khansi syrup"},
		"Digene Gel":        {"digene", "pink syrup", "acidity liquid"},
		"Telma 40":          {"telma", "bp", "blood pressure"},
		"Glycomet 500":      {"glycomet", "sugar", "diabetes"},
	}

	tx, err := r.DB.Begin()
	if err != nil {
		log.Printf("Failed to begin transaction for knowledge seeding: %v", err)
		return
	}

	stmt, err := tx.Prepare("INSERT INTO medicine_aliases (canonical_name, alias) VALUES (?, ?)")
	if err != nil {
		log.Printf("Failed to prepare statement: %v", err)
		tx.Rollback()
		return
	}
	defer stmt.Close()

	for canonical, aliases := range initialData {
		for _, alias := range aliases {
			_, err := stmt.Exec(canonical, alias)
			if err != nil {
				log.Printf("Failed to insert alias %s -> %s: %v", canonical, alias, err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Failed to commit knowledge seeding: %v", err)
	} else {
		log.Println("Knowledge base seeded successfully.")
	}
}
