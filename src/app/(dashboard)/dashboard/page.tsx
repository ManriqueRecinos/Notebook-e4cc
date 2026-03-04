'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Workspace } from '@/types';

// Simulated data
const mockWorkspaces: (Workspace & { notebooks_count: number; members_count: number })[] = [
    {
        id: 'ws-1', name: 'English Study Group', owner_id: 'u1',
        created_at: '2026-02-15T10:00:00Z', notebooks_count: 8, members_count: 5,
    },
    {
        id: 'ws-2', name: 'Dev Team Notes', owner_id: 'u1',
        created_at: '2026-01-20T08:00:00Z', notebooks_count: 12, members_count: 3,
    },
    {
        id: 'ws-3', name: 'Personal Learning', owner_id: 'u1',
        created_at: '2026-03-01T12:00:00Z', notebooks_count: 4, members_count: 1,
    },
];

export default function DashboardPage() {
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');

    return (
        <>
            {/* Stats */}
            <div className="stats-row stagger-children">
                <div className="stat-card animate-fade-in">
                    <div className="stat-card-label">Workspaces</div>
                    <div className="stat-card-value gradient-text">3</div>
                    <div className="stat-card-change">+1 this month</div>
                </div>
                <div className="stat-card animate-fade-in">
                    <div className="stat-card-label">Notebooks</div>
                    <div className="stat-card-value gradient-text">24</div>
                    <div className="stat-card-change">+5 this week</div>
                </div>
                <div className="stat-card animate-fade-in">
                    <div className="stat-card-label">Vocabulary Words</div>
                    <div className="stat-card-value gradient-text">156</div>
                    <div className="stat-card-change">+12 today</div>
                </div>
                <div className="stat-card animate-fade-in">
                    <div className="stat-card-label">Collaborators</div>
                    <div className="stat-card-value gradient-text">9</div>
                    <div className="stat-card-change">Active now</div>
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

            <div className="dashboard-grid stagger-children">
                {mockWorkspaces.map(ws => (
                    <Link key={ws.id} href={`/workspace/${ws.id}`}>
                        <div className="workspace-card animate-slide-up">
                            <div className="workspace-card-header">
                                <div className="workspace-card-icon">📚</div>
                                <span className="badge badge-owner">Owner</span>
                            </div>
                            <h3>{ws.name}</h3>
                            <p className="workspace-card-meta">
                                Created {new Date(ws.created_at).toLocaleDateString()}
                            </p>
                            <div className="workspace-card-stats">
                                <span className="workspace-card-stat">
                                    📝 <strong>{ws.notebooks_count}</strong> notebooks
                                </span>
                                <span className="workspace-card-stat">
                                    👥 <strong>{ws.members_count}</strong> members
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

            {/* Create Modal */}
            {showCreate && (
                <div className="overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: 'var(--space-5)', fontFamily: 'var(--font-display)' }}>
                            Create Workspace
                        </h2>
                        <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
                            <label className="input-label" htmlFor="ws-name">Workspace Name</label>
                            <input
                                id="ws-name"
                                className="input-field"
                                placeholder="e.g. English Study Group"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={() => setShowCreate(false)}>Create</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
