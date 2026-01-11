import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, AlertTriangle, FileText, Menu, X, Bell, ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/indents', label: 'Indents', icon: ShoppingCart },
    { path: '/orders', label: 'Supply Orders', icon: Package },
    { path: '/emergency', label: 'Emergency Requests', icon: AlertTriangle },
    { path: '/audit', label: 'Audit Logs', icon: FileText },
];

export default function Layout() {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();

    const activeTitle = NAV_ITEMS.find(item => item.path === location.pathname)?.label || 'Dashboard';

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col",
                    isSidebarOpen ? "w-60" : "w-16"
                )}
            >
                <div className="h-16 flex items-center justify-center border-b border-slate-200">
                    {isSidebarOpen ? (
                        <img src="/logo.png" alt="spamMED" className="h-10 w-auto object-contain" />
                    ) : (
                        <span className="text-xl font-bold text-brand-600">S</span>
                    )}
                </div>

                <nav className="flex-1 p-2 space-y-1">
                    {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            className={({ isActive }) => cn(
                                "flex items-center px-3 py-2 rounded-lg transition-colors group",
                                isActive
                                    ? "bg-brand-50 text-brand-700 font-medium"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )}
                        >
                            <Icon size={20} className={cn("shrink-0", isSidebarOpen && "mr-3")} />
                            {isSidebarOpen && <span className="truncate">{label}</span>}
                            {!isSidebarOpen && (
                                <div className="absolute left-14 bg-slate-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                    {label}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", isSidebarOpen ? "ml-60" : "ml-16")}>
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
                    <h1 className="text-xl font-semibold text-slate-800">{activeTitle}</h1>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                        </button>
                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold border border-brand-200">
                            U
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
