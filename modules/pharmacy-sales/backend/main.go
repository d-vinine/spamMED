package main

import (
	"billing-module/pkg/billing"
	"billing-module/pkg/db"
	"billing-module/pkg/inventory"
	"billing-module/pkg/knowledge"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

func main() {
	// Initialize Database
	database := db.InitDB("./inventory.db")
	defer database.Close()

	repo := inventory.NewRepository(database)
	repo.SeedData()

	knowledgeRepo := knowledge.NewRepository(database)
	knowledgeRepo.SeedKnowledge()

	// Load Inventory into Memory for Fuzzy Search (Compatibility)
	items, err := repo.GetAllItems()
	if err == nil {
		inventory.MockInventory = items
	} else {
		log.Printf("Failed to load inventory for cache: %v", err)
	}

	aliases, err := knowledgeRepo.GetAllAliases()
	if err == nil {
		knowledge.MedicineDictionary = aliases
	} else {
		log.Printf("Failed to load knowledge base: %v", err)
	}

	r := mux.NewRouter()
	r.Use(mux.CORSMethodMiddleware(r))

	// CORS Handler
	r.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
	}).Methods("OPTIONS")

	api := r.PathPrefix("/api").Subrouter()

	// Items
	api.HandleFunc("/items", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		if r.Method == "GET" {
			items, err := repo.GetAllItems()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			json.NewEncoder(w).Encode(items)
		} else if r.Method == "POST" {
			var newItem inventory.Item
			if err := json.NewDecoder(r.Body).Decode(&newItem); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			id, err := repo.CreateItem(newItem)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			// Add initial batch if present
			if len(newItem.Batches) > 0 {
				batch := newItem.Batches[0]
				batch.ItemID = int(id)
				repo.AddBatch(batch)
			}
			w.WriteHeader(http.StatusCreated)
		}
	}).Methods("GET", "POST", "OPTIONS")

	api.HandleFunc("/items/{id}", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		vars := mux.Vars(r)
		if r.Method == "PUT" {
			var item inventory.Item
			json.NewDecoder(r.Body).Decode(&item)
			if err := repo.UpdateItem(vars["id"], item); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusOK)
		}
	}).Methods("PUT", "OPTIONS")

	// Batches
	api.HandleFunc("/batches", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		if r.Method == "POST" {
			var batch inventory.Batch
			if err := json.NewDecoder(r.Body).Decode(&batch); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			if _, err := repo.AddBatch(batch); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusCreated)
		}
	}).Methods("POST", "OPTIONS")

	api.HandleFunc("/batches/{id}", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		vars := mux.Vars(r)
		if r.Method == "PUT" {
			var batch inventory.Batch
			json.NewDecoder(r.Body).Decode(&batch)
			if err := repo.UpdateBatch(vars["id"], batch); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusOK)
		}
	}).Methods("PUT", "OPTIONS")

	// Existing routes
	r.HandleFunc("/inventory", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		items, _ := repo.GetAllItems()
		json.NewEncoder(w).Encode(items)
	})

	r.HandleFunc("/process-sale", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		handleProcessSale(w, r)
	}).Methods("POST", "OPTIONS")

	r.PathPrefix("/").Handler(http.FileServer(http.Dir("../frontend")))

	fmt.Println("Server starting on :8080...")
	log.Fatal(http.ListenAndServe(":8080", r))
}

type SaleRequest struct {
	Note string `json:"note"`
}

func handleProcessSale(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	var req SaleRequest
	if err := json.Unmarshal(body, &req); err != nil {
		req.Note = string(body)
	}

	if req.Note == "" {
		http.Error(w, "Empty note provided", http.StatusBadRequest)
		return
	}

	sales := billing.ProcessNote(req.Note, knowledge.MedicineDictionary)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}
