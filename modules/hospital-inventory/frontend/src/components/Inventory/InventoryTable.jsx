import { useState } from 'react';
import { Search, Filter, MoreVertical, MapPin, AlertCircle, Edit } from 'lucide-react';
import ItemModal from './ItemModal';

const InventoryTable = () => {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE', 'EDIT', 'ADD_BATCH', 'EDIT_BATCH'
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [expandedItems, setExpandedItems] = useState({});

    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/items');
            if (response.ok) {
                const data = await response.json();
                // 2-Level Refactor: Keep items as parents, calculate stats
                const itemsWithStats = data.map(item => {
                    const totalStock = item.total_quantity || 0;
                    // Find nearest expiry
                    let nearestExpiry = null;
                    let criticalExpiry = false; // < 30 days
                    let batches = item.batches || [];

                    batches.forEach(b => {
                        if (b.expiry_date) {
                            const d = new Date(b.expiry_date);
                            if (!nearestExpiry || d < nearestExpiry) {
                                nearestExpiry = d;
                            }
                        }
                    });

                    // simple status logic
                    let status = 'good';
                    if (totalStock <= 0) status = 'critical';
                    else if (totalStock <= item.threshold) status = 'low';

                    if (nearestExpiry) {
                        const today = new Date();
                        const diffTime = nearestExpiry - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays <= 30) {
                            status = 'expiring';
                            criticalExpiry = true;
                        }
                    }

                    return {
                        ...item,
                        stock: totalStock,
                        expiry: nearestExpiry ? nearestExpiry.toISOString().split('T')[0] : '-',
                        status: status,
                        batches: batches
                    };
                });
                setInventoryItems(itemsWithStats);
            }
        } catch (error) {
            console.error("Failed to fetch inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    useState(() => {
        fetchItems();
    }, []);

    const toggleExpand = (itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const handleSaveItem = async (data) => {
        let url = 'http://localhost:8080/api/items';
        let method = 'POST';
        let payload = {};

        // Parse common batch fields
        const batchData = {
            quantity: parseInt(data.stock) || 0,
            batch_number: data.batch || '', // [NEW] Map input 'batch' to 'batch_number'
            location: data.location,
            expiry_date: data.expiry ? new Date(data.expiry).toISOString() : null,
            mrp: parseFloat(data.mrp) || 0
        };

        if (data.mode === 'ADD_BATCH') {
            // Add Batch to Existing
            url = 'http://localhost:8080/api/batches';
            payload = {
                item_id: data.item_id,
                ...batchData
            };
        } else if (data.mode === 'EDIT') {
            // Edit Item Metadata Only
            url = `http://localhost:8080/api/items/${data.item_id}`;
            method = 'PUT';
            payload = {
                name: data.name,
                category: data.category
            };
        } else if (data.mode === 'EDIT_BATCH') {
            // Edit Batch Details
            url = `http://localhost:8080/api/batches/${data.batch_id}`;
            method = 'PUT';
            // Send updated batch fields
            payload = {
                item_id: data.item_id, // GORM might want this or ignore
                ...batchData
            };
        } else {
            // Create New Item + Batch
            payload = {
                name: data.name,
                category: data.category,
                description: data.category, // Mapping category to description as per previous convention
                unit: 'Unit',
                threshold: 10,
                batches: [batchData]
            };
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                fetchItems();
                setShowModal(false);
                setSelectedItem(null);
            } else {
                console.error("Save failed", res.status);
            }
        } catch (err) {
            console.error("Failed to save:", err);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'critical') return <span className="badge badge-danger">Critical</span>;
        if (status === 'low') return <span className="badge badge-warning">Low Stock</span>;
        if (status === 'expiring') return <span className="badge badge-warning">Expiring</span>;
        return <span className="badge badge-success">Good</span>;
    };

    const filteredItems = inventoryItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'low' && (item.stock <= item.threshold || item.status === 'critical')) ||
            (filter === 'expiring' && item.status === 'expiring');
        return matchesSearch && matchesFilter;
    });

    const handleEditItem = (item) => {
        setSelectedItem(item);
        setSelectedBatch(null);
        setModalMode('EDIT');
        setShowModal(true);
    };

    const handleEditBatch = (item, batch) => {
        setSelectedItem(item);
        setSelectedBatch(batch);
        setModalMode('EDIT_BATCH');
        setShowModal(true);
    };

    const handleAddBatch = (item) => {
        setSelectedItem(item);
        setSelectedBatch(null);
        setModalMode('ADD_BATCH');
        setShowModal(true);
    };

    const handleAddNew = () => {
        setSelectedItem(null);
        setSelectedBatch(null);
        setModalMode('CREATE');
        setShowModal(true);
    };

    return (
        <div className="card">
            {showModal && <ItemModal onClose={() => setShowModal(false)} item={selectedItem} batch={selectedBatch} mode={modalMode} onSave={handleSaveItem} />}

            {/* Header / Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search items..."
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
                        + Add Stock / Item
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1rem', width: '40px' }}></th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>Item</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>Category</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>Total Stock</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>Status</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>Next Expiry</th>
                            <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item) => (
                            <>
                                <tr key={item.id} style={{ borderBottom: expandedItems[item.id] ? 'none' : '1px solid #f1f5f9', backgroundColor: expandedItems[item.id] ? '#f8fafc' : 'transparent' }}>
                                    <td style={{ padding: '1rem 1rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => toggleExpand(item.id)}>
                                        <div style={{ transform: expandedItems[item.id] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                            ▶
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1rem', fontWeight: 600 }}>
                                        {item.name}
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>ID: #{item.id}</div>
                                    </td>
                                    <td style={{ padding: '1rem 1rem', color: 'var(--color-text-secondary)' }}>{item.category || item.description || '-'}</td>
                                    <td style={{ padding: '1rem 1rem', fontWeight: 600 }}>{item.stock} <span style={{ fontSize: '0.8em', fontWeight: 400 }}>{item.unit}</span></td>
                                    <td style={{ padding: '1rem 1rem' }}>{getStatusBadge(item.status)}</td>
                                    <td style={{ padding: '1rem 1rem' }}>{item.expiry}</td>
                                    <td style={{ padding: '1rem 1rem' }}>
                                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleAddBatch(item)}>
                                            + Add Batch
                                        </button>
                                    </td>
                                </tr>
                                {/* Expanded Batches Row */}
                                {expandedItems[item.id] && (
                                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                        <td colSpan="7" style={{ padding: '0 1rem 1rem 3rem' }}>
                                            <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Batch Inventory</h4>
                                                <table style={{ width: '100%', fontSize: '0.875rem' }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--color-text-secondary)' }}>Batch #</th>
                                                            <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--color-text-secondary)' }}>Location</th>
                                                            <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--color-text-secondary)' }}>Qty</th>
                                                            <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--color-text-secondary)' }}>MRP</th>
                                                            <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--color-text-secondary)' }}>Expiry</th>
                                                            <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--color-text-secondary)' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {item.batches && item.batches.length > 0 ? item.batches.map(b => (
                                                            <tr key={b.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                                                <td style={{ padding: '0.5rem', fontWeight: 500 }}>
                                                                    {b.batch_number ? b.batch_number : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>#{b.id}</span>}
                                                                </td>
                                                                <td style={{ padding: '0.5rem' }}>{b.location} <MapPin size={10} style={{ display: 'inline', marginLeft: 4 }} /></td>
                                                                <td style={{ padding: '0.5rem' }}>{b.quantity}</td>
                                                                <td style={{ padding: '0.5rem' }}>{b.mrp ? `₹${b.mrp.toFixed(2)}` : '-'}</td>
                                                                <td style={{ padding: '0.5rem' }}>
                                                                    {b.expiry_date ? b.expiry_date.split('T')[0] : '-'}
                                                                    {new Date(b.expiry_date) < new Date() && <span style={{ color: 'red', marginLeft: '5px' }}>(Exp)</span>}
                                                                </td>
                                                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }} onClick={() => handleEditBatch(item, b)}>
                                                                        <Edit size={14} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        )) : (
                                                            <tr>
                                                                <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No batches found</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr >
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default InventoryTable;
