'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Notebook, WorkspaceMember } from '@/types';

const mockNotebooks: Notebook[] = [
    { id: 'nb-1', workspace_id: 'ws-1', title: 'Grammar Fundamentals', description: 'Core grammar rules and exercises for intermediate learners.', created_by: 'u1', created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-04T14:00:00Z', creator_name: 'Admin' },
    { id: 'nb-2', workspace_id: 'ws-1', title: 'Irregular Verbs', description: 'Complete list of irregular verbs with conjugations and examples.', created_by: 'u2', created_at: '2026-02-25T08:00:00Z', updated_at: '2026-03-03T11:00:00Z', creator_name: 'Maria' },
    { id: 'nb-3', workspace_id: 'ws-1', title: 'Reading Comprehension', description: 'Practice passages and analysis techniques.', created_by: 'u1', created_at: '2026-02-20T09:00:00Z', updated_at: '2026-03-02T16:00:00Z', creator_name: 'Admin' },
    { id: 'nb-4', workspace_id: 'ws-1', title: 'Writing Exercises', description: 'Essay prompts and writing practice with peer review notes.', created_by: 'u3', created_at: '2026-02-18T14:00:00Z', updated_at: '2026-03-01T10:00:00Z', creator_name: 'Carlos' },
];

const mockMembers: WorkspaceMember[] = [
    { id: 'm1', workspace_id: 'ws-1', user_id: 'u1', role: 'OWNER', created_at: '2026-02-15T10:00:00Z', user_name: 'Admin' },
    { id: 'm2', workspace_id: 'ws-1', user_id: 'u2', role: 'EDITOR', created_at: '2026-02-16T08:00:00Z', user_name: 'Maria Garcia' },
    { id: 'm3', workspace_id: 'ws-1', user_id: 'u3', role: 'EDITOR', created_at: '2026-02-17T09:00:00Z', user_name: 'Carlos Lopez' },
    { id: 'm4', workspace_id: 'ws-1', user_id: 'u4', role: 'VIEWER', created_at: '2026-02-20T12:00:00Z', user_name: 'Ana Martinez' },
    { id: 'm5', workspace_id: 'ws-1', user_id: 'u5', role: 'VIEWER', created_at: '2026-02-22T11:00:00Z', user_name: 'Pedro Ruiz' },
];

export default function WorkspacePage() {
    const params = useParams();
    const router = useRouter();
    const workspaceId = params.id as string;
    const [showCreateNotebook, setShowCreateNotebook] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [inviteRole, setInviteRole] = useState('EDITOR');

    return (
        <>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1 className="page-title">English Study Group</h1>
                        <p className="page-desc">Collaborative workspace for English language learning.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        <Link href={`/workspace/${workspaceId}/vocabulary`} className="btn btn-secondary">📖 Vocabulary</Link>
                        <Link href={`/workspace/${workspaceId}/timeline`} className="btn btn-secondary">📊 Timeline</Link>
                        <button className="btn btn-primary" onClick={() => setShowCreateNotebook(true)}>+ New Notebook</button>
                    </div>
                </div>
            </div>

            {/* Notebooks */}
            <div className="notebook-list stagger-children">
                {mockNotebooks.map(nb => (
                    <div
                        key={nb.id}
                        className="notebook-card animate-slide-up"
                        onClick={() => router.push(`/workspace/${workspaceId}/notebook/${nb.id}`)}
                    >
                        <div className="notebook-card-title">📝 {nb.title}</div>
                        <div className="notebook-card-desc">{nb.description}</div>
                        <div className="notebook-card-footer">
                            <span>By {nb.creator_name}</span>
                            <span>Updated {new Date(nb.updated_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Members */}
            <div className="members-section">
                <div className="page-header-row" style={{ marginBottom: 'var(--space-4)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Members</h2>
                    <button className="btn btn-secondary btn-sm">+ Invite</button>
                </div>
                <div className="card">
                    <div className="members-list">
                        {mockMembers.map(m => (
                            <div key={m.id} className="member-row">
                                <div className="member-avatar">{m.user_name?.charAt(0)}</div>
                                <div className="member-info">
                                    <div className="member-name">{m.user_name}</div>
                                    <div className="member-joined">Joined {new Date(m.created_at).toLocaleDateString()}</div>
                                </div>
                                <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
                                <span className={`presence-dot ${['online', 'online', 'away', 'offline', 'offline'][mockMembers.indexOf(m)]}`} />
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
                        <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
                            <label className="input-label" htmlFor="nb-title">Title</label>
                            <input id="nb-title" className="input-field" placeholder="e.g. Verb Conjugations" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCreateNotebook(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={() => setShowCreateNotebook(false)}>Create</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
