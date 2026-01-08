package handlers

import (
	"billing-module/internal/core/domain"
	"billing-module/internal/core/ports"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gorilla/mux"
)

type HTTPHandler struct {
	inventoryService ports.InventoryService
	billingService   ports.BillingService
}

func NewHTTPHandler(inventoryService ports.InventoryService, billingService ports.BillingService) *HTTPHandler {
	return &HTTPHandler{
		inventoryService: inventoryService,
		billingService:   billingService,
	}
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

// Items Handlers

func (h *HTTPHandler) HandleItems(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "GET" {
		items, err := h.inventoryService.GetAllItems()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(items)
	} else if r.Method == "POST" {
		var newItem domain.Item
		if err := json.NewDecoder(r.Body).Decode(&newItem); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		id, err := h.inventoryService.CreateItem(newItem)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		// Add initial batch if present
		if len(newItem.Batches) > 0 {
			batch := newItem.Batches[0]
			batch.ItemID = int(id)
			h.inventoryService.AddBatch(batch)
		}
		w.WriteHeader(http.StatusCreated)
	}
}

func (h *HTTPHandler) HandleItemDetail(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	vars := mux.Vars(r)
	if r.Method == "PUT" {
		var item domain.Item
		json.NewDecoder(r.Body).Decode(&item)
		if err := h.inventoryService.UpdateItem(vars["id"], item); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

// Batch Handlers

func (h *HTTPHandler) HandleBatches(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "POST" {
		var batch domain.Batch
		if err := json.NewDecoder(r.Body).Decode(&batch); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if _, err := h.inventoryService.AddBatch(batch); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
	}
}

func (h *HTTPHandler) HandleBatchDetail(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	vars := mux.Vars(r)
	if r.Method == "PUT" {
		var batch domain.Batch
		json.NewDecoder(r.Body).Decode(&batch)
		if err := h.inventoryService.UpdateBatch(vars["id"], batch); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

// Sales Handler

type SaleRequest struct {
	Note string `json:"note"`
}

func (h *HTTPHandler) HandleProcessSale(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	var req SaleRequest
	if err := json.Unmarshal(body, &req); err != nil {
		req.Note = string(body)
	}

	if req.Note == "" {
		http.Error(w, "Empty note provided", http.StatusBadRequest)
		return
	}

	sales := h.billingService.ProcessNote(req.Note)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}

func (h *HTTPHandler) HandleReceiveIndent(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method == "POST" {
		var req struct {
			IndentID int `json:"indent_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if err := h.inventoryService.ReceiveIndent(req.IndentID); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "success"})
	}
}

func (h *HTTPHandler) OptionsHandler(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	w.WriteHeader(http.StatusOK)
}
