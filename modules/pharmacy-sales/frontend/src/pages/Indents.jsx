import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Package, AlertTriangle, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import RaiseIndentModal from '../components/RaiseIndentModal';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Indents = () => {
    const [indents, setIndents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [suggestedItems, setSuggestedItems] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(true);
    const [showRaiseModal, setShowRaiseModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchIndents = async () => {
        try {
            // Fetch from Hospital Backend
            const res = await fetch('http://localhost:8080/api/indents');
            if (res.ok) {
                const data = await res.json();
                setIndents(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const res = await fetch('http://localhost:8081/api/items');
            if (res.ok) {
                const data = await res.json();

                const suggestions = [];
                const today = new Date();
                const warningDate = new Date();
                warningDate.setDate(today.getDate() + 30); // 30 days ahead

                data.forEach(item => {
                    const totalStock = item.total_quantity || 0;
                    const threshold = item.threshold || 10;
                    let reason = null;
                    let detail = null;

                    // Check Low Stock
                    if (totalStock <= threshold) {
                        reason = 'low_stock';
                        detail = `${totalStock} units left`;
                    }
                    // Check Expiry (if not already low stock)
                    else if (item.batches && item.batches.length > 0) {
                        const expiringBatch = item.batches.find(b => {
                            if (!b.expiry_date) return false;
                            return new Date(b.expiry_date) <= warningDate;
                        });

                        if (expiringBatch) {
                            reason = 'expiring';
                            detail = `Expires ${new Date(expiringBatch.expiry_date).toLocaleDateString()}`;
                        }
                    }

                    if (reason) {
                        suggestions.push({
                            ...item,
                            stock: totalStock,
                            threshold: threshold,
                            suggestionReason: reason,
                            suggestionDetail: detail
                        });
                    }
                });

                setSuggestedItems(suggestions);
            }
        } catch (err) {
            console.error("Failed to fetch inventory for suggestions:", err);
        } finally {
            setInventoryLoading(false);
        }
    };

    useEffect(() => {
        fetchIndents();
        fetchInventory();
    }, []);

    const handleRaiseObj = (item) => {
        setSelectedItem(item);
        setShowRaiseModal(true);
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            PENDING: "bg-amber-100 text-amber-700",
            PROCESSING: "bg-blue-100 text-blue-700",
            DISPATCHED: "bg-purple-100 text-purple-700",
            FULFILLED: "bg-emerald-100 text-emerald-700",
            APPROVED: "bg-emerald-100 text-emerald-700", // Fallback if still used
            REJECTED: "bg-red-100 text-red-700"
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${styles[status] || styles.PENDING}`}>
                {status === 'PENDING' && <Clock size={12} />}
                {status === 'APPROVED' && <CheckCircle size={12} />}
                {status === 'REJECTED' && <AlertCircle size={12} />}
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            {showRaiseModal && (
                <RaiseIndentModal
                    onClose={() => setShowRaiseModal(false)}
                    initialItem={selectedItem}
                    onSuccess={() => {
                        fetchIndents();
                        alert('Indent Raised Successfully!');
                    }}
                />
            )}

            {/* Suggested Indents Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="text-amber-500" size={20} />
                    <h2 className="text-lg font-bold text-slate-800">Suggested Restocks</h2>
                    <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        {suggestedItems.length} Low Stock
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {inventoryLoading ? (
                        <div className="col-span-full py-8 text-center text-slate-500">Loading suggestions...</div>
                    ) : suggestedItems.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            No immediate restocks needed.
                        </div>
                    ) : (
                        suggestedItems.slice(0, 4).map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className={cn(
                                    "absolute top-0 right-0 w-16 h-16 bg-gradient-to-br -mr-8 -mt-8 rounded-full opacity-50",
                                    item.suggestionReason === 'expiring' ? "from-orange-100 to-transparent" : "from-red-100 to-transparent"
                                )}></div>

                                <div className="flex justify-between items-start mb-2">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        item.suggestionReason === 'expiring' ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"
                                    )}>
                                        {item.suggestionReason === 'expiring' ? <Clock size={18} /> : <Package size={18} />}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold px-2 py-1 rounded-md",
                                        item.suggestionReason === 'expiring' ? "text-orange-700 bg-orange-100" : "text-red-700 bg-red-100"
                                    )}>
                                        {item.suggestionDetail}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-slate-800 truncate mb-1" title={item.name}>{item.name}</h3>
                                <p className="text-xs text-slate-500 mb-4">Current Stock: {item.stock}</p>

                                <button
                                    onClick={() => handleRaiseObj(item)}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Raise Indent <ArrowRight size={14} />
                                </button>
                            </div>
                        ))
                    )}
                    {suggestedItems.length > 4 && (
                        <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 rounded-xl text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors">
                            <span className="text-sm font-medium">View All {suggestedItems.length} Items</span>
                        </div>
                    )}
                </div>
            </div>


            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Indent History</h2>
                        <p className="text-slate-500 text-sm">Track your stock requests to the hospital</p>
                    </div>
                    <button
                        onClick={fetchIndents}
                        className="text-sm text-brand-600 hover:text-brand-800 font-medium"
                    >
                        Refresh
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Item Name</th>
                                    <th className="px-6 py-4">Quantity</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading && (
                                    <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Loading indents...</td></tr>
                                )}
                                {!loading && indents.length === 0 && (
                                    <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No indents found.</td></tr>
                                )}
                                {indents.map((indent) => (
                                    <tr key={indent.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-800">{indent.item_name}</td>
                                        <td className="px-6 py-4 font-mono text-slate-600">{indent.quantity}</td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(indent.created_at).toLocaleString()}</td>
                                        <td className="px-6 py-4 flex items-center justify-between gap-4">
                                            <StatusBadge status={indent.status} />
                                            {indent.status === 'DISPATCHED' && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch('http://localhost:8081/receive-indent', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ indent_id: indent.id })
                                                            });
                                                            if (res.ok) fetchIndents();
                                                        } catch (e) {
                                                            console.error(e);
                                                        }
                                                    }}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap"
                                                >
                                                    Confirm Receipt
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Indents;
