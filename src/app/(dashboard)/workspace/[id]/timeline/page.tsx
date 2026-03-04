'use client';
import { useParams } from 'next/navigation';
import type { ActivityLog } from '@/types';

const mockLogs: ActivityLog[] = [
    { id: 'l1', workspace_id: 'ws-1', notebook_id: 'nb-1', user_id: 'u1', entity_type: 'block', entity_id: 'b1', action: 'UPDATE', old_data: { text: 'Welcome' }, new_data: { text: 'Welcome to Grammar Fundamentals' }, created_at: '2026-03-04T14:30:00Z', user_name: 'Admin' },
    { id: 'l2', workspace_id: 'ws-1', notebook_id: 'nb-1', user_id: 'u2', entity_type: 'vocabulary', entity_id: 'v6', action: 'INSERT', old_data: null, new_data: { word_english: 'forgive', word_spanish: 'perdonar' }, created_at: '2026-03-04T13:15:00Z', user_name: 'Maria Garcia' },
    { id: 'l3', workspace_id: 'ws-1', notebook_id: 'nb-2', user_id: 'u3', entity_type: 'notebook', entity_id: 'nb-2', action: 'UPDATE', old_data: { title: 'Verbs' }, new_data: { title: 'Irregular Verbs' }, created_at: '2026-03-04T11:00:00Z', user_name: 'Carlos Lopez' },
    { id: 'l4', workspace_id: 'ws-1', notebook_id: 'nb-3', user_id: 'u1', entity_type: 'section', entity_id: 's5', action: 'INSERT', old_data: null, new_data: { title: 'Advanced Passages', type: 'notes' }, created_at: '2026-03-03T16:45:00Z', user_name: 'Admin' },
    { id: 'l5', workspace_id: 'ws-1', notebook_id: 'nb-1', user_id: 'u4', entity_type: 'block', entity_id: 'b10', action: 'DELETE', old_data: { text: 'Draft note' }, new_data: null, created_at: '2026-03-03T14:20:00Z', user_name: 'Ana Martinez' },
    { id: 'l6', workspace_id: 'ws-1', notebook_id: null, user_id: 'u1', entity_type: 'workspace_member', entity_id: 'm5', action: 'INSERT', old_data: null, new_data: { user_name: 'Pedro Ruiz', role: 'VIEWER' }, created_at: '2026-03-02T10:00:00Z', user_name: 'Admin' },
    { id: 'l7', workspace_id: 'ws-1', notebook_id: 'nb-4', user_id: 'u3', entity_type: 'notebook', entity_id: 'nb-4', action: 'INSERT', old_data: null, new_data: { title: 'Writing Exercises' }, created_at: '2026-03-01T09:30:00Z', user_name: 'Carlos Lopez' },
];

function actionLabel(action: string, entity: string) {
    const labels: Record<string, Record<string, string>> = {
        INSERT: { block: 'added a block', notebook: 'created a notebook', section: 'added a section', vocabulary: 'added a word', workspace_member: 'invited a member' },
        UPDATE: { block: 'edited a block', notebook: 'updated a notebook', section: 'renamed a section', vocabulary: 'updated a word' },
        DELETE: { block: 'deleted a block', notebook: 'removed a notebook', section: 'removed a section', vocabulary: 'removed a word' },
    };
    return labels[action]?.[entity] || `${action} ${entity}`;
}

function dotClass(action: string) {
    if (action === 'INSERT') return 'create';
    if (action === 'DELETE') return 'delete';
    return 'update';
}

function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}

export default function TimelinePage() {
    const params = useParams();

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">📊 Activity Timeline</h1>
                <p className="page-desc">Track all changes and updates in this workspace.</p>
            </div>

            <div className="timeline">
                {mockLogs.map(log => (
                    <div key={log.id} className="timeline-item">
                        <div className={`timeline-dot ${dotClass(log.action)}`} />
                        <div className="timeline-content">
                            <div className="timeline-action">
                                <strong>{log.user_name}</strong> {actionLabel(log.action, log.entity_type)}
                            </div>
                            <div className="timeline-meta">
                                <span>{formatTime(log.created_at)}</span>
                                <span>·</span>
                                <span>{log.entity_type}</span>
                            </div>
                            {log.new_data && (
                                <div className="timeline-entity">
                                    {Object.entries(log.new_data).map(([k, v]) => (
                                        <span key={k} style={{ marginRight: '12px' }}>
                                            <strong>{k}:</strong> {String(v)}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
