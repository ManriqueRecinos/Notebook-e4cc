import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { requireWriteAccess, logActivity } from '@/lib/middleware';
import { errorResponse, UnauthorizedError, NotFoundError } from '@/lib/errors';

// PATCH /api/sections/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();
        const { id } = await params;

        const existing = await sql`
      SELECT s.*, n.workspace_id FROM sections s
      JOIN notebooks n ON s.notebook_id = n.id
      WHERE s.id = ${id}
    `;
        if (existing.length === 0) throw new NotFoundError('Section not found');

        await requireWriteAccess(req, existing[0].workspace_id);

        const { title, position } = await req.json();

        const rows = await sql`
      UPDATE sections SET
        title = COALESCE(${title || null}, title),
        position = COALESCE(${position !== undefined ? position : null}, position)
      WHERE id = ${id}
      RETURNING *
    `;

        return Response.json(rows[0]);
    } catch (error) {
        return errorResponse(error);
    }
}

// DELETE /api/sections/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();
        const { id } = await params;

        const existing = await sql`
      SELECT s.*, n.workspace_id FROM sections s
      JOIN notebooks n ON s.notebook_id = n.id
      WHERE s.id = ${id}
    `;
        if (existing.length === 0) throw new NotFoundError('Section not found');

        await requireWriteAccess(req, existing[0].workspace_id);

        await sql`DELETE FROM sections WHERE id = ${id}`;

        await logActivity({
            workspace_id: existing[0].workspace_id,
            notebook_id: existing[0].notebook_id,
            user_id: user.userId,
            entity_type: 'section',
            entity_id: id,
            action: 'DELETE',
            old_data: { title: existing[0].title },
        });

        return Response.json({ message: 'Section deleted' });
    } catch (error) {
        return errorResponse(error);
    }
}
