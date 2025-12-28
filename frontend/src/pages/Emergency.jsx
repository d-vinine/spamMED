import { Siren, MessageCircle, Truck } from 'lucide-react';

const Emergency = () => {
    const requests = [
        { id: 1, hospital: 'City General Hospital', item: 'O-Negative Blood Units', quantity: '5 Units', urgency: 'Critical', time: '10 mins ago' },
        { id: 2, hospital: 'St. Mary\'s Clinic', item: 'Anti-Venom (Snake)', quantity: '2 Vials', urgency: 'High', time: '1 hour ago' },
    ];

    return (
        <div>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Emergency Exchange</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Request critical supplies from nearby hospitals network.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Community Feed */}
                <div className="card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Siren color="var(--color-danger)" /> Active Community Requests
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {requests.map(req => (
                            <div key={req.id} style={{
                                border: '1px solid #e2e8f0',
                                borderRadius: 'var(--border-radius-md)',
                                padding: '1.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: 'var(--color-surface-hover)'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <span className="badge badge-danger">{req.urgency}</span>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{req.time}</span>
                                    </div>
                                    <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>{req.item}</h4>
                                    <p style={{ color: 'var(--color-text-secondary)' }}>Needed by <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{req.hospital}</span> • Qty: {req.quantity}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-outline">Ignore</button>
                                    <button className="btn btn-primary">
                                        <Truck size={18} /> Offer Stock
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* New Request Form */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Create New Request</h3>

                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Item Needed</label>
                            <input type="text" className="form-input" placeholder="e.g. Plasma" style={{
                                width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0'
                            }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Urgency Level</label>
                            <select style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                                <option>Critical (Life Threatening)</option>
                                <option>High (Urgent Procedure)</option>
                                <option>Medium (Restock Required)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Quantity</label>
                            <input type="text" placeholder="e.g. 2 Units" style={{
                                width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', border: '1px solid #e2e8f0'
                            }} />
                        </div>

                        <button className="btn btn-primary" style={{ backgroundColor: 'var(--color-danger)', border: 'none', marginTop: '1rem' }}>
                            <Siren size={18} /> Broadcast Request
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Emergency;
