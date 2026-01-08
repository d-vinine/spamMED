import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

const Indents = () => {
    const [indents, setIndents] = useState([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetchIndents();
    }, []);

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Indent Status</h2>
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
    );
};

export default Indents;
