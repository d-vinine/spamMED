package main

import (
	"fmt"
	"hospital-inventory/database"
	"hospital-inventory/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize Database
	database.Connect()

	r := gin.Default()

	// CORS Setup
	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true, // [DEV] Allow all for dynamic ports
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// API Routes
	api := r.Group("/api")
	{
		api.GET("/items", handlers.GetItems)
		api.POST("/items", handlers.CreateItem)
		api.PUT("/items/:id", handlers.UpdateItem)

		api.POST("/batches", handlers.AddBatch)
		api.PUT("/batches/:id", handlers.UpdateBatch)

		api.GET("/alerts", handlers.GetAlerts)

		api.GET("/logs", handlers.GetLogs)

		api.GET("/requests", handlers.GetRequests)
		api.POST("/requests", handlers.CreateRequest)
		api.PUT("/requests/:id/status", handlers.UpdateRequestStatus)
	}

	fmt.Println("Server starting on :8080")
	r.Run(":8080")
}
