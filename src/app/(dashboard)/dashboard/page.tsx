'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPost } from '@/lib/api';

interface WorkspaceRow {
    id: string;
    name: string;
    owner_id: string;
    created_at: string;
    role: string;
    notebooks_count: number;
    members_count: number;
}

export default function DashboardPage() {
    const { user, token } = useAuth();
    const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const fetchWorkspaces = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await apiGet<WorkspaceRow[]>('/api/workspaces');
            setWorkspaces(data);
        } catch (err) {
            console.error('Failed to load workspaces:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        setError('');
        try {
            await apiPost('/api/workspaces', { name: newName.trim() });
            setNewName('');
            setShowCreate(false);
            await fetchWorkspaces();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create workspace');
        } finally {
            setCreating(false);
        }
    };

    const totalNotebooks = workspaces.reduce((sum, w) => sum + (w.notebooks_count || 0), 0);
    const totalMembers = workspaces.reduce((sum, w) => sum + (w.members_count || 0), 0);

    return (
        <>
            {/* Stats */}
            <div className="stats-row stagger-children">
                <div className="stat-card animate-fade-in">
                    <div className="stat-card-label">Workspaces</div>
                    <div className="stat-card-value gradient-text">{workspaces.length}</div>
                </div>
                <div className="stat-card animate-fade-in">
                    <div className="stat-card-label">Notebooks</div>
                    <div className="stat-card-value gradient-text">{totalNotebooks}</div>
                </div>
                <div className="stat-card animate-fade-in">
                    <div className="stat-card-label">Collaborators</div>
                    <div className="stat-card-value gradient-text">{totalMembers}</div>
                </div>
            </div>

            {/* Workspaces */}
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1 className="page-title">Your Workspaces</h1>
                        <p className="page-desc">Manage your learning spaces and collaborate with your team.</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="dashboard-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="workspace-card" style={{ minHeight: 180 }}>
                            <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 12 }} />
                            <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 24 }} />
                            <div className="skeleton" style={{ height: 12, width: '80%' }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="dashboard-grid stagger-children">
                    {workspaces.map(ws => (
                        <Link key={ws.id} href={`/workspace/${ws.id}`}>
                            <div className="workspace-card animate-slide-up">
                                <div className="workspace-card-header">
                                    <div className="workspace-card-icon">📚</div>
                                    <span className={`badge badge-${ws.role?.toLowerCase() || 'owner'}`}>{ws.role || 'OWNER'}</span>
                                </div>
                                <h3>{ws.name}</h3>
                                <p className="workspace-card-meta">
                                    Created {new Date(ws.created_at).toLocaleDateString()}
                                </p>
                                <div className="workspace-card-stats">
                                    <span className="workspace-card-stat">
                                        📝 <strong>{ws.notebooks_count || 0}</strong> notebooks
                                    </span>
                                    <span className="workspace-card-stat">
                                        👥 <strong>{ws.members_count || 0}</strong> members
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    <div className="create-card" onClick={() => setShowCreate(true)}>
                        <div className="create-card-icon">+</div>
                        <span>Create Workspace</span>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: 'var(--space-5)', fontFamily: 'var(--font-display)' }}>
                            Create Workspace
                        </h2>
                        {error && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
                        <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
                            <label className="input-label" htmlFor="ws-name">Workspace Name</label>
                            <input
                                id="ws-name"
                                className="input-field"
                                placeholder="e.g. English Study Group"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                style={{ width: '100%' }}
                                autoFocus
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
