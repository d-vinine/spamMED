import { Card, Badge } from '../components/ui/components';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

const REQUESTS = [
    { id: 1, hospital: 'City General', item: 'Morphine Sulfate', quantity: 50, status: 'Pending', time: '10 mins ago' },
    { id: 2, hospital: 'St. Marys', item: 'Oanzer sterile', quantity: 200, status: 'Approved', time: '2 hours ago' },
    { id: 3, hospital: 'Northside Clinic', item: 'N95 Masks', quantity: 1000, status: 'Rejected', time: '1 day ago' },
];

export default function Emergency() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Emergency Stock Requests</h2>
                <button className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 shadow-sm shadow-rose-200">
                    Create Request
                </button>
            </div>

            <div className="grid gap-4">
                {REQUESTS.map((req) => (
                    <Card key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:border-brand-200 transition-colors">
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full shrink-0 ${req.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                                req.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {req.status === 'Pending' ? <Clock size={20} /> :
                                    req.status === 'Approved' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900">{req.hospital}</h4>
                                <p className="text-sm text-slate-600">Requested <span className="font-medium text-slate-900">{req.quantity}x {req.item}</span></p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-400">{req.time}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {req.status === 'Pending' && (
                                <>
                                    <button className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Decline</button>
                                    <button className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm">Approve</button>
                                </>
                            )}
                            {req.status !== 'Pending' && (
                                <Badge variant={req.status === 'Approved' ? 'success' : 'neutral'}>{req.status}</Badge>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
