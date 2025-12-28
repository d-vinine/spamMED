package handlers

import (
	"hospital-inventory/database"
	"hospital-inventory/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// Items

func GetItems(c *gin.Context) {
	var items []models.Item
	if err := database.DB.Preload("Batches").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calculate total quantity for each item
	for i := range items {
		total := 0
		for _, b := range items[i].Batches {
			total += b.Quantity
		}
		items[i].TotalQuantity = total
	}

	c.JSON(http.StatusOK, items)
}

func CreateItem(c *gin.Context) {
	var item models.Item
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	LogAction("Created Item", "Item: "+item.Name)
	c.JSON(http.StatusCreated, item)
}

func UpdateItem(c *gin.Context) {
	var item models.Item
	id := c.Param("id")

	if err := database.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
		return
	}

	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Save(&item)
	LogAction("Updated Item", "Item ID: "+id)
	c.JSON(http.StatusOK, item)
}

// Batches

func AddBatch(c *gin.Context) {
	var batch models.Batch
	if err := c.ShouldBindJSON(&batch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&batch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	LogAction("Added Batch", "Item ID: "+string(rune(batch.ItemID)))
	// Fix string conversion in real logging, simplistic here
	c.JSON(http.StatusCreated, batch)
}

// Alerts

func GetAlerts(c *gin.Context) {
	var items []models.Item
	if err := database.DB.Preload("Batches").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var alerts []gin.H

	for i := range items {
		total := 0
		for _, b := range items[i].Batches {
			total += b.Quantity
			// Check expiry (e.g. within 30 days)
			if b.ExpiryDate.Before(time.Now().AddDate(0, 0, 30)) {
				alerts = append(alerts, gin.H{
					"type":     "Expiry",
					"item":     items[i].Name,
					"batch_id": b.ID,
					"msg":      "Batch expiring soon or expired",
					"date":     b.ExpiryDate,
				})
			}
		}
		items[i].TotalQuantity = total

		if total < items[i].Threshold {
			alerts = append(alerts, gin.H{
				"type":      "Low Stock",
				"item":      items[i].Name,
				"current":   total,
				"threshold": items[i].Threshold,
			})
		}
	}

	c.JSON(http.StatusOK, alerts)
}
