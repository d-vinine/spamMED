import React from 'react';
import InventoryTable from '../components/InventoryTable';

const Inventory = () => {
    return (
        <main className="workspace" style={{ gridColumn: '2 / -1', padding: '2rem' }}>
            <header className="bill-header" style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>📦 Inventory Management</h1>
            </header>

            <div id="wrapper">
                <InventoryTable />
            </div>
        </main>
    );
};

export default Inventory;
