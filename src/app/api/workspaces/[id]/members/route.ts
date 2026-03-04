import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { requireWorkspaceRole, requireWriteAccess, logActivity } from '@/lib/middleware';
import { errorResponse, ValidationError } from '@/lib/errors';

// GET /api/workspaces/[id]/members
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await requireWorkspaceRole(req, id);

        const rows = await sql`
      SELECT wm.*, u.name as user_name
      FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      WHERE wm.workspace_id = ${id}
      ORDER BY wm.created_at
    `;

        return Response.json(rows);
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/workspaces/[id]/members – invite member
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { user } = await requireWorkspaceRole(req, id, ['OWNER']);

        const { user_id, role } = await req.json();
        if (!user_id || !role) throw new ValidationError('user_id and role are required');
        if (!['EDITOR', 'VIEWER'].includes(role)) throw new ValidationError('Role must be EDITOR or VIEWER');

        const rows = await sql`
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES (${id}, ${user_id}, ${role})
      RETURNING *
    `;

        await logActivity({
            workspace_id: id,
            user_id: user.userId,
            entity_type: 'workspace_member',
            entity_id: rows[0].id,
            action: 'INSERT',
            new_data: { user_id, role },
        });

        return Response.json(rows[0], { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
