package main

import (
	"billing-module/internal/adapters/handlers"
	"billing-module/internal/adapters/repositories"
	"billing-module/internal/core/services"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	// 1. Initialize Database
	db := repositories.InitDB("/app/data/spammed.db")
	defer db.Close()

	// 2. Initialize Repositories
	repo := repositories.NewSQLiteRepository(db)
	// Seed Data if needed
	repo.SeedData()
	repo.SeedKnowledge()

	// 3. Initialize Services
	inventoryService := services.NewInventoryService(repo)
	billingService := services.NewBillingService(repo, repo)

	// 4. Initialize Handlers
	h := handlers.NewHTTPHandler(inventoryService, billingService)

	// 5. Setup Router
	r := mux.NewRouter()
	r.Use(mux.CORSMethodMiddleware(r))

	api := r.PathPrefix("/api").Subrouter()

	// Items
	api.HandleFunc("/items", h.HandleItems).Methods("GET", "POST", "OPTIONS")
	api.HandleFunc("/items/knowledge-base", h.HandleKnowledgeBase).Methods("GET", "OPTIONS")
	api.HandleFunc("/items/{id}", h.HandleItemDetail).Methods("PUT", "DELETE", "OPTIONS")

	// Batches
	api.HandleFunc("/batches", h.HandleBatches).Methods("POST", "OPTIONS")
	api.HandleFunc("/batches/{id}", h.HandleBatchDetail).Methods("PUT", "DELETE", "OPTIONS")

	// Sales
	r.HandleFunc("/process-sale", h.HandleProcessSale).Methods("POST", "OPTIONS")
	r.HandleFunc("/receive-indent", h.HandleReceiveIndent).Methods("POST", "OPTIONS")

	// Serve Frontend (legacy route)
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("../frontend")))

	fmt.Println("Starting Modular Server on :8081...")
	log.Fatal(http.ListenAndServe(":8081", r))
}
