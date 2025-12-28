import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, trend, trendValue, variant = 'default' }) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'warning':
                return { borderLeft: '4px solid var(--color-warning)' };
            case 'danger':
                return { borderLeft: '4px solid var(--color-danger)' };
            case 'success':
                return { borderLeft: '4px solid var(--color-success)' };
            default:
                return { borderLeft: '4px solid var(--color-primary)' };
        }
    };

    return (
        <div className="card" style={{ ...getVariantStyles(), display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</p>
                <div style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text-secondary)'
                }}>
                    <Icon size={20} />
                </div>
            </div>

            <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{value}</h3>
            </div>

            {trend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                    {trend === 'up' ?
                        <ArrowUpRight size={14} color="var(--color-success)" /> :
                        <ArrowDownRight size={14} color="var(--color-danger)" />
                    }
                    <span style={{
                        color: trend === 'up' ? 'var(--color-success)' : 'var(--color-danger)',
                        fontWeight: 600
                    }}>
                        {trendValue}
                    </span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>vs last month</span>
                </div>
            )}
        </div>
    );
};

export default StatsCard;
