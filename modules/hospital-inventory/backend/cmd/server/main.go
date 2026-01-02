package main

import (
	"fmt"
	"hospital-inventory/database"
	"hospital-inventory/internal/adapters/handlers"
	"hospital-inventory/internal/adapters/repositories"
	"hospital-inventory/internal/core/services"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Initialize Database
	database.Connect()
	db := database.DB

	// 2. Initialize Repositories
	itemRepo := repositories.NewGormItemRepository(db)
	batchRepo := repositories.NewGormBatchRepository(db)
	txRepo := repositories.NewGormTransactionRepository(db)

	// 3. Initialize Services
	inventoryService := services.NewInventoryService(itemRepo, batchRepo, txRepo)

	// 4. Initialize Handlers
	inventoryHandler := handlers.NewInventoryHandler(inventoryService)

	// 5. Setup Router
	r := gin.Default()

	// CORS Setup
	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// API Routes
	api := r.Group("/api")
	{
		api.GET("/items", inventoryHandler.GetItems)
		api.GET("/items/:id", inventoryHandler.GetItem)
		api.POST("/items", inventoryHandler.CreateItem)
		api.PUT("/items/:id", inventoryHandler.UpdateItem)
		api.DELETE("/items/:id", inventoryHandler.DeleteItem)

		api.POST("/batches", inventoryHandler.AddBatch)
		api.PUT("/batches/:id", inventoryHandler.UpdateBatch)
		api.DELETE("/batches/:id", inventoryHandler.DeleteBatch)

		// Audit Logs
		api.GET("/audit-logs", inventoryHandler.GetTransactions)
		// Dashboard Stats
		api.GET("/dashboard/stats", inventoryHandler.GetDashboardStats)
	}

	fmt.Println("Starting Modular Server on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
