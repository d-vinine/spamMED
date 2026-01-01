import React from 'react';

const SummaryPanel = ({ items }) => {
    // Calculate Totals
    const subtotal = items.reduce((sum, item) => {
        if (item.status === 'OutOfStock' || item.status === 'Unknown') return sum;
        return sum + (item.quantity * item.matched_item.price);
    }, 0);

    const tax = subtotal * 0.18; // 18% GST
    const grandTotal = subtotal + tax;

    return (
        <aside className="summary-panel">
            <h2>Payment Details</h2>

            <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
                <span>GST (18%)</span>
                <span>₹{tax.toFixed(2)}</span>
            </div>

            <div className="divider"></div>

            <div className="total-row">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
            </div>

            <div className="payment-modes">
                <button className="mode active">Cash</button>
                <button className="mode">UPI</button>
                <button className="mode">Card</button>
            </div>

            <button className="btn-print">Print Bill (F2)</button>
        </aside>
    );
};

export default SummaryPanel;
