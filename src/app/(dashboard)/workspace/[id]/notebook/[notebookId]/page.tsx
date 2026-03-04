'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/lib/socket';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type { Notebook, Section, Block, MemberRole } from '@/types';

type EditorMode = 'word' | 'canva' | 'cms';

export default function VisualBuilderPage() {
    const params = useParams();
    const { user } = useAuth();
    const notebookId = params.notebookId as string;
    const workspaceId = params.id as string;

    const [notebook, setNotebook] = useState<Notebook | null>(null);
    const [sections, setSections] = useState<(Section & { blocks: Block[] })[]>([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<EditorMode>('word');
    const [isPreview, setIsPreview] = useState(false);
    const [userRole, setUserRole] = useState<MemberRole>('VIEWER');
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [presence, setPresence] = useState<any[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [showSlashMenu, setShowSlashMenu] = useState<{ x: number, y: number, sectionId: string, position: number } | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Canvas Settings
    const [theme, setTheme] = useState({
        primaryColor: '#6c5ce7',
        fontFamily: 'Inter, sans-serif',
        layoutWidth: '816px'
    });

    // Socket Integration
    const { emitContentUpdate } = useSocket({
        notebookId,
        userId: user?.id || 'guest',
        userName: user?.name || 'Guest',
        onContentUpdated: (data) => {
            setSections(prev => prev.map(sec => ({
                ...sec,
                blocks: sec.blocks.map(b => b.id === data.blockId ? { ...b, content: { ...b.content, ...data.content } } : b)
            })));
        },
        onPresenceUpdate: (data) => setPresence(data.users),
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [nb, secs, mms] = await Promise.all([
                apiGet<Notebook>(`/api/notebooks/${notebookId}`),
                apiGet<Section[]>(`/api/sections`, { notebook_id: notebookId }),
                apiGet<any[]>(`/api/workspaces/${workspaceId}/members`)
            ]);

            const myMember = mms.find(m => m.user_id === user?.id);
            if (myMember) setUserRole(myMember.role);

            const sectionsWithBlocks = await Promise.all(secs.map(async (s) => {
                const blocks = await apiGet<Block[]>(`/api/blocks`, { section_id: s.id });
                return { ...s, blocks: blocks.sort((a, b) => a.position - b.position) };
            }));

            setNotebook(nb);
            setSections(sectionsWithBlocks);
        } catch (err) {
            console.error('Failed to load visual builder:', err);
        } finally {
            setLoading(false);
        }
    }, [notebookId, workspaceId, user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateBlock = async (blockId: string, updates: any) => {
        if (isPreview || userRole === 'VIEWER') return;

        setSections(prev => prev.map(sec => ({
            ...sec,
            blocks: sec.blocks.map(b => b.id === blockId ? { ...b, content: { ...b.content, ...updates } } : b)
        })));

        emitContentUpdate(blockId, updates);
        await apiPatch(`/api/blocks/${blockId}`, { content: updates });
    };

    const handleAddBlock = async (sectionId: string | undefined, type: string, position: number, extraContent = {}) => {
        if (isPreview) return;

        let targetSectionId = sectionId;

        // If no section provided or sections array is empty, create a default section
        if (!targetSectionId || !sections.length) {
            try {
                const newSec = await apiPost<Section>('/api/sections', { notebook_id: notebookId, title: 'Main Section', position: 0 });
                targetSectionId = newSec.id;
                // Add the section locally so blocks can be added to it
                setSections([{ ...newSec, blocks: [] }]);
            } catch (err) {
                console.error('Failed to create initial section:', err);
                return;
            }
        }

        try {
            const newBlock = await apiPost<Block>('/api/blocks', {
                section_id: targetSectionId,
                block_type: type,
                content: { text: type === 'text' ? 'New block...' : '', ...extraContent },
                position
            });

            setSections(prev => prev.map(s => s.id === targetSectionId ? {
                ...s,
                blocks: [...s.blocks, newBlock].sort((a, b) => a.position - b.position)
            } : s));

            setActiveBlockId(newBlock.id);
            setShowSlashMenu(null);
        } catch (err) {
            console.error('Failed to add block:', err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string | undefined, position: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/assets/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            const type = file.type.startsWith('audio') ? 'audio' : 'image';
            await handleAddBlock(sectionId, type, position, { url: data.url });
        } catch (err) {
            console.error('Upload failed:', err);
        }
    };

    const handleDragStart = (e: React.MouseEvent, blockId: string) => {
        if (mode !== 'canva' || isPreview) return;
        setIsDragging(true);
        setActiveBlockId(blockId);
        e.preventDefault();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !activeBlockId || mode !== 'canva' || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - 50;
        const y = e.clientY - rect.top - 20;

        setSections(prev => prev.map(sec => ({
            ...sec,
            blocks: sec.blocks.map(b => b.id === activeBlockId ? {
                ...b,
                content: { ...b.content, style: { ...b.content.style, x, y } }
            } : b) as Block[]
        })));

        emitContentUpdate(activeBlockId, { style: { x, y } });
    };

    const handleMouseUp = () => {
        if (isDragging && activeBlockId) {
            const block = sections.flatMap(s => s.blocks).find(b => b.id === activeBlockId);
            if (block) handleUpdateBlock(activeBlockId, block.content);
        }
        setIsDragging(false);
    };

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };

    if (loading) return <div className="loading-screen">Loading Visual Builder...</div>;

    const canEdit = (userRole === 'OWNER' || userRole === 'EDITOR') && !isPreview;

    return (
        <div className={`visual-builder-root vb-mode-${mode}`} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            {/* Left Panel: Library */}
            {!isPreview && (
                <aside className="vb-panel">
                    <div className="vb-panel-header">Components</div>
                    <div className="vb-panel-content">
                        <div className="sidebar-section-title">Basics</div>
                        <div className="stagger-children">
                            <button className="sidebar-item" onClick={() => handleAddBlock(sections[0]?.id, 'text', sections[0]?.blocks.length || 0)}>📝 Text Box</button>
                            <button className="sidebar-item" onClick={() => handleAddBlock(sections[0]?.id, 'image', sections[0]?.blocks.length || 0)}>🖼️ Image</button>
                        </div>
                        <div className="sidebar-section-title" style={{ marginTop: 20 }}>Media</div>
                        <div className="stagger-children">
                            <label className="sidebar-item" style={{ cursor: 'pointer' }}>
                                🎵 Upload Sound
                                <input type="file" accept="audio/*" hidden onChange={(e) => handleFileUpload(e, sections[0]?.id, sections[0]?.blocks.length || 0)} />
                            </label>
                            <label className="sidebar-item" style={{ cursor: 'pointer' }}>
                                ✨ Upload Sticker
                                <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, sections[0]?.id, sections[0]?.blocks.length || 0)} />
                            </label>
                        </div>
                        <div className="sidebar-section-title" style={{ marginTop: 20 }}>Emoji</div>
                        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                            {['⭐', '🔥', '💡', '✅', '🚀', '🎨', '📚', '💎'].map(emoji => (
                                <button key={emoji} className="sidebar-item" style={{ textAlign: 'center' }} onClick={() => handleAddBlock(sections[0]?.id, 'text', sections[0]?.blocks.length || 0, { text: emoji })}>{emoji}</button>
                            ))}
                        </div>
                    </div>
                </aside>
            )}

            {/* Center: Canvas Area */}
            <main className="vb-canvas-wrapper">
                {/* Empty State */}
                {sections.length === 0 && !loading && canEdit && (
                    <div className="vb-empty-canvas" onClick={() => handleAddBlock(undefined, 'text', 0)}>
                        <div className="pulse-icon">✨</div>
                        <h3>Your notebook is empty</h3>
                        <p>Click here or use the sidebar to start creating</p>
                    </div>
                )}
                {/* Floating Toolbar (Word Mode) */}
                {mode === 'word' && canEdit && activeBlockId && (
                    <div className="vb-toolbar-floating" style={{ top: '140px' }}>
                        <button className="toolbar-btn" onClick={() => execCommand('bold')}><b>B</b></button>
                        <button className="toolbar-btn" onClick={() => execCommand('italic')}><i>I</i></button>
                        <button className="toolbar-btn" onClick={() => execCommand('underline')}><u>U</u></button>
                        <div className="separator" />
                        <button className="toolbar-btn" onClick={() => {
                            const url = prompt('Enter URL:');
                            if (url) execCommand('createLink', url);
                        }}>🔗</button>
                        <button className="toolbar-btn" onClick={() => execCommand('removeFormat')}>❌</button>
                    </div>
                )}

                <div className="vb-toolbar-floating" style={{ position: 'fixed', top: '80px', zIndex: 100 }}>
                    <button className={`btn btn-sm ${mode === 'word' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('word')}>Document</button>
                    <button className={`btn btn-sm ${mode === 'canva' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('canva')}>Design</button>
                    <button className={`btn btn-sm ${mode === 'cms' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('cms')}>CMS</button>
                    <div className="separator" style={{ width: '1px', background: 'var(--border)', margin: '0 8px' }} />
                    <button className="btn btn-sm btn-secondary" onClick={() => setIsPreview(!isPreview)}>
                        {isPreview ? '✏️ Edit' : '👁️ Preview'}
                    </button>
                </div>

                <div
                    ref={canvasRef}
                    className="vb-page-canvas"
                    style={{ width: theme.layoutWidth, fontFamily: theme.fontFamily }}
                >
                    {sections.map(section => (
                        <div key={section.id} className={`vb-section ${mode === 'cms' ? 'cms-layout' : ''}`}>
                            {section.blocks.map((block, idx) => (
                                <div key={block.id}>
                                    {/* Plus Button Before */}
                                    {canEdit && mode === 'word' && (
                                        <div className="vb-plus-target" onClick={(e) => setShowSlashMenu({ x: e.clientX, y: e.clientY, sectionId: section.id, position: idx })}>
                                            <div className="vb-plus-btn">+</div>
                                        </div>
                                    )}

                                    <div
                                        className={`vb-block ${activeBlockId === block.id ? 'active' : ''}`}
                                        style={mode === 'canva' ? {
                                            position: 'absolute',
                                            left: block.content.style?.x || 0,
                                            top: block.content.style?.y || 0,
                                            width: block.content.style?.w || '200px',
                                            zIndex: block.content.style?.z || 1,
                                            transform: `rotate(${block.content.style?.rotate || 0}deg)`
                                        } : {}}
                                        onClick={(e) => { e.stopPropagation(); setActiveBlockId(block.id); }}
                                        onMouseDown={(e) => handleDragStart(e, block.id)}
                                    >
                                        {canEdit && mode === 'canva' && <div className="vb-block-handle">⠿</div>}

                                        {block.block_type === 'text' && (
                                            <div
                                                contentEditable={canEdit}
                                                className="block-text-content"
                                                onBlur={(e) => handleUpdateBlock(block.id, { text: e.currentTarget.innerHTML })}
                                                onKeyDown={(e) => {
                                                    if (e.key === '/') {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setShowSlashMenu({ x: rect.left, y: rect.bottom, sectionId: section.id, position: idx + 1 });
                                                    }
                                                }}
                                                style={{ color: block.content.theme?.color || 'inherit', minHeight: '1em' }}
                                                dangerouslySetInnerHTML={{ __html: block.content.text || '' }}
                                            />
                                        )}
                                        {block.block_type === 'image' && (
                                            <img src={block.content.url || '/placeholder.png'} className="vb-image" alt="Visual" draggable={false} />
                                        )}
                                        {block.block_type === 'audio' && (
                                            <div className="vb-audio-block">
                                                <audio src={block.content.url} controls style={{ width: '100%' }} />
                                            </div>
                                        )}

                                        {mode === 'canva' && canEdit && (
                                            <div className="vb-resizer" style={{ bottom: -4, right: -4 }} />
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Final Plus Button */}
                            {canEdit && mode === 'word' && (
                                <div className="vb-plus-target" onClick={(e) => setShowSlashMenu({ x: e.clientX, y: e.clientY, sectionId: section.id, position: section.blocks.length })}>
                                    <div className="vb-plus-btn">+</div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Slash Menu */}
                    {showSlashMenu && (
                        <div className="vb-slash-menu" style={{ position: 'fixed', left: showSlashMenu.x, top: showSlashMenu.y, zIndex: 1000 }}>
                            <div className="slash-menu-item" onClick={() => handleAddBlock(showSlashMenu.sectionId, 'text', showSlashMenu.position)}>📝 Text</div>
                            <div className="slash-menu-item" onClick={() => handleAddBlock(showSlashMenu.sectionId, 'image', showSlashMenu.position)}>🖼️ Image</div>
                            <div className="slash-menu-item" onClick={() => handleAddBlock(showSlashMenu.sectionId, 'shape', showSlashMenu.position)}>🟦 Shape</div>
                            <div className="slash-menu-close" onClick={() => setShowSlashMenu(null)}>Close</div>
                        </div>
                    )}

                    {/* Multiplayer Cursors */}
                    {presence.filter(p => p.userId !== user?.id).map(p => (
                        <div key={p.userId} className="vb-cursor" style={{ left: p.x || 0, top: p.y || 0 }}>
                            <div className="vb-cursor-pointer" />
                            <div className="vb-cursor-label">{p.name}</div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Right Panel: Properties */}
            {!isPreview && (
                <aside className="vb-panel vb-panel-right">
                    <div className="vb-panel-header">Properties</div>
                    <div className="vb-panel-content">
                        {activeBlockId ? (
                            <div className="stagger-children">
                                <div className="sidebar-section-title">Styling</div>
                                <div className="prop-group">
                                    <label>Text Color</label>
                                    <input type="color" value={sections.flatMap(s => s.blocks).find(b => b.id === activeBlockId)?.content.theme?.color || '#000000'}
                                        onChange={(e) => handleUpdateBlock(activeBlockId, { theme: { ...sections.flatMap(s => s.blocks).find(b => b.id === activeBlockId)?.content.theme, color: e.target.value } })} />
                                </div>
                                <div className="prop-group">
                                    <label>Background</label>
                                    <input type="color" value={sections.flatMap(s => s.blocks).find(b => b.id === activeBlockId)?.content.theme?.bgColor || '#ffffff'}
                                        onChange={(e) => handleUpdateBlock(activeBlockId, { theme: { ...sections.flatMap(s => s.blocks).find(b => b.id === activeBlockId)?.content.theme, bgColor: e.target.value } })} />
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state">Select a block to edit properties</div>
                        )}
                    </div>
                </aside>
            )}
        </div>
    );
}
