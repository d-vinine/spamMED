import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, Siren } from 'lucide-react';
import logo from '../../assets/logo.png';

const Sidebar = () => {
    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Inventory', path: '/inventory', icon: Package },
        { name: 'Audit Log', path: '/audit', icon: ClipboardList },
        { name: 'Emergency', path: '/emergency', icon: Siren },
    ];

    return (
        <aside style={{
            width: '260px',
            backgroundColor: 'var(--color-surface)',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0
        }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-primary)' }}>
                    <img src={logo} alt="spamMED Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>spamMED</h1>
                </div>
            </div>

            <nav style={{ flex: 1, padding: '1.5rem 1rem' }}>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--border-radius-md)',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                                    fontWeight: isActive ? 600 : 500,
                                    transition: 'all var(--transition-fast)'
                                })}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-background)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: 'var(--color-text-secondary)'
                    }}>
                        JD
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>John Doe</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Admin</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
