package handlers

import (
	"hospital-inventory/internal/adapters/repositories" // Assuming we use concrete repo for now as per other handlers
	"hospital-inventory/internal/core/domain"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type SupplyOrderHandler struct {
	Repo *repositories.SupplyOrderRepository
}

func NewSupplyOrderHandler(repo *repositories.SupplyOrderRepository) *SupplyOrderHandler {
	return &SupplyOrderHandler{Repo: repo}
}

// CreateOrder handles POST /api/orders
func (h *SupplyOrderHandler) CreateOrder(c *gin.Context) {
	var req struct {
		SupplierName string  `json:"supplier_name"`
		Items        string  `json:"items"` // JSON string
		TotalCost    float64 `json:"total_cost"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order := domain.SupplyOrder{
		SupplierName: req.SupplierName,
		Status:       "Pending",
		OrderDate:    time.Now(),
		Items:        req.Items,
		TotalCost:    req.TotalCost,
	}

	if err := h.Repo.CreateOrder(&order); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	c.JSON(http.StatusCreated, order)
}

// ListOrders handles GET /api/orders
func (h *SupplyOrderHandler) ListOrders(c *gin.Context) {
	orders, err := h.Repo.ListOrders()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}
	c.JSON(http.StatusOK, orders)
}

// UpdateStatus handles PUT /api/orders/:id/status
func (h *SupplyOrderHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status string `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Repo.UpdateStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated"})
}
