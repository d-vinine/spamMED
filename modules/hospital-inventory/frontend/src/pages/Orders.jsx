import React, { useState, useEffect } from 'react';
import { Plus, Download, Printer, Save, Trash2, Edit2, CheckCircle, Clock, X, AlertTriangle, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [knowledgeBase, setKnowledgeBase] = useState([]); // Shared KB

    // Form State
    const [formData, setFormData] = useState({
        supplier_name: '',
        items: [] // [{id, name, quantity, unit_cost, total, reason}]
    });

    const fetchOrders = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/items');
            if (res.ok) {
                const data = await res.json();
                setInventory(data);
                return data;
            }
            return [];
        } catch (err) {
            console.error(err);
            return [];
        }
    };

    const fetchKnowledgeBase = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/items/knowledge-base');
            if (res.ok) {
                const data = await res.json();
                setKnowledgeBase(data);
            }
        } catch (err) {
            console.error("Failed to fetch KB", err);
        }
    };

    const generateSuggestions = (items) => {
        const today = new Date();
        const warningDate = new Date();
        warningDate.setDate(today.getDate() + 30);

        const suggestions = [];

        items.forEach(item => {
            let reason = '';

            // Check Stock
            if (item.total_quantity <= (item.threshold || 10)) {
                reason = `Low Stock (${item.total_quantity} left)`;
            }
            // Check Expiry (if needed - currently using item aggregated data, simplified)
            // Ideally we'd iterate batches here if available in item data
            else if (item.batches && item.batches.length > 0) {
                const expiringInfo = item.batches.find(b => new Date(b.expiry_date) <= warningDate);
                if (expiringInfo) {
                    reason = `Batch Expiring`;
                }
            }

            if (reason) {
                suggestions.push({
                    item_id: item.id,
                    item_name: item.name,
                    quantity: (item.restock_level || 50), // Default restock Qty
                    unit_cost: item.price || 0,
                    total: (item.restock_level || 50) * (item.price || 0),
                    reason: reason
                });
            }
        });

        return suggestions;
    };

    const handleOpenCreate = async () => {
        const items = await fetchInventory();
        fetchKnowledgeBase(); // Fetch KB when modal opens
        const suggested = generateSuggestions(items);

        setFormData({
            supplier_name: '',
            items: suggested
        });
        setShowModal(true);
    };

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [
                ...formData.items,
                { item_id: Date.now(), item_name: '', quantity: 0, unit_cost: 0, total: 0, isKeyed: true } // isKeyed for manual entry
            ]
        });
    };

    const handleUpdateItem = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index][field] = value;

        if (field === 'quantity' || field === 'unit_cost') {
            const qty = parseFloat(updatedItems[index].quantity) || 0;
            const cost = parseFloat(updatedItems[index].unit_cost) || 0;
            updatedItems[index].total = qty * cost;
        }

        setFormData({ ...formData, items: updatedItems });
    };

    const handleRemoveItem = (index) => {
        const updatedItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: updatedItems });
    };

    const calculateGrandTotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    };

    const generatePDF = (orderData, id) => {
        console.log("Starting PDF Generation for Order:", id, orderData);
        try {
            const doc = new jsPDF();
            console.log("jsPDF instance created");

            // Brand Colors
            const primaryColor = [41, 128, 185]; // A nice blue
            const slateColor = [52, 73, 94];

            // 1. Header Section
            // Logo placeholder / Brand Name
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 40, 'F'); // Top banner

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(26);
            doc.setFont("helvetica", "bold");
            doc.text("PURCHASE ORDER", 14, 25);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("spamMED Hospital Inventory", 200, 20, { align: "right" });
            doc.text("123 Health Avenue, MedCity", 200, 25, { align: "right" });

            // 2. Order Details
            doc.setTextColor(...slateColor);
            doc.setFontSize(10);

            const detailStartY = 55;
            // Left Side: Order Info
            doc.setFont("helvetica", "bold");
            doc.text("ORDER DETAILS", 14, detailStartY);
            doc.setDrawColor(200, 200, 200);
            doc.line(14, detailStartY + 2, 80, detailStartY + 2); // Underline

            doc.setFont("helvetica", "normal");
            doc.text(`Order ID: #${id}`, 14, detailStartY + 10);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, detailStartY + 16);
            doc.text(`Status: ${orderData.status}`, 14, detailStartY + 22);

            // Right Side: Supplier Info
            doc.setFont("helvetica", "bold");
            doc.text("SUPPLIER", 120, detailStartY);
            doc.line(120, detailStartY + 2, 180, detailStartY + 2); // Underline

            doc.setFont("helvetica", "normal");
            doc.text(orderData.supplier_name, 120, detailStartY + 10);
            // Placeholder address for now
            doc.text("Attn: Sales Department", 120, detailStartY + 16);

            // 3. Table
            const tableColumn = ["Item Description", "Quantity", "Unit Cost", "Total"];
            const tableRows = [];

            orderData.items.forEach(item => {
                const orderItem = [
                    item.item_name,
                    item.quantity,
                    `Rs. ${item.unit_cost}`,
                    `Rs. ${item.total.toFixed(2)}`
                ];
                tableRows.push(orderItem);
            });

            console.log("Generating AutoTable with rows:", tableRows);
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 90,
                theme: 'grid',
                headStyles: {
                    fillColor: primaryColor,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { halign: 'left' },
                    1: { halign: 'center' },
                    2: { halign: 'right' },
                    3: { halign: 'right', fontStyle: 'bold' }
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250]
                },
                styles: {
                    font: 'helvetica',
                    fontSize: 10,
                    cellPadding: 6
                }
            });

            // 4. Grand Total & Signatures
            const finalY = (doc.lastAutoTable?.finalY || 90) + 15;

            // Box for Total
            doc.setFillColor(240, 240, 240);
            doc.rect(130, finalY - 5, 60, 20, 'F');

            doc.setFontSize(12);
            doc.setTextColor(...slateColor);
            doc.setFont("helvetica", "bold");
            doc.text(`Grand Total:`, 135, finalY + 8);
            doc.setTextColor(...primaryColor);
            doc.text(`Rs. ${orderData.total_cost.toFixed(2)}`, 185, finalY + 8, { align: "right" });

            // Signature Line
            const signY = finalY + 40;
            doc.setDrawColor(0, 0, 0);
            doc.line(14, signY, 80, signY);
            doc.setFontSize(8);
            doc.setTextColor(...slateColor);
            doc.setFont("helvetica", "normal");
            doc.text("Authorized Signature", 14, signY + 5);

            // 5. Footer
            const pageHeight = doc.internal.pageSize.height;
            doc.setFillColor(245, 245, 245);
            doc.rect(0, pageHeight - 20, 210, 20, 'F');
            doc.text("Generated by spamMED Hospital Inventory System | Contact: support@spammed.com", 105, pageHeight - 10, { align: "center" });

            console.log("Saving PDF...");
            doc.save(`PO_${id}_${orderData.supplier_name.replace(/\s+/g, '_')}.pdf`);
            console.log("PDF Saved successfully");
        } catch (e) {
            console.error("PDF Generation Error (Detailed):", e);
            alert(`PDF Generation Failed: ${e.message}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prepare Submission
        const payload = {
            supplier_name: formData.supplier_name,
            items: JSON.stringify(formData.items),
            total_cost: calculateGrandTotal()
        };

        try {
            const res = await fetch('http://localhost:8080/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const createdOrder = await res.json();
                setShowModal(false);
                fetchOrders();

                // Trigger PDF
                // Transform payload items back to array for PDF gen since state is cleaner
                const pdfData = { ...createdOrder, items: formData.items };
                generatePDF(pdfData, createdOrder.id);

                alert("Order Created & PDF Downloaded!");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to create order");
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const StatusBadge = ({ status }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'Pending' ? 'bg-amber-100 text-amber-700' :
            status === 'Received' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
            {status}
        </span>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Supply Orders</h2>
                    <p className="text-slate-500 text-sm">Manage orders to external suppliers</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus size={18} /> Create Order
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Supplier</th>
                            <th className="px-6 py-4">Items</th>
                            <th className="px-6 py-4">Total Cost</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orders.length === 0 ? (
                            <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No orders found.</td></tr>
                        ) : (
                            orders.map(order => {
                                const itemCount = JSON.parse(order.items || "[]").length;
                                return (
                                    <tr key={order.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-mono text-slate-600">#{order.id}</td>
                                        <td className="px-6 py-4 text-slate-600">{new Date(order.order_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{order.supplier_name}</td>
                                        <td className="px-6 py-4 text-slate-600">{itemCount} items</td>
                                        <td className="px-6 py-4 font-mono font-medium text-slate-800">₹{order.total_cost.toFixed(2)}</td>
                                        <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                        <td className="px-6 py-4 text-right">
                                            {order.status === 'Pending' && (
                                                <button
                                                    className="text-brand-600 hover:text-brand-800 font-medium text-xs"
                                                    onClick={async () => {
                                                        await fetch(`http://localhost:8080/api/orders/${order.id}/status`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ status: 'Received' })
                                                        });
                                                        fetchOrders();
                                                    }}
                                                >
                                                    Mark Received
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-xl flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-semibold text-lg text-slate-800">New Supply Order</h3>
                                <p className="text-xs text-slate-500">Auto-filled based on low stock & expiry</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="Enter Supplier Name..."
                                    value={formData.supplier_name}
                                    onChange={e => setFormData({ ...formData, supplier_name: e.target.value })}
                                />
                            </div>

                            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Item</th>
                                            <th className="px-4 py-2 text-left w-32">Quantity</th>
                                            <th className="px-4 py-2 text-left w-32">Unit Cost (₹)</th>
                                            <th className="px-4 py-2 text-left w-32">Total (₹)</th>
                                            <th className="px-4 py-2 text-left">Reason/Notes</th>
                                            <th className="px-4 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {formData.items.map((item, idx) => (
                                            <tr key={idx} className="bg-white">
                                                <td className="px-4 py-2">
                                                    {item.isKeyed ? (
                                                        <>
                                                            <input
                                                                list={`kb-suggestions-${idx}`}
                                                                className="w-full border-b border-slate-300 focus:border-brand-500 outline-none px-1"
                                                                value={item.item_name}
                                                                onChange={e => handleUpdateItem(idx, 'item_name', e.target.value)}
                                                                placeholder="Search Item..."
                                                            />
                                                            <datalist id={`kb-suggestions-${idx}`}>
                                                                {knowledgeBase.map(kb => (
                                                                    <option key={kb.id} value={kb.name} />
                                                                ))}
                                                            </datalist>
                                                        </>
                                                    ) : (
                                                        <span className="font-medium text-slate-700">{item.item_name}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        className="w-full border rounded px-2 py-1"
                                                        value={item.quantity}
                                                        onChange={e => handleUpdateItem(idx, 'quantity', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        className="w-full border rounded px-2 py-1"
                                                        value={item.unit_cost}
                                                        onChange={e => handleUpdateItem(idx, 'unit_cost', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 font-mono text-slate-600">
                                                    ₹{(item.total || 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2 text-xs text-amber-600">
                                                    {item.reason && <span className="bg-amber-50 px-1 rounded">{item.reason}</span>}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button
                                    onClick={handleAddItem}
                                    className="w-full py-2 text-center text-sm text-brand-600 hover:bg-brand-50 font-medium border-t border-slate-200"
                                >
                                    + Add Item Manually
                                </button>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                            <div className="text-lg font-bold text-slate-800">
                                Grand Total: ₹{calculateGrandTotal().toFixed(2)}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-sm flex items-center gap-2"
                                >
                                    <FileText size={18} /> Confirm & Generate PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
