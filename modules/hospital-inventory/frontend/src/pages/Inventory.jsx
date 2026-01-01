import InventoryTable from '../components/Inventory/InventoryTable';

const Inventory = () => {
    return (
        <div style={{ paddingBottom: '2rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Inventory Management</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Manage stock levels, track batch locations, and monitor expiry dates.</p>
            </header>

            <InventoryTable />
        </div>
    );
};

export default Inventory;
