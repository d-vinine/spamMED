package database

import (
	"hospital-inventory/models"
	"log"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	var err error
	DB, err = gorm.Open(sqlite.Open("inventory.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = DB.AutoMigrate(&models.Item{}, &models.Batch{}, &models.Log{}, &models.EmergencyRequest{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	log.Println("Database connected and migrated successfully")
}
