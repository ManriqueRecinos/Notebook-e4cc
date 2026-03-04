'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import type { Notebook, WorkspaceMember } from '@/types';

export default function WorkspacePage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const workspaceId = params.id as string;

    const [workspace, setWorkspace] = useState<{ id: string; name: string } | null>(null);
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateNotebook, setShowCreateNotebook] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const fetchAll = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const [ws, nbs, mems] = await Promise.all([
                apiGet<{ id: string; name: string }>(`/api/workspaces/${workspaceId}`),
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
                <div className="page-header-row" style={{ marginBottom: 'var(--space-4)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Members ({members.length})</h2>
                </div>
                <div className="card">
                    <div className="members-list">
                        {members.map(m => (
                            <div key={m.id} className="member-row">
                                <div className="member-avatar">{(m.user_name || '?').charAt(0).toUpperCase()}</div>
                                <div className="member-info">
                                    <div className="member-name">{m.user_name || 'Unknown'}</div>
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
        </>
    );
}
