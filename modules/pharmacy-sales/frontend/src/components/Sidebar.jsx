import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="logo">SM</div>
            <nav>
                <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} title="Billing">
                    💸
                </NavLink>
                <NavLink to="/inventory" className={({ isActive }) => isActive ? 'active' : ''} title="Inventory">
                    📦
                </NavLink>
            </nav>
        </aside>
    );
};

export default Sidebar;
