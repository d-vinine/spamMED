import { Card } from '../components/ui/components';
import { User } from 'lucide-react';

const LOGS = [
    { id: 1, action: 'Added Batch', details: 'Added 500 units of Paracetamol (Batch #452)', user: 'Dr. Sarah', time: '2 hours ago' },
    { id: 2, action: 'Stock Alert', details: 'Low stock warning for Insulin Glargine', user: 'System', time: '4 hours ago' },
    { id: 3, action: 'Request Approved', details: 'Approved 200 units of Oanzer for St. Marys', user: 'Admin', time: '5 hours ago' },
];

export default function AuditLog() {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">System Audit Logs</h2>

            <div className="relative border-l border-slate-200 ml-3 space-y-8">
                {LOGS.map((log) => (
                    <div key={log.id} className="relative pl-8">
                        <span className="absolute -left-[9px] top-1 h-[18px] w-[18px] rounded-full border-2 border-white bg-brand-500 ring-4 ring-slate-50"></span>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                            <div>
                                <p className="text-sm font-medium text-slate-900">{log.action}</p>
                                <p className="text-slate-600 text-sm">{log.details}</p>
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap">{log.time}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                                <User size={12} className="text-slate-500" />
                            </div>
                            <span className="text-xs text-slate-500">{log.user}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
