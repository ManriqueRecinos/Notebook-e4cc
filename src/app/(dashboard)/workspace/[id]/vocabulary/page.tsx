'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import type { Vocabulary } from '@/types';

const mockVocab: Vocabulary[] = [
    { id: 'v1', notebook_id: 'nb-1', word_english: 'accomplish', word_spanish: 'lograr', present: 'accomplish', past: 'accomplished', past_participle: 'accomplished', pronunciation: '/əˈkɑːm.plɪʃ/', example_sentence: 'She accomplished all her goals this year.', notes: 'Regular verb, formal tone', created_by: 'u1', created_at: '2026-03-01', updated_at: '2026-03-01' },
    { id: 'v2', notebook_id: 'nb-1', word_english: 'begin', word_spanish: 'empezar', present: 'begin', past: 'began', past_participle: 'begun', pronunciation: '/bɪˈɡɪn/', example_sentence: 'Let us begin the lesson.', notes: 'Irregular verb', created_by: 'u1', created_at: '2026-03-01', updated_at: '2026-03-01' },
    { id: 'v3', notebook_id: 'nb-1', word_english: 'comprehend', word_spanish: 'comprender', present: 'comprehend', past: 'comprehended', past_participle: 'comprehended', pronunciation: '/ˌkɒm.prɪˈhend/', example_sentence: 'Do you comprehend the meaning?', notes: 'Academic register', created_by: 'u2', created_at: '2026-03-02', updated_at: '2026-03-02' },
    { id: 'v4', notebook_id: 'nb-1', word_english: 'drive', word_spanish: 'conducir', present: 'drive', past: 'drove', past_participle: 'driven', pronunciation: '/draɪv/', example_sentence: 'He drives to work every day.', notes: 'Irregular verb, multiple meanings', created_by: 'u2', created_at: '2026-03-02', updated_at: '2026-03-02' },
    { id: 'v5', notebook_id: 'nb-1', word_english: 'enhance', word_spanish: 'mejorar', present: 'enhance', past: 'enhanced', past_participle: 'enhanced', pronunciation: '/ɪnˈhæns/', example_sentence: 'Technology can enhance learning.', notes: 'Formal, improve = synonym', created_by: 'u1', created_at: '2026-03-03', updated_at: '2026-03-03' },
    { id: 'v6', notebook_id: 'nb-1', word_english: 'forgive', word_spanish: 'perdonar', present: 'forgive', past: 'forgave', past_participle: 'forgiven', pronunciation: '/fəˈɡɪv/', example_sentence: 'Please forgive my mistake.', notes: 'Irregular verb', created_by: 'u3', created_at: '2026-03-03', updated_at: '2026-03-04' },
    { id: 'v7', notebook_id: 'nb-1', word_english: 'gather', word_spanish: 'reunir', present: 'gather', past: 'gathered', past_participle: 'gathered', pronunciation: '/ˈɡæð.ər/', example_sentence: 'We gathered all the information.', notes: 'Collect = synonym', created_by: 'u1', created_at: '2026-03-04', updated_at: '2026-03-04' },
];

export default function VocabularyPage() {
    const params = useParams();
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    const filtered = mockVocab.filter(v =>
        v.word_english.toLowerCase().includes(search.toLowerCase()) ||
        (v.word_spanish && v.word_spanish.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1 className="page-title">📖 Vocabulary</h1>
                        <p className="page-desc">{mockVocab.length} words tracked across all notebooks</p>
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
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-secondary btn-sm">All</button>
                    <button className="btn btn-ghost btn-sm">Irregular</button>
                    <button className="btn btn-ghost btn-sm">Regular</button>
                </div>
            </div>

            <div className="table-container">
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
                        {filtered.map(v => (
                            <tr key={v.id}>
                                <td style={{ fontWeight: 600 }}>{v.word_english}</td>
                                <td>{v.word_spanish}</td>
                                <td><code style={{ fontSize: '12px', padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>{v.present}</code></td>
                                <td><code style={{ fontSize: '12px', padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>{v.past}</code></td>
                                <td><code style={{ fontSize: '12px', padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>{v.past_participle}</code></td>
                                <td style={{ fontStyle: 'italic', color: 'var(--text-tertiary)', fontSize: '12px' }}>{v.pronunciation}</td>
                                <td style={{ maxWidth: '200px' }}>{v.example_sentence}</td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{v.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Word Modal */}
            {showAdd && (
                <div className="overlay" onClick={() => setShowAdd(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
                        <h2 style={{ marginBottom: 'var(--space-5)', fontFamily: 'var(--font-display)' }}>Add Vocabulary Word</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            <div className="input-group">
                                <label className="input-label">English</label>
                                <input className="input-field" placeholder="e.g. run" style={{ width: '100%' }} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Spanish</label>
                                <input className="input-field" placeholder="e.g. correr" style={{ width: '100%' }} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Present</label>
                                <input className="input-field" placeholder="run" style={{ width: '100%' }} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Past</label>
                                <input className="input-field" placeholder="ran" style={{ width: '100%' }} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Past Participle</label>
                                <input className="input-field" placeholder="run" style={{ width: '100%' }} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Pronunciation</label>
                                <input className="input-field" placeholder="/rʌn/" style={{ width: '100%' }} />
                            </div>
                        </div>
                        <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
                            <label className="input-label">Example Sentence</label>
                            <input className="input-field" placeholder="She runs every morning." style={{ width: '100%' }} />
                        </div>
                        <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
                            <label className="input-label">Notes</label>
                            <input className="input-field" placeholder="Irregular verb" style={{ width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={() => setShowAdd(false)}>Add Word</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
