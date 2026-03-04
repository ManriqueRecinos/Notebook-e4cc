'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import type { Section, Block } from '@/types';

const mockSections: (Section & { blocks: Block[] })[] = [
    {
        id: 's1', notebook_id: 'nb-1', title: 'Introduction', type: 'notes', position: 0,
        created_at: '2026-03-01T10:00:00Z',
        blocks: [
            { id: 'b1', section_id: 's1', block_type: 'heading', content: { text: 'Welcome to Grammar Fundamentals' }, position: 0, created_by: 'u1', created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z' },
            { id: 'b2', section_id: 's1', block_type: 'text', content: { text: 'This notebook covers the essential grammar rules for intermediate English learners. Each section focuses on a specific topic with examples and practice exercises.' }, position: 1, created_by: 'u1', created_at: '2026-03-01T10:05:00Z', updated_at: '2026-03-01T10:05:00Z' },
            { id: 'b3', section_id: 's1', block_type: 'checklist', content: { text: 'Review basic tenses', checked: true }, position: 2, created_by: 'u1', created_at: '2026-03-01T10:10:00Z', updated_at: '2026-03-04T12:00:00Z' },
            { id: 'b4', section_id: 's1', block_type: 'checklist', content: { text: 'Practice conditional sentences', checked: false }, position: 3, created_by: 'u1', created_at: '2026-03-01T10:15:00Z', updated_at: '2026-03-01T10:15:00Z' },
            { id: 'b5', section_id: 's1', block_type: 'checklist', content: { text: 'Study passive voice', checked: false }, position: 4, created_by: 'u1', created_at: '2026-03-01T10:20:00Z', updated_at: '2026-03-01T10:20:00Z' },
        ],
    },
    {
        id: 's2', notebook_id: 'nb-1', title: 'Key Concepts', type: 'ideas', position: 1,
        created_at: '2026-03-01T11:00:00Z',
        blocks: [
            { id: 'b6', section_id: 's2', block_type: 'heading', content: { text: 'Present Perfect vs Past Simple' }, position: 0, created_by: 'u2', created_at: '2026-03-02T09:00:00Z', updated_at: '2026-03-02T09:00:00Z' },
            { id: 'b7', section_id: 's2', block_type: 'text', content: { text: 'The present perfect is used when the time of an action is not specified or is connected to the present. The past simple is used for completed actions at a specific time in the past.' }, position: 1, created_by: 'u2', created_at: '2026-03-02T09:05:00Z', updated_at: '2026-03-02T09:05:00Z' },
            { id: 'b8', section_id: 's2', block_type: 'text', content: { text: 'Examples:\n• I have visited Paris. (unspecified time)\n• I visited Paris last summer. (specific time)' }, position: 2, created_by: 'u2', created_at: '2026-03-02T09:10:00Z', updated_at: '2026-03-02T09:10:00Z' },
        ],
    },
];

const sectionIcons: Record<string, string> = {
    notes: '📝',
    vocabulary: '📖',
    ideas: '💡',
    images: '🖼️',
};

export default function NotebookPage() {
    const params = useParams();
    const [sections, setSections] = useState(mockSections);
    const [notebookTitle, setNotebookTitle] = useState('Grammar Fundamentals');

    const toggleCheck = (sectionIdx: number, blockIdx: number) => {
        const updated = [...sections];
        const block = updated[sectionIdx].blocks[blockIdx];
        block.content = { ...block.content, checked: !block.content.checked };
        setSections(updated);
    };

    const updateBlockText = (sectionIdx: number, blockIdx: number, text: string) => {
        const updated = [...sections];
        updated[sectionIdx].blocks[blockIdx].content = {
            ...updated[sectionIdx].blocks[blockIdx].content,
            text,
        };
        setSections(updated);
    };

    return (
        <div className="notebook-editor">
            <div className="page-header">
                <input
                    className="page-title"
                    value={notebookTitle}
                    onChange={e => setNotebookTitle(e.target.value)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        fontFamily: 'var(--font-display)',
                        fontSize: '28px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        width: '100%',
                    }}
                />
                <p className="page-desc">Last edited 2 hours ago · 3 collaborators</p>
            </div>

            {sections.map((section, sIdx) => (
                <div key={section.id} className="section-group">
                    <div className="section-header-row">
                        <div className="section-type-icon">{sectionIcons[section.type] || '📄'}</div>
                        <input
                            className="section-title-input"
                            value={section.title}
                            onChange={e => {
                                const updated = [...sections];
                                updated[sIdx].title = e.target.value;
                                setSections(updated);
                            }}
                            placeholder="Section title..."
                        />
                        <span className="badge badge-free" style={{ fontSize: '10px' }}>{section.type.toUpperCase()}</span>
                    </div>

                    <div className="block-list">
                        {section.blocks.map((block, bIdx) => (
                            <div key={block.id} className="block-item">
                                <div className="block-handle">⋮⋮</div>

                                {block.block_type === 'checklist' ? (
                                    <div className="block-content checklist">
                                        <div
                                            className={`block-checkbox ${block.content.checked ? 'checked' : ''}`}
                                            onClick={() => toggleCheck(sIdx, bIdx)}
                                        >
                                            {block.content.checked ? '✓' : ''}
                                        </div>
                                        <span
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={e => updateBlockText(sIdx, bIdx, e.currentTarget.textContent || '')}
                                            style={{
                                                textDecoration: block.content.checked ? 'line-through' : 'none',
                                                color: block.content.checked ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                                flex: 1,
                                                fontSize: '14px',
                                                lineHeight: 1.7,
                                                outline: 'none',
                                            }}
                                        >
                                            {block.content.text as string}
                                        </span>
                                    </div>
                                ) : (
                                    <div
                                        className={`block-content ${block.block_type}`}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={e => updateBlockText(sIdx, bIdx, e.currentTarget.textContent || '')}
                                        style={{ whiteSpace: 'pre-wrap' }}
                                    >
                                        {block.content.text as string}
                                    </div>
                                )}

                                <div className="block-toolbar">
                                    <button className="btn btn-ghost btn-icon btn-sm" title="Delete block" style={{ fontSize: '12px', width: '24px', height: '24px' }}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="add-block-btn">
                        <span style={{ fontSize: '16px' }}>+</span> Add block
                    </button>
                </div>
            ))}

            <button className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
                + Add Section
            </button>
        </div>
    );
}
