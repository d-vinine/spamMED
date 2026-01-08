package handlers

import (
	"hospital-inventory/internal/core/domain"
	"hospital-inventory/internal/core/ports"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type IndentHandler struct {
	service ports.IndentService
}

func NewIndentHandler(service ports.IndentService) *IndentHandler {
	return &IndentHandler{service: service}
}

func (h *IndentHandler) CreateIndent(c *gin.Context) {
	var indent domain.Indent
	if err := c.ShouldBindJSON(&indent); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CreateIndent(c.Request.Context(), &indent); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, indent)
}

func (h *IndentHandler) ListIndents(c *gin.Context) {
	indents, err := h.service.ListIndents(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, indents)
}

func (h *IndentHandler) GetIndent(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	indent, err := h.service.GetIndent(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Indent not found"})
		return
	}
	c.JSON(http.StatusOK, indent)
}

func (h *IndentHandler) ProcessIndent(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ProcessIndent(c.Request.Context(), uint(id), req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Indent status updated"})
}
