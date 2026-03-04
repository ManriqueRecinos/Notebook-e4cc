import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { requireWriteAccess, logActivity } from '@/lib/middleware';
import { errorResponse, UnauthorizedError, NotFoundError, ValidationError } from '@/lib/errors';

// GET /api/notebooks/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();
        const { id } = await params;

        const rows = await sql`
      SELECT n.*, u.name as creator_name
      FROM notebooks n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.id = ${id}
    `;
        if (rows.length === 0) throw new NotFoundError('Notebook not found');

        return Response.json(rows[0]);
    } catch (error) {
        return errorResponse(error);
    }
}

// PATCH /api/notebooks/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();
        const { id } = await params;

        // Get notebook to find workspace
        const existing = await sql`SELECT * FROM notebooks WHERE id = ${id}`;
        if (existing.length === 0) throw new NotFoundError('Notebook not found');

        await requireWriteAccess(req, existing[0].workspace_id);

        const { title, description } = await req.json();

        // UPDATE notebooks
        const rows = await sql`
      UPDATE notebooks SET
        title = COALESCE(${title || null}, title),
        description = COALESCE(${description !== undefined ? description : null}, description),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

        await logActivity({
            workspace_id: existing[0].workspace_id,
            notebook_id: id,
            user_id: user.userId,
            entity_type: 'notebook',
            entity_id: id,
            action: 'UPDATE',
            old_data: { title: existing[0].title },
            new_data: { title: rows[0].title },
        });

        return Response.json(rows[0]);
    } catch (error) {
        return errorResponse(error);
    }
}

// DELETE /api/notebooks/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();
        const { id } = await params;

        const existing = await sql`SELECT * FROM notebooks WHERE id = ${id}`;
        if (existing.length === 0) throw new NotFoundError('Notebook not found');

        await requireWriteAccess(req, existing[0].workspace_id);

        // DELETE FROM notebooks
        await sql`DELETE FROM notebooks WHERE id = ${id}`;

        await logActivity({
            workspace_id: existing[0].workspace_id,
            notebook_id: id,
            user_id: user.userId,
            entity_type: 'notebook',
            entity_id: id,
            action: 'DELETE',
            old_data: { title: existing[0].title },
        });

        return Response.json({ message: 'Notebook deleted' });
    } catch (error) {
        return errorResponse(error);
    }
}
