import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { AlertCircle, CheckCircle, Clock, Check, X } from 'lucide-react';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Indents() {
    const [indents, setIndents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchIndents = async () => {
        try {
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

    const handleStatus = async (id, status) => {
        try {
            const res = await fetch(`http://localhost:8080/api/indents/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchIndents();
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800">Indent Requests</h2>
                <p className="text-slate-500 text-sm">Manage stock requests from Pharmacy</p>
            </div>

            {loading && <p className="text-slate-500">Loading...</p>}
            {!loading && indents.length === 0 && <p className="text-slate-500">No indent requests found.</p>}

            {!loading && indents.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Item Name</th>
                                    <th className="px-6 py-4">Quantity</th>
                                    <th className="px-6 py-4">Status & Details</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {indents.map((indent) => (
                                    <tr key={indent.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-800">{indent.item_name}</td>
                                        <td className="px-6 py-4 font-mono text-slate-600">{indent.quantity}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-xs font-medium w-fit",
                                                    indent.status === 'PENDING' && "bg-amber-100 text-amber-700",
                                                    indent.status === 'PROCESSING' && "bg-blue-100 text-blue-700",
                                                    indent.status === 'DISPATCHED' && "bg-purple-100 text-purple-700",
                                                    indent.status === 'FULFILLED' && "bg-green-100 text-green-700",
                                                    indent.status === 'REJECTED' && "bg-red-100 text-red-700"
                                                )}>
                                                    {indent.status}
                                                </span>
                                                {indent.status === 'PROCESSING' && indent.dispatch_details && (
                                                    <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                                                        <div className="font-semibold text-slate-700 mb-0.5">Suggested Batches:</div>
                                                        {(() => {
                                                            try {
                                                                const details = JSON.parse(indent.dispatch_details);
                                                                return (
                                                                    <div className="flex flex-col gap-1 mt-1">
                                                                        {details.map((d, idx) => (
                                                                            <div key={idx} className="flex justify-between border-b border-slate-100 last:border-0 pb-1 last:pb-0">
                                                                                <span>{d.batch_number} (Loc: {d.location})</span>
                                                                                <span className="font-mono">x{d.quantity}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            } catch (e) {
                                                                return indent.dispatch_details; // Fallback for old string format
                                                            }
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {indent.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatus(indent.id, 'PROCESSING')}
                                                        className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatus(indent.id, 'REJECTED')}
                                                        className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {indent.status === 'PROCESSING' && (
                                                <button
                                                    onClick={() => handleStatus(indent.id, 'DISPATCHED')}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                                                >
                                                    Dispatch Stock
                                                </button>
                                            )}
                                            {indent.status === 'DISPATCHED' && (
                                                <span className="text-xs text-slate-400 italic">Awaiting Confirmation</span>
                                            )}
                                            {indent.status === 'FULFILLED' && (
                                                <span className="text-xs text-green-600 font-medium">Completed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
