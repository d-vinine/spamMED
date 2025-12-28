import { useState } from 'react';
import { Search, Filter, MoreVertical, MapPin, AlertCircle } from 'lucide-react';
import ItemModal from './ItemModal';

const InventoryTable = () => {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Mock Data
    const inventoryItems = [
        { id: 1, name: 'Paracetamol 500mg', category: 'Medicine', stock: 1250, min: 500, unit: 'Strip', batch: 'B-1023', location: 'Shelf A-12', expiry: '2024-12-01', status: 'good' },
        { id: 2, name: 'Amoxicillin 500mg', category: 'Medicine', stock: 45, min: 100, unit: 'Box', batch: 'B-1045', location: 'Shelf B-05', expiry: '2024-08-15', status: 'low' },
        { id: 3, name: 'Surgical Gloves (M)', category: 'Equip', stock: 12, min: 50, unit: 'Box', batch: 'SG-221', location: 'Room 3', expiry: '2025-01-20', status: 'critical' },
        { id: 4, name: 'Insulin Glargine', category: 'Medicine', stock: 15, min: 10, unit: 'Vial', batch: 'IN-998', location: 'Fridge 1', expiry: '2023-12-30', status: 'expiring' },
        { id: 5, name: 'Cotton Roll 500g', category: 'Consumable', stock: 80, min: 20, unit: 'Roll', batch: 'CR-112', location: 'Shelf C-01', expiry: '2026-05-10', status: 'good' },
    ];

    const getStatusBadge = (status, stock, min) => {
        if (status === 'critical' || stock <= min / 2) {
            return <span className="badge badge-danger">Critical</span>;
        } else if (status === 'low' || stock <= min) {
            return <span className="badge badge-warning">Low Stock</span>;
        } else if (status === 'expiring') { // Simplified logic for demo
            return <span className="badge badge-warning">Expiring</span>;
        }
        return <span className="badge badge-success">Normally Stocked</span>;
    };

    const filteredItems = inventoryItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.batch.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'low' && (item.stock <= item.min || item.status === 'critical')) ||
            (filter === 'expiring' && item.status === 'expiring');
        return matchesSearch && matchesFilter;
    });

    const handleEdit = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const handleAddNew = () => {
        setSelectedItem(null);
        setShowModal(true);
    };

    return (
        <div className="card">
            {showModal && <ItemModal onClose={() => setShowModal(false)} item={selectedItem} />}

            {/* Header / Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search by name or batch..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.625rem 1rem 0.625rem 2.5rem',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid #e2e8f0',
                            outline: 'none',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{
                            padding: '0.625rem 1rem',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-text-main)',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Items</option>
                        <option value="low">Low Stock</option>
                        <option value="expiring">Expiring Soon</option>
                    </select>
                    <button className="btn btn-primary" onClick={handleAddNew}>
                        + Add New Item
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>Item Details</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>Category</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>Stock Level</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>Batch / Location</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>Expiry</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>Status</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                                <td style={{ padding: '1rem 1rem' }}>
                                    <p style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{item.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>ID: #{item.id}</p>
                                </td>
                                <td style={{ padding: '1rem 1rem', color: 'var(--color-text-secondary)' }}>{item.category}</td>
                                <td style={{ padding: '1rem 1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: 600 }}>{item.stock}</span>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{item.unit}</span>
                                    </div>
                                    <div style={{ width: '100px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginTop: '4px' }}>
                                        <div style={{
                                            width: `${Math.min((item.stock / (item.min * 2)) * 100, 100)}%`,
                                            height: '100%',
                                            backgroundColor: item.stock <= item.min ? 'var(--color-danger)' : 'var(--color-primary)',
                                            borderRadius: '2px'
                                        }} />
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1rem' }}>
                                    <p style={{ fontWeight: 500 }}>{item.batch}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                        <MapPin size={12} />
                                        {item.location}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {item.status === 'expiring' && <AlertCircle size={14} color="var(--color-warning)" />}
                                        <span style={{ color: item.status === 'expiring' ? 'var(--color-warning)' : 'inherit' }}>{item.expiry}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1rem' }}>
                                    {getStatusBadge(item.status, item.stock, item.min)}
                                </td>
                                <td style={{ padding: '1rem 1rem', textAlign: 'right' }}>
                                    <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => handleEdit(item)}>
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredItems.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No items found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;
