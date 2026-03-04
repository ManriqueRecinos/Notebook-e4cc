'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import type { ActivityLog } from '@/types';

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
    const workspaceId = params.id as string;
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiGet<ActivityLog[]>('/api/activity', { workspace_id: workspaceId });
            setLogs(data);
        } catch (err) {
            console.error('Failed to load activity logs:', err);
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">📊 Activity Timeline</h1>
                <p className="page-desc">Track all changes and updates in this workspace.</p>
            </div>

            {loading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading activity logs...</div>
            ) : (
                <div className="timeline">
                    {logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                            No activity recorded yet.
                        </div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="timeline-item animate-fade-in">
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
                                                    <strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </>
    );
}
