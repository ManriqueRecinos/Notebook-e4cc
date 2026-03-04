'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import type { Vocabulary } from '@/types';

export default function VocabularyPage() {
    const params = useParams();
    const workspaceId = params.id as string;
    const [vocab, setVocab] = useState<Vocabulary[]>([]);
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        word_english: '',
        word_spanish: '',
        present: '',
        past: '',
        past_participle: '',
        pronunciation: '',
        example_sentence: '',
        notes: '',
        notebook_id: '', // We'll need to select a notebook or have a default
    });

    const [notebooks, setNotebooks] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const nbs = await apiGet<any[]>('/api/notebooks', { workspace_id: workspaceId });
            setNotebooks(nbs);

            if (nbs.length > 0) {
                const notebookId = nbs[0].id;
                const data = await apiGet<Vocabulary[]>('/api/vocabulary', { notebook_id: notebookId });
                setVocab(data);
                setFormData(prev => ({ ...prev, notebook_id: notebookId }));
            }
        } catch (err) {
            console.error('Failed to load vocabulary:', err);
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAdd = async () => {
        if (!formData.word_english || !formData.notebook_id) return;
        try {
            await apiPost('/api/vocabulary', formData);
            setShowAdd(false);
            setFormData({
                word_english: '', word_spanish: '', present: '', past: '',
                past_participle: '', pronunciation: '', example_sentence: '', notes: '',
                notebook_id: notebooks[0]?.id || ''
            });
            fetchData();
        } catch (err) {
            console.error('Failed to add word:', err);
        }
    };

    const filtered = vocab.filter(v =>
        v.word_english.toLowerCase().includes(search.toLowerCase()) ||
        (v.word_spanish && v.word_spanish.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1 className="page-title">📖 Vocabulary</h1>
                        <p className="page-desc">{vocab.length} words tracked in this workspace</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Word</button>
                </div>
            </div>

            <div className="vocab-header">
                <div className="vocab-search">
                    <span>🔍</span>
                    <input
                        placeholder="Search words..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading vocabulary...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>English</th>
                                <th>Spanish</th>
                                <th>Present</th>
                                <th>Past</th>
                                <th>Past Participle</th>
                                <th>Pronunciation</th>
                                <th>Example</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                        No words found. Add some to get started!
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(v => (
                                    <tr key={v.id}>
                                        <td style={{ fontWeight: 600 }}>{v.word_english}</td>
                                        <td>{v.word_spanish}</td>
                                        <td><code className="code-pill">{v.present}</code></td>
                                        <td><code className="code-pill">{v.past}</code></td>
                                        <td><code className="code-pill">{v.past_participle}</code></td>
                                        <td style={{ fontStyle: 'italic', color: 'var(--text-tertiary)', fontSize: '12px' }}>{v.pronunciation}</td>
                                        <td style={{ maxWidth: '200px' }}>{v.example_sentence}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{v.notes}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Word Modal */}
            {showAdd && (
                <div className="overlay" onClick={() => setShowAdd(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <h2 style={{ marginBottom: 'var(--space-5)', fontFamily: 'var(--font-display)' }}>Add Vocabulary Word</h2>

                        <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                            <label className="input-label">Select Notebook</label>
                            <select
                                className="input-field"
                                style={{ width: '100%' }}
                                value={formData.notebook_id}
                                onChange={e => setFormData({ ...formData, notebook_id: e.target.value })}
                            >
                                {notebooks.map(nb => (
                                    <option key={nb.id} value={nb.id}>{nb.title}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            <div className="input-group">
                                <label className="input-label">English</label>
                                <input className="input-field" placeholder="e.g. run" style={{ width: '100%' }}
                                    value={formData.word_english} onChange={e => setFormData({ ...formData, word_english: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Spanish</label>
                                <input className="input-field" placeholder="e.g. correr" style={{ width: '100%' }}
                                    value={formData.word_spanish} onChange={e => setFormData({ ...formData, word_spanish: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Present</label>
                                <input className="input-field" placeholder="run" style={{ width: '100%' }}
                                    value={formData.present} onChange={e => setFormData({ ...formData, present: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Past</label>
                                <input className="input-field" placeholder="ran" style={{ width: '100%' }}
                                    value={formData.past} onChange={e => setFormData({ ...formData, past: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Past Participle</label>
                                <input className="input-field" placeholder="run" style={{ width: '100%' }}
                                    value={formData.past_participle} onChange={e => setFormData({ ...formData, past_participle: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Pronunciation</label>
                                <input className="input-field" placeholder="/rʌn/" style={{ width: '100%' }}
                                    value={formData.pronunciation} onChange={e => setFormData({ ...formData, pronunciation: e.target.value })} />
                            </div>
                        </div>
                        <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
                            <label className="input-label">Example Sentence</label>
                            <input className="input-field" placeholder="She runs every morning." style={{ width: '100%' }}
                                value={formData.example_sentence} onChange={e => setFormData({ ...formData, example_sentence: e.target.value })} />
                        </div>
                        <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
                            <label className="input-label">Notes</label>
                            <input className="input-field" placeholder="Irregular verb" style={{ width: '100%' }}
                                value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAdd}>Add Word</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
