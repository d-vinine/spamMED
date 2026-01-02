import { useState, useEffect } from 'react';
import { Card } from '../components/ui/components';
import { Package, TrendingUp, AlertTriangle, AlertOctagon, Calendar, User, ArrowUpRight, ArrowDownLeft, FileText, Trash2, Edit } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({
        total_items: 0,
        total_value: 0,
        low_stock_items: 0,
        expired_items: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch Stats
                const statsRes = await fetch('http://localhost:8080/api/dashboard/stats');
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                // Fetch Recent Activity (Audit logs, limit client side or server if params supported)
                const logsRes = await fetch('http://localhost:8080/api/audit-logs');
                if (logsRes.ok) {
                    const logsData = await logsRes.json();
                    // Take first 5, assuming sorted by date desc from backend
                    setRecentActivity(logsData.slice(0, 5));
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const statCards = [
        {
            label: 'Total Items',
            value: stats.total_items,
            icon: Package,
            color: 'text-brand-600',
            bg: 'bg-brand-50'
        },
        {
            label: 'Total Value',
            value: formatCurrency(stats.total_value),
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            label: 'Low Stock',
            value: stats.low_stock_items,
            icon: AlertTriangle,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            highlight: stats.low_stock_items > 0
        },
        {
            label: 'Expired',
            value: stats.expired_items,
            icon: AlertOctagon,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            highlight: stats.expired_items > 0
        },
    ];

    const getIcon = (log) => {
        if (log.quantity_change > 0) return <ArrowUpRight size={16} className="text-emerald-600" />;
        if (log.quantity_change < 0) return <ArrowDownLeft size={16} className="text-rose-600" />;
        if (log.reason.includes("Deleted")) return <Trash2 size={16} className="text-slate-500" />;
        if (log.reason && log.reason.includes("Updated")) return <Edit size={16} className="text-indigo-600" />;
        return <FileText size={16} className="text-slate-500" />;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <h3 className={`text-2xl font-bold mt-1 ${stat.highlight ? 'text-rose-600' : 'text-slate-900'}`}>
                                    {loading ? '...' : stat.value}
                                </h3>
                            </div>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area - Placeholder for now */}
                <Card className="lg:col-span-2 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-slate-900">Inventory Trends</h3>
                        <select className="text-sm border-slate-200 rounded-lg p-2 bg-slate-50">
                            <option>Last 30 Days</option>
                            <option>Last Quarter</option>
                        </select>
                    </div>
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200 p-8">
                        <TrendingUp className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="font-medium">Chart Integration Pending</p>
                        <p className="text-sm text-slate-400 mt-1">Need to install Recharts or Chart.js</p>
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card className="h-full">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8 text-slate-400">Loading activity...</div>
                        ) : recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">No recent activity</div>
                        ) : (
                            recentActivity.map((log) => (
                                <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                                    <div className={`mt-1 p-1 rounded-full shrink-0 ${log.quantity_change > 0 ? 'bg-emerald-100' :
                                            log.quantity_change < 0 ? 'bg-rose-100' : 'bg-slate-100'
                                        }`}>
                                        {getIcon(log)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-900 font-medium">
                                            {log.item?.name || log.reason}
                                        </p>
                                        <p className="text-xs text-slate-500 line-clamp-1">
                                            {log.notes || (log.quantity_change > 0 ? `Added ${log.quantity_change} units` : `Removed ${Math.abs(log.quantity_change)} units`)}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            <span>•</span>
                                            <span>{log.performed_by || 'System'}</span>
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
