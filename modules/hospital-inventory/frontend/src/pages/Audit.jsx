import { Search, Filter, Download } from 'lucide-react';
import { useState, useEffect } from 'react';

const AuditLog = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8080/api/logs')
            .then(res => res.json())
            .then(data => setLogs(data))
            .catch(err => console.error("Failed to fetch logs:", err));
    }, []);

    return (
        <div>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Audit Logs</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Track all inventory movements and system alerts.</p>
                </div>
                <button className="btn btn-outline">
                    <Download size={18} /> Export CSV
                </button>
            </header>

            <div className="card">
                {/* Controls */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            style={{
                                width: '100%',
                                padding: '0.625rem 1rem 0.625rem 2.5rem',
                                borderRadius: 'var(--border-radius-md)',
                                border: '1px solid #e2e8f0',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button className="btn btn-outline">
                        <Filter size={18} /> Filter
                    </button>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', width: '200px' }}>Timestamp</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', width: '200px' }}>Action</th>
                                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem 1rem', fontWeight: 500 }}>{log.action}</td>
                                    <td style={{ padding: '1rem 1rem', color: 'var(--color-text-secondary)' }}>{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No logs found.</p>}
                </div>
            </div>
        </div>
    );
};

export default AuditLog;
