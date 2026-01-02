package domain

type DashboardStats struct {
	TotalItems    int64   `json:"total_items"`
	TotalValue    float64 `json:"total_value"`
	LowStockItems int64   `json:"low_stock_items"`
	ExpiredItems  int64   `json:"expired_items"`
}
