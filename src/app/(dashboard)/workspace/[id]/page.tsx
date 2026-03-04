'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import type { Notebook, WorkspaceMember, User } from '@/types';

export default function WorkspacePage() {
    const params = useParams();
    const router = useRouter();
    const { user, token } = useAuth();
    const workspaceId = params.id as string;

    const [workspace, setWorkspace] = useState<{ id: string; name: string; owner_id: string } | null>(null);
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateNotebook, setShowCreateNotebook] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [userQuery, setUserQuery] = useState('');
    const [foundUsers, setFoundUsers] = useState<{ id: string, name: string, level: string }[]>([]);
    const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null);
    const [selectedRole, setSelectedRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
    const [creating, setCreating] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState('');

    const fetchAll = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const [ws, nbs, mems] = await Promise.all([
                apiGet<{ id: string; name: string; owner_id: string }>(`/api/workspaces/${workspaceId}`),
                apiGet<Notebook[]>('/api/notebooks', { workspace_id: workspaceId }),
                apiGet<WorkspaceMember[]>(`/api/workspaces/${workspaceId}/members`),
            ]);
            setWorkspace(ws);
            setNotebooks(nbs);
            setMembers(mems);
        } catch (err) {
            console.error('Failed to load workspace:', err);
        } finally {
            setLoading(false);
        }
    }, [token, workspaceId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (userQuery.length >= 2) {
                try {
                    const users = await apiGet<(User & { name: string })[]>('/api/users/search', { q: userQuery });
                    // Filter out users already in workspace
                    const memberIds = members.map(m => m.user_id);
                    const filtered = users.filter(u => !memberIds.includes(u.id));
                    setFoundUsers(filtered.map(u => ({ id: u.id, name: u.name, level: u.level })));
                } catch (err) {
                    console.error('Search failed:', err);
                }
            } else {
                setFoundUsers([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [userQuery, members]);

    const handleCreateNotebook = async () => {
        if (!newTitle.trim()) return;
        setCreating(true);
        setError('');
        try {
            await apiPost('/api/notebooks', {
                workspace_id: workspaceId,
                title: newTitle.trim(),
                description: newDesc.trim() || null,
            });
            setNewTitle('');
            setNewDesc('');
            setShowCreateNotebook(false);
            await fetchAll();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create notebook');
        } finally {
            setCreating(false);
        }
    };

    const handleInviteMember = async () => {
        if (!selectedUser) return;
        setInviting(true);
        setError('');
        try {
            await apiPost(`/api/workspaces/${workspaceId}/members`, {
                user_id: selectedUser.id,
                role: selectedRole
            });
            setSelectedUser(null);
            setUserQuery('');
            setShowAddMember(false);
            await fetchAll();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Invitation failed');
        } finally {
            setInviting(false);
        }
    };

    const handleDeleteNotebook = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this notebook?')) return;
        try {
            await apiDelete(`/api/notebooks/${id}`);
            await fetchAll();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const isOwner = workspace && (members.find(m => m.user_id === user?.id)?.role === 'OWNER');

    if (loading) {
        return (
            <div>
                <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 32 }} />
                <div className="notebook-list">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="notebook-card" style={{ minHeight: 120 }}>
                            <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                            <div className="skeleton" style={{ height: 12, width: '90%', marginBottom: 16 }} />
                            <div className="skeleton" style={{ height: 10, width: '40%' }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1 className="page-title">{workspace?.name || 'Workspace'}</h1>
                        <p className="page-desc">{notebooks.length} notebooks · {members.length} members</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        <Link href={`/workspace/${workspaceId}/vocabulary`} className="btn btn-secondary">📖 Vocabulary</Link>
                        <Link href={`/workspace/${workspaceId}/timeline`} className="btn btn-secondary">📊 Timeline</Link>
                        <button className="btn btn-primary" onClick={() => setShowCreateNotebook(true)}>+ New Notebook</button>
                    </div>
                </div>
            </div>

            {/* Notebooks */}
            {notebooks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-tertiary)' }}>
                    <p style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>📝</p>
                    <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 'var(--space-2)' }}>No notebooks yet</p>
                    <p style={{ fontSize: 14 }}>Create your first notebook to get started.</p>
                </div>
            ) : (
                <div className="notebook-list stagger-children">
                    {notebooks.map(nb => (
                        <div
                            key={nb.id}
                            className="notebook-card animate-slide-up"
                            onClick={() => router.push(`/workspace/${workspaceId}/notebook/${nb.id}`)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="notebook-card-title">📝 {nb.title}</div>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={(e) => handleDeleteNotebook(nb.id, e)}
                                    title="Delete notebook"
                                    style={{ fontSize: 12, opacity: 0.5 }}
                                >🗑️</button>
                            </div>
                            <div className="notebook-card-desc">{nb.description || 'No description'}</div>
                            <div className="notebook-card-footer">
                                <span>By {nb.creator_name || 'Unknown'}</span>
                                <span>Updated {new Date(nb.updated_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Members */}
            <div className="members-section">
                <div className="page-header-row" style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Members ({members.length})</h2>
                    {isOwner && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMember(true)}>+ Add Member</button>
                    )}
                </div>
                <div className="card">
                    <div className="members-list">
                        {members.map(m => (
                            <div key={m.id} className="member-row">
                                <div className="member-avatar">{(m.user_name || '?').charAt(0).toUpperCase()}</div>
                                <div className="member-info">
                                    <div className="member-name">
                                        {m.user_name || 'Unknown'} {m.user_id === user?.id && <span style={{ opacity: 0.5 }}>(you)</span>}
                                        <span className="badge badge-sm" style={{ marginLeft: 8, fontSize: 10, background: 'var(--bg-tertiary)' }}>{m.user_level}</span>
                                    </div>
                                    <div className="member-joined">Joined {new Date(m.created_at).toLocaleDateString()}</div>
                                </div>
                                <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Create Notebook Modal */}
            {showCreateNotebook && (
                <div className="overlay" onClick={() => setShowCreateNotebook(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: 'var(--space-5)', fontFamily: 'var(--font-display)' }}>Create Notebook</h2>
                        {error && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
                        <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                            <label className="input-label" htmlFor="nb-title">Title</label>
                            <input
                                id="nb-title"
                                className="input-field"
                                placeholder="e.g. Verb Conjugations"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateNotebook()}
                                style={{ width: '100%' }}
                                autoFocus
                            />
                        </div>
                        <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
                            <label className="input-label" htmlFor="nb-desc">Description (optional)</label>
                            <input
                                id="nb-desc"
                                className="input-field"
                                placeholder="Brief description..."
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCreateNotebook(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateNotebook} disabled={creating}>
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMember && (
                <div className="overlay" onClick={() => setShowAddMember(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: 'var(--space-5)', fontFamily: 'var(--font-display)' }}>Add Collaborator</h2>
                        {error && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

                        <div className="input-group" style={{ marginBottom: 'var(--space-4)', position: 'relative' }}>
                            <label className="input-label">Search Users</label>
                            <input
                                className="input-field"
                                placeholder="Start typing username..."
                                value={userQuery}
                                onChange={e => {
                                    setUserQuery(e.target.value);
                                    setSelectedUser(null);
                                }}
                                style={{ width: '100%' }}
                                autoFocus
                            />
                            {foundUsers.length > 0 && !selectedUser && (
                                <div className="search-results-popover" style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-md)', zIndex: 10, marginTop: '4px',
                                    boxShadow: 'var(--shadow-lg)'
                                }}>
                                    {foundUsers.map(u => (
                                        <div
                                            key={u.id}
                                            className="search-result-item"
                                            onClick={() => {
                                                setSelectedUser(u);
                                                setUserQuery(u.name);
                                            }}
                                            style={{
                                                padding: '8px 12px', cursor: 'pointer',
                                                borderBottom: '1px solid var(--border-subtle)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}
                                        >
                                            <span>{u.name}</span>
                                            <span className="badge badge-sm">{u.level}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedUser && (
                            <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
                                <label className="input-label">Role</label>
                                <select
                                    className="input-field"
                                    style={{ width: '100%' }}
                                    value={selectedRole}
                                    onChange={e => setSelectedRole(e.target.value as any)}
                                >
                                    <option value="EDITOR">EDITOR (Can create and edit content)</option>
                                    <option value="VIEWER">VIEWER (Read-only access)</option>
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleInviteMember} disabled={inviting || !selectedUser}>
                                {inviting ? 'Inviting...' : 'Invite'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
