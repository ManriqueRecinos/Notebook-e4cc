/* ============================
   Lexora – Type Definitions
   Matches database schema exactly
   ============================ */

export interface User {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface Session {
    id: string;
    user_id: string;
    refresh_token: string;
    ip_address: string;
    user_agent: string;
    expires_at: string;
    created_at: string;
}

export interface Workspace {
    id: string;
    name: string;
    owner_id: string;
    created_at: string;
}

export type MemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface WorkspaceMember {
    id: string;
    workspace_id: string;
    user_id: string;
    role: MemberRole;
    created_at: string;
    user_name?: string;
}

export interface Notebook {
    id: string;
    workspace_id: string;
    title: string;
    description: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    creator_name?: string;
}

export type SectionType = 'notes' | 'vocabulary' | 'ideas' | 'images';

export interface Section {
    id: string;
    notebook_id: string;
    title: string;
    type: SectionType;
    position: number;
    created_at: string;
}

export type BlockType = 'text' | 'heading' | 'checklist' | 'image' | 'sticker';

export interface Block {
    id: string;
    section_id: string;
    block_type: BlockType;
    content: Record<string, unknown>;
    position: number;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface Vocabulary {
    id: string;
    notebook_id: string;
    word_english: string;
    word_spanish: string | null;
    present: string | null;
    past: string | null;
    past_participle: string | null;
    pronunciation: string | null;
    example_sentence: string | null;
    notes: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface ActivityLog {
    id: string;
    workspace_id: string;
    notebook_id: string | null;
    user_id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    old_data: Record<string, unknown> | null;
    new_data: Record<string, unknown> | null;
    created_at: string;
    user_name?: string;
}

export interface Subscription {
    id: string;
    workspace_id: string;
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE';
    current_period_end: string | null;
    created_at: string;
}
