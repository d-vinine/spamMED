# spamMED

**spamMED** is a comprehensive hospital management system aimed at streamlining inventory tracking and pharmacy sales. It features a modular architecture designed to handle the distinct yet interconnected needs of hospital supply chains and retail pharmacy operations.

## modules

The project is divided into two primary modules:

### 1. Hospital Inventory
Manages the core medical supplies of the hospital.
*   **Inventory Tracking**: Monitor stock levels, low-stock alerts, and expiring batches.
*   **Supply Orders**: Generate professional PDF purchase orders for external suppliers, with intelligent auto-fill based on consumption.
*   **Internal Indents**: Process stock requests (indents) from the Pharmacy module.

### 2. Pharmacy Sales
Handles the retail side of the hospital's pharmacy.
*   **POS (Point of Sale)**: Process sales with a natural language interface (e.g., "PC 1 strip, Dolo 1 pack").
*   **Smart Inventory**: Manage batch-wise inventory (FIFO) separated from the main hospital stock.
*   **Indent System**: Raise stock requests to the main hospital inventory when supplies run low, with visual suggestions for low stock/expiring items.
*   **Knowledge Base**: Shared repository of medicine names and aliases (e.g., "Crocin" -> "Paracetamol") to speed up billing and ordering.

## Getting Started

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/d-vinine/spamMED.git
    cd spamMED
    ```

2.  **Start the application**:
    ```bash
    docker compose up --build
    ```

3.  **Access the modules**:
    *   **Hospital Inventory**: `http://localhost:3000`
    *   **Pharmacy Sales**: `http://localhost:3001`

### Default Ports
*   **Hospital Frontend**: 3000
*   **Hospital Backend**: 8080
*   **Pharmacy Frontend**: 3001
*   **Pharmacy Backend**: 8081

## Key Features

*   **Cross-Module Communication**: The Pharmacy module can "raise indents" which appear in the Hospital module. Once dispatched by the Hospital, the Pharmacy can "receive" them to update local stock.
*   **Smart PDF Generation**: Generate POs with `jspdf` including custom branding and tabular data.
*   **Shared Knowledge Base**: A centralized list of item names helps maintain consistency across both modules while keeping inventory counts separate.