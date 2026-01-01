import { Package, AlertTriangle, Clock, Siren } from 'lucide-react';
import StatsCard from '../components/Dashboard/StatsCard';
import ActivityFeed from '../components/Dashboard/ActivityFeed';

const Dashboard = () => {
    const stats = [
        { title: 'Total Stock Items', value: '1,234', icon: Package, trend: 'up', trendValue: '12%' },
        { title: 'Low Stock Alerts', value: '12', icon: AlertTriangle, variant: 'warning', trend: 'down', trendValue: '4%' },
        { title: 'Expiring Soon', value: '5', icon: Clock, variant: 'danger', trend: 'up', trendValue: '2' },
        { title: 'Emergency Requests', value: '3', icon: Siren, variant: 'default', trend: 'up', trendValue: '1' },
    ];

    const lowStockItems = [
        { id: 1, name: 'Amoxicillin 500mg', stock: 45, min: 100, unit: 'Box' },
        { id: 2, name: 'Surgical Gloves (M)', stock: 12, min: 50, unit: 'Box' },
        { id: 3, name: 'Saline Solution', stock: 8, min: 30, unit: 'L' },
        { id: 4, name: 'Adrenaline Injection', stock: 5, min: 20, unit: 'Amp' },
    ];

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Dashboard Overview</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Welcome back, Dr. Smith. Here is what's happening today.</p>
            </header>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Main Content Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '1.5rem',
                alignItems: 'start'
            }}>

                {/* Low Stock Alerts Section */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Low Stock Alerts</h3>
                        <button className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>View All</button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Item Name</th>
                                <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Current Stock</th>
                                <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Status</th>
                                <th style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lowStockItems.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem 0', fontWeight: 500 }}>{item.name}</td>
                                    <td style={{ padding: '1rem 0' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{item.stock}</span>
                                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}> / {item.min} {item.unit}</span>
                                    </td>
                                    <td style={{ padding: '1rem 0' }}>
                                        <span className="badge badge-danger">Critical</span>
                                    </td>
                                    <td style={{ padding: '1rem 0' }}>
                                        <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>Restock</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Activity Feed Sidebar */}
                <ActivityFeed />
            </div>
        </div>
    );
};

export default Dashboard;
