package handlers

import (
	"fmt"
	"hospital-inventory/internal/core/domain"
	"hospital-inventory/internal/core/ports"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type InventoryHandler struct {
	inventoryService ports.InventoryService
}

func NewInventoryHandler(service ports.InventoryService) *InventoryHandler {
	return &InventoryHandler{inventoryService: service}
}

// GetItems godoc
// @Summary Get all items
func (h *InventoryHandler) GetItems(c *gin.Context) {
	items, err := h.inventoryService.ListItems(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

// CreateItem godoc
// @Summary Create a new item
type createItemRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Threshold   int      `json:"threshold"`
	Unit        string   `json:"unit"`
	BatchNumber string   `json:"batch_number"`
	Quantity    int      `json:"quantity"`
	ExpiryDate  string   `json:"expiry_date"` // YYYY-MM-DD
	Location    string   `json:"location"`
	MRP         *float64 `json:"mrp"`
}

func (h *InventoryHandler) CreateItem(c *gin.Context) {
	var req createItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item := &domain.Item{
		Name:        req.Name,
		Description: req.Description,
		Threshold:   req.Threshold,
		Unit:        req.Unit,
	}

	var batch *domain.Batch
	if req.BatchNumber != "" {
		expiry, err := time.Parse("2006-01-02", req.ExpiryDate)
		if err != nil && req.ExpiryDate != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid expiry date format, use YYYY-MM-DD"})
			return
		}

		// If expiry is empty/zero, maybe default or leave as is (though business logic usually requires it for batches)
		// but let's assume if batch number is provided, we try to create a batch.

		batch = &domain.Batch{
			BatchNumber: req.BatchNumber,
			Quantity:    req.Quantity,
			ExpiryDate:  expiry,
			Location:    req.Location,
			MRP:         req.MRP,
		}
	}

	if err := h.inventoryService.CreateItem(c.Request.Context(), item, batch); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create item"})
		return
	}

	c.JSON(http.StatusCreated, item)
}

// AddBatch godoc
// @Summary Add a batch to an item
type addBatchRequest struct {
	ItemID      uint     `json:"item_id"`
	BatchNumber string   `json:"batch_number"`
	Quantity    int      `json:"quantity"`
	ExpiryDate  string   `json:"expiry_date"` // YYYY-MM-DD
	Location    string   `json:"location"`
	MRP         *float64 `json:"mrp"`
}

// AddBatch godoc
// @Summary Add a batch to an item
func (h *InventoryHandler) AddBatch(c *gin.Context) {
	var req addBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	expiry, err := time.Parse("2006-01-02", req.ExpiryDate)
	if err != nil && req.ExpiryDate != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid expiry date format, use YYYY-MM-DD"})
		return
	}

	batch := &domain.Batch{
		ItemID:      req.ItemID,
		BatchNumber: req.BatchNumber,
		Quantity:    req.Quantity,
		ExpiryDate:  expiry,
		Location:    req.Location,
		MRP:         req.MRP,
	}

	// TODO: Get real User ID from Context (Auth Middleware)
	userID := "system"

	if err := h.inventoryService.AddBatch(c.Request.Context(), batch, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, batch)
}

// UpdateBatch godoc
// @Summary Update a batch
func (h *InventoryHandler) UpdateBatch(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Batch ID"})
		return
	}

	var req addBatchRequest // Reuse request struct as fields are same
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	expiry, err := time.Parse("2006-01-02", req.ExpiryDate)
	if err != nil && req.ExpiryDate != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid expiry date format, use YYYY-MM-DD"})
		return
	}

	batch := &domain.Batch{
		BaseModel:   domain.BaseModel{ID: uint(id)},
		ItemID:      req.ItemID,
		BatchNumber: req.BatchNumber,
		Quantity:    req.Quantity,
		ExpiryDate:  expiry,
		Location:    req.Location,
		MRP:         req.MRP,
	}

	// TODO: Get real User ID
	userID := "system"

	if err := h.inventoryService.UpdateBatch(c.Request.Context(), batch, "Manual Update", userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, batch)
}

// DeleteBatch godoc
// @Summary Delete a batch
func (h *InventoryHandler) DeleteBatch(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Batch ID"})
		return
	}

	// TODO: Get real User ID
	userID := "system"

	if err := h.inventoryService.DeleteBatch(c.Request.Context(), uint(id), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Batch deleted"})
}

// GetItem godoc
func (h *InventoryHandler) GetItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	item, err := h.inventoryService.GetItem(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// UpdateItem godoc
// @Summary Update an item
type updateItemRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Threshold   int    `json:"threshold"`
	Unit        string `json:"unit"`
}

func (h *InventoryHandler) UpdateItem(c *gin.Context) {
	fmt.Println("Received UpdateItem request")
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	fmt.Printf("Parsing ID: %s -> %d (err: %v)\n", idStr, id, err)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req updateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("Binding JSON failed: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fmt.Printf("Update Payload: %+v\n", req)

	// Fetch existing to update fields
	item, err := h.inventoryService.GetItem(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
		return
	}

	item.Name = req.Name
	item.Description = req.Description
	item.Threshold = req.Threshold
	item.Unit = req.Unit

	if err := h.inventoryService.UpdateItem(c.Request.Context(), item); err != nil {
		fmt.Printf("Error updating item %d: %v\n", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

// DeleteItem godoc
// @Summary Delete an item
func (h *InventoryHandler) DeleteItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.inventoryService.DeleteItem(c.Request.Context(), uint(id)); err != nil {
		fmt.Printf("Error deleting item %d: %v\n", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Item deleted"})
}
