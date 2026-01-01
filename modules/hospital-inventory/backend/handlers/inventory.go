package handlers

import (
	"hospital-inventory/database"
	"hospital-inventory/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

	// Use FullSaveAssociations to update nested Batches as well
	database.DB.Session(&gorm.Session{FullSaveAssociations: true}).Save(&item)
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

	// Fix string conversion
	LogAction("Added Batch", "Item ID: "+strconv.Itoa(int(batch.ItemID)))
	c.JSON(http.StatusCreated, batch)
}

func UpdateBatch(c *gin.Context) {
	var batch models.Batch
	id := c.Param("id")

	if err := database.DB.First(&batch, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Batch not found"})
		return
	}

	// We only want to update specific fields, but binding JSON is easiest.
	// Ensure ID stays same.
	if err := c.ShouldBindJSON(&batch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Force ID to match URL param just in case
	batchID, _ := strconv.Atoi(id)
	batch.ID = uint(batchID)

	if err := database.DB.Save(&batch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	LogAction("Updated Batch", "Batch ID: "+id)
	c.JSON(http.StatusOK, batch)
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
