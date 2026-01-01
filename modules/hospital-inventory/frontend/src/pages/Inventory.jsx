import { useState, useEffect, Fragment } from 'react';
import { Card, Badge } from '../components/ui/components';
import { Search, Plus, Filter, MoreVertical, Loader2, AlertCircle, Package, ChevronDown, ChevronRight, Clock, AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';

export default function Inventory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [expandedItemId, setExpandedItemId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ALERT, LOW, EXPIRED
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        threshold: 10,
        unit: 'units',
        batch_number: '',
        quantity: 1,
        expiry_date: '',
        mrp: '',
        location: ''
    });
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

    // Add Batch State
    const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
    const [selectedItemForBatch, setSelectedItemForBatch] = useState(null);
    const [rowMenuOpenId, setRowMenuOpenId] = useState(null);
    const [newBatch, setNewBatch] = useState({
        batch_number: '',
        quantity: 1,
        expiry_date: '',
        mrp: '',
        location: ''
    });

    // Edit Batch State
    const [isEditBatchOpen, setIsEditBatchOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    // Close row menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setRowMenuOpenId(null);
            setBatchMenuOpenId(null);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const [batchMenuOpenId, setBatchMenuOpenId] = useState(null);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8080/api/items');
            if (!response.ok) {
                throw new Error('Failed to fetch inventory');
            }
            const data = await response.json();
            setItems(data || []);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBatch = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const payload = {
                item_id: selectedBatch.item_id, // Keep original item ID
                batch_number: newBatch.batch_number,
                expiry_date: newBatch.expiry_date,
                location: newBatch.location,
                quantity: parseInt(newBatch.quantity),
                mrp: newBatch.mrp ? parseFloat(newBatch.mrp) : null
            };

            const response = await fetch(`http://localhost:8080/api/batches/${selectedBatch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to update batch');

            await fetchItems();
            setIsEditBatchOpen(false);
            setNewBatch({
                batch_number: '',
                quantity: 1,
                expiry_date: '',
                mrp: '',
                location: ''
            });
            setSelectedBatch(null);
        } catch (err) {
            console.error(err);
            alert('Failed to update batch');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteBatch = async (batchId) => {
        if (!window.confirm('Are you sure you want to delete this batch? This action cannot be undone.')) return;

        try {
            const response = await fetch(`http://localhost:8080/api/batches/${batchId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete batch');

            await fetchItems();
        } catch (err) {
            console.error(err);
            alert('Failed to delete batch');
        }
    };

    // Edit Item State
    const [isEditItemOpen, setIsEditItemOpen] = useState(false);
    const [selectedItemToEdit, setSelectedItemToEdit] = useState(null);
    const [editItemData, setEditItemData] = useState({
        name: '',
        description: '',
        threshold: 10,
        unit: 'Pack'
    });

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const payload = {
                name: editItemData.name,
                description: editItemData.description,
                threshold: parseInt(editItemData.threshold),
                unit: editItemData.unit
            };

            const response = await fetch(`http://localhost:8080/api/items/${selectedItemToEdit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
                throw new Error(`${response.status}: ${errorData.error || 'Unknown error'}`);
            }

            await fetchItems();
            setIsEditItemOpen(false);
            setSelectedItemToEdit(null);
        } catch (err) {
            console.error(err);
            alert(`Update Failed: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this item? This will delete ALL associated batches and history. This action cannot be undone.')) return;

        try {
            const response = await fetch(`http://localhost:8080/api/items/${itemId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete item');
            }

            await fetchItems();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    const handleAddBatch = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const payload = {
                item_id: selectedItemForBatch.id,
                ...newBatch,
                quantity: parseInt(newBatch.quantity),
                mrp: newBatch.mrp ? parseFloat(newBatch.mrp) : null
            };

            const response = await fetch('http://localhost:8080/api/batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to add batch');

            await fetchItems();
            setIsAddBatchOpen(false);
            setNewBatch({
                batch_number: '',
                quantity: 1,
                expiry_date: '',
                mrp: '',
                location: ''
            });
            setSelectedItemForBatch(null);
        } catch (err) {
            console.error(err);
            alert('Failed to add batch');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const payload = {
                ...newItem,
                threshold: parseInt(newItem.threshold),
                quantity: parseInt(newItem.quantity),
                mrp: parseFloat(newItem.mrp)
            };

            const response = await fetch('http://localhost:8080/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to add item');

            await fetchItems();
            setIsAddItemOpen(false);
            setNewItem({
                name: '',
                description: '',
                threshold: 10,
                unit: 'units',
                batch_number: '',
                quantity: 1,
                expiry_date: '',
                mrp: '',
                location: ''
            });
        } catch (err) {
            console.error(err);
            alert('Failed to add item');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleExpand = (id) => {
        if (expandedItemId === id) {
            setExpandedItemId(null);
        } else {
            setExpandedItemId(id);
        }
    };

    const getStatuses = (item) => {
        const statuses = [];
        const quantity = item.total_quantity;
        const threshold = item.threshold;

        if (quantity === 0) {
            statuses.push({ label: 'Out of Stock', variant: 'danger', type: 'OUT_OF_STOCK' });
            return statuses;
        }

        if (item.batches && item.batches.length > 0) {
            const now = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);

            let hasExpired = false;
            let hasExpiring = false;

            for (const batch of item.batches) {
                const expiry = new Date(batch.expiry_date);
                if (expiry < now && batch.quantity > 0) {
                    hasExpired = true;
                } else if (expiry < thirtyDaysFromNow && batch.quantity > 0) {
                    hasExpiring = true;
                }
            }

            if (hasExpired) statuses.push({ label: 'Expired', variant: 'danger', type: 'EXPIRED' });
            if (hasExpiring) statuses.push({ label: 'Expiring', variant: 'warning', type: 'EXPIRING' });
        }

        if (quantity <= threshold) {
            statuses.push({ label: 'Low Stock', variant: 'warning', type: 'LOW_STOCK' });
        } else {
            statuses.push({ label: 'In Stock', variant: 'success', type: 'IN_STOCK' });
        }

        return statuses;
    };

    const getEarliestExpiry = (item) => {
        if (!item.batches || item.batches.length === 0) return 'N/A';
        const activeBatches = item.batches.filter(b => b.quantity > 0);
        if (activeBatches.length === 0) return 'N/A';

        const earliest = activeBatches.reduce((min, b) => {
            const date = new Date(b.expiry_date);
            return date < min ? date : min;
        }, new Date(8640000000000000));

        return earliest.toLocaleDateString();
    };

    const filteredItems = items.filter(item => {
        // 1. Search Filter
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

        if (!matchesSearch) return false;

        // 2. Status Filter
        if (filterStatus === 'ALL') return true;

        const statuses = getStatuses(item);
        if (filterStatus === 'ALERT') {
            return statuses.some(s => ['OUT_OF_STOCK', 'EXPIRED', 'EXPIRING', 'LOW_STOCK'].includes(s.type));
        }
        if (filterStatus === 'LOW') {
            return statuses.some(s => ['OUT_OF_STOCK', 'LOW_STOCK'].includes(s.type));
        }
        if (filterStatus === 'EXPIRED') {
            return statuses.some(s => ['EXPIRED', 'EXPIRING'].includes(s.type));
        }

        return true;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-500" />
                <p>Loading inventory...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-rose-500">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium">Error loading inventory</p>
                <p className="text-sm text-slate-500 mb-4">{error}</p>
                <button
                    onClick={fetchItems}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                >
                    Try Again
                </button>
            </div>
        );
    }



    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search inventory..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 relative">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                        <Filter size={18} />
                        Filter
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                        >
                            <MoreVertical size={20} />
                        </button>

                        {isHeaderMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsHeaderMenuOpen(false)}
                                ></div>
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => {
                                            setIsAddItemOpen(true);
                                            setIsHeaderMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Add New Item
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {isAddItemOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-900">Add New Item</h3>
                            <button onClick={() => setIsAddItemOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleAddItem} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Item Name <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        placeholder="e.g. Paracetamol"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. tablet, vial"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newItem.unit}
                                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[60px]"
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    placeholder="Optional details..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Threshold <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newItem.threshold}
                                        onChange={(e) => setNewItem({ ...newItem, threshold: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-slate-100"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-white px-2 text-slate-400 font-medium tracking-wide uppercase">Initial Batch Details</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newItem.batch_number}
                                        onChange={(e) => setNewItem({ ...newItem, batch_number: e.target.value })}
                                        placeholder="e.g. BATCH-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newItem.expiry_date}
                                        onChange={(e) => setNewItem({ ...newItem, expiry_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantity <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newItem.quantity}
                                        onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">MRP (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newItem.mrp}
                                        onChange={(e) => setNewItem({ ...newItem, mrp: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newItem.location}
                                        onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                                        placeholder="e.g. Shelf A1"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddItemOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {submitting ? 'Adding...' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {isEditItemOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-semibold text-slate-900">Edit Item</h3>
                            <button onClick={() => setIsEditItemOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateItem} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Item Name <span className="text-rose-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    value={editItemData.name}
                                    onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                                        disabled
                                    >
                                        <option>Medicine</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={editItemData.unit}
                                        onChange={(e) => setEditItemData({ ...editItemData, unit: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[60px]"
                                    value={editItemData.description}
                                    onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Threshold <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={editItemData.threshold}
                                        onChange={(e) => setEditItemData({ ...editItemData, threshold: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditItemOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {submitting ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Batch Modal */}
            {isAddBatchOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-semibold text-slate-900">Add Batch</h3>
                                <p className="text-xs text-slate-500">Adding to {selectedItemForBatch?.name}</p>
                            </div>
                            <button onClick={() => setIsAddBatchOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleAddBatch} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newBatch.batch_number}
                                        onChange={(e) => setNewBatch({ ...newBatch, batch_number: e.target.value })}
                                        placeholder="e.g. BATCH-002"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newBatch.expiry_date}
                                        onChange={(e) => setNewBatch({ ...newBatch, expiry_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantity <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newBatch.quantity}
                                        onChange={(e) => setNewBatch({ ...newBatch, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">MRP (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newBatch.mrp}
                                        onChange={(e) => setNewBatch({ ...newBatch, mrp: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newBatch.location}
                                        onChange={(e) => setNewBatch({ ...newBatch, location: e.target.value })}
                                        placeholder="e.g. Shelf B2"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddBatchOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {submitting ? 'Adding...' : 'Add Batch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Batch Modal */}
            {isEditBatchOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-semibold text-slate-900">Edit Batch</h3>
                                <p className="text-xs text-slate-500">Editing {selectedBatch?.batch_number}</p>
                            </div>
                            <button onClick={() => setIsEditBatchOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateBatch} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newBatch.batch_number}
                                        onChange={(e) => setNewBatch({ ...newBatch, batch_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newBatch.expiry_date}
                                        onChange={(e) => setNewBatch({ ...newBatch, expiry_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantity <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newBatch.quantity}
                                        onChange={(e) => setNewBatch({ ...newBatch, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">MRP (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newBatch.mrp}
                                        onChange={(e) => setNewBatch({ ...newBatch, mrp: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                        value={newBatch.location}
                                        onChange={(e) => setNewBatch({ ...newBatch, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditBatchOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {submitting ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 sm:rounded-xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="w-10 px-6 py-3"></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Earliest Expiry</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center animate-pulse">
                                            <Package className="w-12 h-12 mb-3 text-slate-200" />
                                            <p>No items found matching your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.map((item, index) => (
                                <Fragment key={item.id}>
                                    <tr
                                        onClick={() => toggleExpand(item.id)}
                                        className={`cursor-pointer transition-colors group ${expandedItemId === item.id ? 'bg-brand-50 hover:bg-brand-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                            <div className="transition-transform duration-200" style={{ transform: expandedItemId === item.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                                <ChevronDown size={16} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{item.name}</div>
                                            {item.description && <div className="text-xs text-slate-400">{item.description}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{item.total_quantity} <span className="text-slate-400 text-xs">{item.unit}</span></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {getStatuses(item).map((status, idx) => (
                                                    <Badge key={idx} variant={status.variant}>{status.label}</Badge>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-slate-400" />
                                                {getEarliestExpiry(item)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                            <button
                                                className="text-slate-400 hover:text-brand-600 transition-colors bg-transparent border-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRowMenuOpenId(rowMenuOpenId === item.id ? null : item.id);
                                                }}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {rowMenuOpenId === item.id && (
                                                <div className={`absolute right-12 w-40 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-200 ${index >= filteredItems.length - 2 ? 'bottom-6 origin-bottom-right' : 'top-8 origin-top-right'
                                                    }`}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedItemForBatch(item);
                                                            setIsAddBatchOpen(true);
                                                            setRowMenuOpenId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2"
                                                    >
                                                        <Plus size={14} />
                                                        Add Batch
                                                    </button>
                                                    <div className="h-px bg-slate-100 my-1"></div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedItemToEdit(item);
                                                            setEditItemData({
                                                                name: item.name,
                                                                description: item.description,
                                                                threshold: item.threshold,
                                                                unit: item.unit
                                                            });
                                                            setIsEditItemOpen(true);
                                                            setRowMenuOpenId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2"
                                                    >
                                                        <div className="w-3.5 h-3.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></div>
                                                        Edit Item
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRowMenuOpenId(null);
                                                            handleDeleteItem(item.id);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2"
                                                    >
                                                        <div className="w-3.5 h-3.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></div>
                                                        Delete Item
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedItemId === item.id && (
                                        <tr className="bg-slate-50/50 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <td colSpan="6" className="p-0">
                                                <div className="pl-16 pr-6 py-4 bg-slate-50 border-y border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                                                    <table className="min-w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-slate-200">
                                                                <th className="px-6 py-2 text-left text-xs font-medium text-slate-400 uppercase">Batch #</th>
                                                                <th className="px-6 py-2 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                                                                <th className="px-6 py-2 text-left text-xs font-medium text-slate-400 uppercase">Quantity</th>
                                                                <th className="px-6 py-2 text-left text-xs font-medium text-slate-400 uppercase">Expiry</th>
                                                                <th className="px-6 py-2 text-left text-xs font-medium text-slate-400 uppercase">Location</th>
                                                                <th className="px-6 py-2 text-left text-xs font-medium text-slate-400 uppercase">MRP</th>
                                                                <th className="px-6 py-2 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {item.batches && item.batches.length > 0 ? item.batches.map((batch) => {
                                                                const expiry = new Date(batch.expiry_date);
                                                                const now = new Date();
                                                                const thirtyDaysFromNow = new Date();
                                                                thirtyDaysFromNow.setDate(now.getDate() + 30);

                                                                let status = { label: 'Active', variant: 'success' };
                                                                if (batch.quantity === 0) {
                                                                    status = { label: 'Empty', variant: 'secondary' };
                                                                } else if (expiry < now) {
                                                                    status = { label: 'Expired', variant: 'danger' };
                                                                } else if (expiry < thirtyDaysFromNow) {
                                                                    status = { label: 'Expiring', variant: 'warning' };
                                                                }

                                                                return (
                                                                    <tr key={batch.id} className="hover:bg-slate-100/50 transition-colors">
                                                                        <td className="px-6 py-3 font-medium text-slate-700">{batch.batch_number}</td>
                                                                        <td className="px-6 py-3">
                                                                            <Badge variant={status.variant} className="text-xs px-2 py-0.5">{status.label}</Badge>
                                                                        </td>
                                                                        <td className="px-6 py-3 text-slate-600">{batch.quantity}</td>
                                                                        <td className={`px-6 py-3 font-medium ${expiry < now ? 'text-rose-600' : 'text-slate-600'}`}>
                                                                            {expiry.toLocaleDateString()}
                                                                        </td>
                                                                        <td className="px-6 py-3 text-slate-600">{batch.location}</td>
                                                                        <td className="px-6 py-3 text-slate-600">₹{batch.mrp?.toFixed(2) || '0.00'}</td>
                                                                        <td className="px-6 py-3 text-right sticky right-0 bg-slate-50">
                                                                            <div className="relative flex justify-end">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setBatchMenuOpenId(batchMenuOpenId === batch.id ? null : batch.id);
                                                                                    }}
                                                                                    className="p-1 text-slate-400 hover:text-brand-600 rounded-full hover:bg-slate-200 transition-colors"
                                                                                >
                                                                                    <MoreVertical size={16} />
                                                                                </button>

                                                                                {batchMenuOpenId === batch.id && (
                                                                                    <div className="absolute right-0 top-8 z-20 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 animate-in fade-in zoom-in-95 duration-200">
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setSelectedBatch(batch);
                                                                                                setNewBatch({
                                                                                                    batch_number: batch.batch_number,
                                                                                                    quantity: batch.quantity,
                                                                                                    expiry_date: batch.expiry_date.split('T')[0],
                                                                                                    mrp: batch.mrp,
                                                                                                    location: batch.location
                                                                                                });
                                                                                                setIsEditBatchOpen(true);
                                                                                                setBatchMenuOpenId(null);
                                                                                            }}
                                                                                            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2"
                                                                                        >
                                                                                            <div className="w-3 h-3"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></div>
                                                                                            Edit
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleDeleteBatch(batch.id);
                                                                                                setBatchMenuOpenId(null);
                                                                                            }}
                                                                                            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2"
                                                                                        >
                                                                                            <div className="w-3 h-3"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></div>
                                                                                            Delete
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }) : (
                                                                <tr>
                                                                    <td colSpan="7" className="px-6 py-4 text-center text-slate-400 text-xs italic">
                                                                        No batches found. Add one from the menu.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>


                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-sm text-slate-500">Showing <span className="font-medium">{filteredItems.length}</span> results</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-slate-300 rounded bg-white text-sm disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 border border-slate-300 rounded bg-white text-sm disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </Card >
        </div >
    );
}
