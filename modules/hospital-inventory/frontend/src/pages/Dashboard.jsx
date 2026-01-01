import { Card, Badge } from '../components/ui/components';
import { Package, TrendingUp, AlertTriangle, AlertOctagon } from 'lucide-react';

const stats = [
    { label: 'Total Items', value: '1,248', change: '+12%', icon: Package, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Value in Stock', value: '₹45,200', change: '+2.5%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Low Stock', value: '12', change: 'Urgent', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Expired', value: '3', change: 'Action Req', icon: AlertOctagon, color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function Dashboard() {
    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label} className="hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                            </div>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className={stat.label === 'Low Stock' || stat.label === 'Expired' ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}>
                                {stat.change}
                            </span>
                            <span className="text-slate-400 ml-2">from last month</span>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <Card className="lg:col-span-2 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-slate-900">Inventory Trends</h3>
                        <select className="text-sm border-slate-200 rounded-lg p-2 bg-slate-50">
                            <option>Last 30 Days</option>
                            <option>Last Quarter</option>
                        </select>
                    </div>
                    <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        Chart Placeholder (Integrate Recharts later)
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card className="h-full">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                                <div>
                                    <p className="text-sm text-slate-900 font-medium">Batch #452 Added</p>
                                    <p className="text-xs text-slate-500">Paracetamol • 500 units</p>
                                    <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
