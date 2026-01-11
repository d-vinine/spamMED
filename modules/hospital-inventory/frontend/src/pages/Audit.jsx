import { useState, useEffect } from 'react';
import { Card } from '../components/UI/components.jsx';
import { User, Loader2, AlertCircle, Calendar, Package, ArrowUpRight, ArrowDownLeft, Edit, Trash2, FileText } from 'lucide-react';

export default function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch('/api/audit-logs');
                if (!response.ok) throw new Error('Failed to fetch audit logs');
                const data = await response.json();
                setLogs(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const getIcon = (log) => {
        if (log.quantity_change > 0) return <ArrowUpRight size={16} className="text-emerald-600" />;
        if (log.quantity_change < 0) return <ArrowDownLeft size={16} className="text-rose-600" />;
        if (log.reason.includes("Deleted")) return <Trash2 size={16} className="text-slate-500" />;
        if (log.reason && log.reason.includes("Updated")) return <Edit size={16} className="text-indigo-600" />;
        return <FileText size={16} className="text-slate-500" />;
    };

    const getBgColor = (log) => {
        if (log.quantity_change > 0) return 'bg-emerald-50 border-emerald-100';
        if (log.quantity_change < 0) return 'bg-rose-50 border-rose-100';
        if (log.reason && log.reason.includes("Updated")) return 'bg-indigo-50 border-indigo-100';
        return 'bg-slate-50 border-slate-100';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-500" />
                <p>Loading audit logs...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-rose-500">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium">Error loading logs</p>
                <p className="text-sm text-slate-500">{error}</p>
            </div>
        );
    }

    const formatReason = (reason) => {
        if (reason === 'Initial Stock') return 'Item Added';
        return reason;
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Trail</h2>
                <p className="text-slate-500 mt-1">A complete history of all inventory movements and updates</p>
            </div>

            <div className="relative border-l-2 border-slate-100 ml-3.5 space-y-8 pb-12">
                {logs.length === 0 ? (
                    <div className="pl-8 text-slate-500 italic">No activity recorded yet.</div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="relative pl-10 group">
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[9px] top-1.5 h-5 w-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${log.quantity_change > 0 ? 'bg-emerald-500' :
                                log.quantity_change < 0 ? 'bg-rose-500' : 'bg-slate-400'
                                }`}>
                            </div>

                            {/* Card Content */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center flex-wrap gap-2">
                                            {/* Primary Subject: Item Name or Reason */}
                                            <span className="text-lg font-bold text-slate-900">
                                                {log.item?.name || formatReason(log.reason)}
                                            </span>

                                            {/* Reason Badge (if item name exists) */}
                                            {log.item?.name && (
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getBgColor(log)}`}>
                                                    {formatReason(log.reason)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Notes & Context */}
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {log.notes}
                                        </p>

                                        {/* Meta Details Grid */}
                                        {(log.batch || log.batch_id || log.quantity_change !== 0) && (
                                            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-50">
                                                {/* Batch Info */}
                                                {log.batch?.batch_number && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">
                                                        <Package size={14} className="text-slate-400" />
                                                        <span className="font-semibold">Batch:</span>
                                                        <span className="font-mono">{log.batch.batch_number}</span>
                                                    </div>
                                                )}

                                                {/* Location Info */}
                                                {log.batch?.location && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">
                                                        <span>📍</span>
                                                        <span>{log.batch.location}</span>
                                                    </div>
                                                )}

                                                {/* Quantity Change */}
                                                {log.quantity_change !== 0 && (
                                                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border ${log.quantity_change > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                                                        }`}>
                                                        {getIcon(log)}
                                                        {log.quantity_change > 0 ? 'Added' : 'Removed'} {Math.abs(log.quantity_change)} Units
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Timestamp & User */}
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                            <Calendar size={12} />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <span className="bg-slate-100 p-1 rounded-full">
                                                <User size={10} />
                                            </span>
                                            {log.performed_by || 'System'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
