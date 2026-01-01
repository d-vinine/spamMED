package handlers

import (
	"hospital-inventory/database"
	"hospital-inventory/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func CreateRequest(c *gin.Context) {
	var req models.EmergencyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.Status = "Pending"
	req.CreatedAt = time.Now()

	if err := database.DB.Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	LogAction("Emergency Request", "For: "+req.ItemName)
	c.JSON(http.StatusCreated, req)
}

func GetRequests(c *gin.Context) {
	var reqs []models.EmergencyRequest
	if err := database.DB.Order("created_at desc").Find(&reqs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reqs)
}

func UpdateRequestStatus(c *gin.Context) {
	id := c.Param("id")
	var req models.EmergencyRequest

	if err := database.DB.First(&req, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	var input struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.Status = input.Status
	database.DB.Save(&req)
	LogAction("Updated Request", "ID: "+id+" to "+req.Status)
	c.JSON(http.StatusOK, req)
}
