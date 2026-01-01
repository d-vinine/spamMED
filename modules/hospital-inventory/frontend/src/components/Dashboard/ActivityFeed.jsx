const ActivityFeed = () => {
    const activities = [
        { id: 1, action: 'Restocked', item: 'Paracetamol 500mg', user: 'Jane Doe', time: '2 hours ago' },
        { id: 2, action: 'Low Stock Alert', item: 'Amoxicillin', user: 'System', time: '4 hours ago' },
        { id: 3, action: 'Dispatched', item: 'Surgical Masks (Box)', user: 'Mike Smith', time: '5 hours ago' },
        { id: 4, action: 'Expired', item: 'Insulin Glargine', user: 'System', time: '1 day ago' },
    ];

    return (
        <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activities.map((activity) => (
                    <div key={activity.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: activity.user === 'System' ? 'var(--color-warning)' : 'var(--color-primary)',
                            marginTop: '0.5rem'
                        }} />
                        <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                <span style={{ fontWeight: 600 }}>{activity.item}</span> was {activity.action.toLowerCase()}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                {activity.user} • {activity.time}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityFeed;
