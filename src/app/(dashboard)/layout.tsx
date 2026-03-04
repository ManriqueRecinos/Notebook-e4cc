'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import './dashboard.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const initial = user?.name?.charAt(0).toUpperCase() || 'U';

    const navItems = [
        { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
        { icon: '📚', label: 'Workspaces', href: '/dashboard', badge: '3' },
    ];

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <Link href="/dashboard" className="sidebar-logo">
                        <div className="sidebar-logo-icon">L</div>
                        <span className="gradient-text">Lexora</span>
                    </Link>
                    <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
                        ☰
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Main</div>
                        {navItems.map(item => (
                            <Link
                                key={item.href + item.label}
                                href={item.href}
                                className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
                            >
                                <span className="sidebar-item-icon">{item.icon}</span>
                                {item.label}
                                {item.badge && <span className="sidebar-item-badge">{item.badge}</span>}
                            </Link>
                        ))}
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Recent Workspaces</div>
                        {['English Study Group', 'Dev Team Notes', 'Personal Learning'].map((ws, i) => (
                            <button key={i} className="sidebar-item" onClick={() => router.push(`/workspace/ws-${i + 1}`)}>
                                <span className="sidebar-item-icon">📂</span>
                                {ws}
                            </button>
                        ))}
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Tools</div>
                        <button className="sidebar-item" onClick={() => { }}>
                            <span className="sidebar-item-icon">📖</span>
                            Vocabulary
                        </button>
                        <button className="sidebar-item" onClick={() => { }}>
                            <span className="sidebar-item-icon">📊</span>
                            Timeline
                        </button>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user" onClick={logout}>
                        <div className="sidebar-avatar">{initial}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.name || 'Guest User'}</div>
                            <div className="sidebar-user-role">Sign out</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="main-content">
                <header className="topbar">
                    <div className="topbar-left">
                        {collapsed && (
                            <button className="btn btn-ghost btn-icon" onClick={() => setCollapsed(false)}>
                                ☰
                            </button>
                        )}
                        <div className="topbar-breadcrumb">
                            <Link href="/dashboard">Dashboard</Link>
                            {pathname !== '/dashboard' && (
                                <>
                                    <span className="separator">/</span>
                                    <span className="current">{pathname.split('/').pop()}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="topbar-right">
                        <div className="topbar-presence">
                            {['A', 'B', 'C'].map((l, i) => (
                                <div key={i} className="topbar-presence-avatar" style={{
                                    background: ['#6C5CE7', '#00D2FF', '#00C48C'][i],
                                    color: 'white',
                                }}>{l}</div>
                            ))}
                        </div>
                        <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle theme">
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                    </div>
                </header>
                <div className="page-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
