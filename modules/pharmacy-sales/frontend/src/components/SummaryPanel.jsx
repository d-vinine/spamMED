import React from 'react';
import { Printer } from 'lucide-react';
import { cn } from './SmartEditor'; // Reuse utility

const SummaryPanel = ({ items }) => {
    // Calculate Totals
    const subtotal = items.reduce((sum, item) => {
        if (item.status === 'OutOfStock' || item.status === 'Unknown') return sum;
        return sum + (item.quantity * item.matched_item.price);
    }, 0);

    const tax = subtotal * 0.18; // 18% GST
    const grandTotal = subtotal + tax;

    return (
        <aside className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Payment Details</h2>

            <div className="space-y-4 mb-8">
                <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                    <span>GST (18%)</span>
                    <span className="font-mono text-slate-900">₹{tax.toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-200 my-4"></div>
                <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-slate-800">Grand Total</span>
                    <span className="text-2xl font-bold text-brand-600 font-mono">₹{grandTotal.toFixed(2)}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-auto">
                <button className="px-3 py-2 border-2 border-brand-500 bg-brand-50 text-brand-700 font-bold rounded-lg text-sm">Cash</button>
                <button className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-lg text-sm">UPI</button>
                <button className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-lg text-sm">Card</button>
            </div>

            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-6 shadow-lg shadow-green-200">
                <Printer size={20} />
                Print Bill (F2)
            </button>
        </aside>
    );
};

export default SummaryPanel;
