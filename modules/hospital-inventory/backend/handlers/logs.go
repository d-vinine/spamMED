package handlers

import (
	"hospital-inventory/database"
	"hospital-inventory/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func GetLogs(c *gin.Context) {
	var logs []models.Log
	if err := database.DB.Order("timestamp desc").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, logs)
}

func LogAction(action, details string) {
	newLog := models.Log{
		Action:    action,
		Details:   details,
		Timestamp: time.Now(),
	}
	database.DB.Create(&newLog)
}
