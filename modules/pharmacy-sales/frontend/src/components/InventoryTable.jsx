import React, { useState, useEffect } from 'react';
import { Search, MapPin, Edit, ChevronRight, Plus, MoreVertical } from 'lucide-react';
import ItemModal from './ItemModal';
import RaiseIndentModal from './RaiseIndentModal';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const InventoryTable = () => {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showIndentModal, setShowIndentModal] = useState(false);
    const [indentItem, setIndentItem] = useState(null);
    const [modalMode, setModalMode] = useState('CREATE');
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [expandedItems, setExpandedItems] = useState({});

    const [inventoryItems, setInventoryItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = async () => {
        try {
            const response = await fetch('http://localhost:8081/api/items');
            if (response.ok) {
                const data = await response.json();
                const itemsWithStats = data.map(item => {
                    const totalStock = item.total_quantity || 0;
                    let nearestExpiry = null;
                    let batches = item.batches || [];

                    batches.forEach(b => {
                        if (b.expiry_date) {
                            const d = new Date(b.expiry_date);
                            if (!nearestExpiry || d < nearestExpiry) {
                                nearestExpiry = d;
                            }
                        }
                    });

                    let status = 'good';
                    const threshold = item.threshold || 10;
                    if (totalStock <= 0) status = 'critical';
                    else if (totalStock <= threshold) status = 'low';

                    if (nearestExpiry) {
                        const today = new Date();
                        const diffTime = nearestExpiry - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays <= 30) {
                            status = 'expiring';
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

    useEffect(() => {
        fetchItems();
    }, []);

    const toggleExpand = (itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const handleSaveItem = async (data) => {
        let url = 'http://localhost:8081/api/items';
        let method = 'POST';
        let payload = {};

        const batchData = {
            quantity: parseInt(data.stock) || 0,
            batch_number: data.batch || '',
            location: data.location,
            expiry_date: data.expiry ? new Date(data.expiry).toISOString() : null,
            mrp: parseFloat(data.mrp) || 0
        };

        if (data.mode === 'ADD_BATCH') {
            url = 'http://localhost:8081/api/batches';
            payload = {
                item_id: data.item_id,
                ...batchData
            };
        } else if (data.mode === 'EDIT') {
            url = `http://localhost:8081/api/items/${data.item_id}`;
            method = 'PUT';
            payload = {
                name: data.name,
                description: data.category,
                threshold: 10
            };
        } else if (data.mode === 'EDIT_BATCH') {
            url = `http://localhost:8081/api/batches/${data.batch_id}`;
            method = 'PUT';
            payload = {
                item_id: data.item_id,
                ...batchData
            };
        } else {
            payload = {
                name: data.name,
                description: data.category,
                unit: 'Unit',
                threshold: 10,
                price: parseFloat(data.mrp) || 0,
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

    const StatusBadge = ({ status }) => {
        const styles = {
            critical: "bg-red-100 text-red-700",
            low: "bg-amber-100 text-amber-700",
            expiring: "bg-orange-100 text-orange-700",
            good: "bg-green-100 text-green-700"
        };
        const labels = {
            critical: "Critical",
            low: "Low Stock",
            expiring: "Expiring",
            good: "Good"
        };
        return (
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", styles[status] || styles.good)}>
                {labels[status]}
            </span>
        );
    };

    const filteredItems = inventoryItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'low' && (item.stock <= (item.threshold || 10) || item.status === 'critical')) ||
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

    const handleRaiseIndent = (item) => {
        setIndentItem(item);
        setShowIndentModal(true);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {showModal && <ItemModal onClose={() => setShowModal(false)} item={selectedItem} batch={selectedBatch} mode={modalMode} onSave={handleSaveItem} />}
            {showIndentModal && <RaiseIndentModal onClose={() => setShowIndentModal(false)} onSuccess={() => alert('Indent Raised Successfully!')} initialItem={indentItem} />}

            {/* Header / Controls */}
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                <div className="relative w-full sm:w-72">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-600 cursor-pointer"
                    >
                        <option value="all">All Items</option>
                        <option value="low">Low Stock</option>
                        <option value="expiring">Expiring Soon</option>
                    </select>
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Add Item
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 w-12"></th>
                            <th className="px-6 py-4">Item Name</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Stock Level</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Next Expiry</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && (
                            <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">Loading inventory...</td></tr>
                        )}
                        {!loading && filteredItems.length === 0 && (
                            <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No items found matching your criteria.</td></tr>
                        )}
                        {filteredItems.map((item) => (
                            <React.Fragment key={item.id}>
                                <tr className={cn("hover:bg-slate-50/80 transition-colors group", expandedItems[item.id] && "bg-slate-50")}>
                                    <td className="px-6 py-4 text-center cursor-pointer" onClick={() => toggleExpand(item.id)}>
                                        <ChevronRight
                                            size={18}
                                            className={cn("text-slate-400 transition-transform duration-200", expandedItems[item.id] && "rotate-90 text-brand-600")}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-800">{item.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">ID: #{item.id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{item.category || item.description || '-'}</td>
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        {item.stock} <span className="text-slate-400 text-xs font-normal ml-1">{item.unit}</span>
                                    </td>
                                    <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{item.expiry}</td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        <button
                                            className="text-slate-600 hover:text-slate-800 text-xs font-medium bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors border border-slate-200"
                                            onClick={() => handleRaiseIndent(item)}
                                        >
                                            Indent
                                        </button>
                                        <div className="relative inline-block text-left group/menu">
                                            <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                                <MoreVertical size={16} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-100 z-10 hidden group-hover/menu:block hover:block">
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => handleAddBatch(item)}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                                                    >
                                                        Add Batch
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditItem(item)}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                                                    >
                                                        Edit Item
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                {/* Expanded Batches Row */}
                                {expandedItems[item.id] && (
                                    <tr className="bg-slate-50/50">
                                        <td colSpan="7" className="px-6 pb-6 pt-2">
                                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Batch Details
                                                </div>
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-slate-500 border-b border-slate-100">
                                                            <th className="text-left px-4 py-3 font-medium">Batch #</th>
                                                            <th className="text-left px-4 py-3 font-medium">Location</th>
                                                            <th className="text-left px-4 py-3 font-medium">Qty</th>
                                                            <th className="text-left px-4 py-3 font-medium">MRP</th>
                                                            <th className="text-left px-4 py-3 font-medium">Expiry</th>
                                                            <th className="text-right px-4 py-3 font-medium">Edit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {item.batches && item.batches.length > 0 ? item.batches.map(b => (
                                                            <tr key={b.id} className="hover:bg-slate-50">
                                                                <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">
                                                                    {b.batch_number ? b.batch_number : <span className="text-slate-400 italic">#{b.id}</span>}
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600 flex items-center gap-1">
                                                                    <MapPin size={12} className="text-slate-400" /> {b.location || '-'}
                                                                </td>
                                                                <td className="px-4 py-3 font-medium text-slate-700">{b.quantity}</td>
                                                                <td className="px-4 py-3 text-slate-600 font-mono">{b.mrp ? `₹${b.mrp.toFixed(2)}` : '-'}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={cn(
                                                                        "font-mono text-xs",
                                                                        b.expiry_date && new Date(b.expiry_date) < new Date() ? "text-red-600 font-bold" : "text-slate-600"
                                                                    )}>
                                                                        {b.expiry_date ? b.expiry_date.split('T')[0] : '-'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right relative">
                                                                    <div className="relative inline-block text-left group/batchmenu">
                                                                        <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                                                                            <MoreVertical size={14} />
                                                                        </button>

                                                                        {/* Dropdown Menu for Batch */}
                                                                        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 z-10 hidden group-hover/batchmenu:block hover:block">
                                                                            <div className="py-1">
                                                                                <button
                                                                                    onClick={() => handleEditBatch(item, b)}
                                                                                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                                                                                >
                                                                                    Edit Batch
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )) : (
                                                            <tr>
                                                                <td colSpan="6" className="px-4 py-6 text-center text-slate-400 italic">No batches recorded for this item.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr >
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default InventoryTable;
