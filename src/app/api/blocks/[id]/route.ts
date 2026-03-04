import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { requireWriteAccess, logActivity } from '@/lib/middleware';
import { errorResponse, UnauthorizedError, NotFoundError } from '@/lib/errors';

// PATCH /api/blocks/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();
        const { id } = await params;

        const existing = await sql`
      SELECT b.*, s.notebook_id, n.workspace_id FROM blocks b
      JOIN sections s ON b.section_id = s.id
      JOIN notebooks n ON s.notebook_id = n.id
      WHERE b.id = ${id}
    `;
        if (existing.length === 0) throw new NotFoundError('Block not found');

        await requireWriteAccess(req, existing[0].workspace_id);

        const { content, block_type, position } = await req.json();

        // UPDATE blocks
        const rows = await sql`
      UPDATE blocks SET
        content = COALESCE(${content ? JSON.stringify(content) : null}, content),
        block_type = COALESCE(${block_type || null}, block_type),
        position = COALESCE(${position !== undefined ? position : null}, position),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

        await logActivity({
            workspace_id: existing[0].workspace_id,
            notebook_id: existing[0].notebook_id,
            user_id: user.userId,
            entity_type: 'block',
            entity_id: id,
            action: 'UPDATE',
            old_data: { content: existing[0].content },
            new_data: { content: rows[0].content },
        });

        return Response.json(rows[0]);
    } catch (error) {
        return errorResponse(error);
    }
}

// DELETE /api/blocks/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();
        const { id } = await params;

        const existing = await sql`
      SELECT b.*, s.notebook_id, n.workspace_id FROM blocks b
      JOIN sections s ON b.section_id = s.id
      JOIN notebooks n ON s.notebook_id = n.id
      WHERE b.id = ${id}
    `;
        if (existing.length === 0) throw new NotFoundError('Block not found');

        await requireWriteAccess(req, existing[0].workspace_id);

        // DELETE FROM blocks
        await sql`DELETE FROM blocks WHERE id = ${id}`;

        await logActivity({
            workspace_id: existing[0].workspace_id,
            notebook_id: existing[0].notebook_id,
            user_id: user.userId,
            entity_type: 'block',
            entity_id: id,
            action: 'DELETE',
            old_data: { content: existing[0].content },
        });

        return Response.json({ message: 'Block deleted' });
    } catch (error) {
        return errorResponse(error);
    }
}
