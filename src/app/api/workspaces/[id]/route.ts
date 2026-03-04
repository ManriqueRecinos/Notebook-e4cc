import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { requireWorkspaceRole, requireWriteAccess } from '@/lib/middleware';
import { errorResponse, UnauthorizedError, NotFoundError, ValidationError } from '@/lib/errors';

// GET /api/workspaces/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();
        const { id } = await params;

        await requireWorkspaceRole(req, id);

        const rows = await sql`SELECT * FROM workspaces WHERE id = ${id}`;
        if (rows.length === 0) throw new NotFoundError('Workspace not found');

        return Response.json(rows[0]);
    } catch (error) {
        return errorResponse(error);
    }
}

// PATCH /api/workspaces/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { user } = await requireWorkspaceRole(req, id, ['OWNER']);

        const { name } = await req.json();
        if (!name) throw new ValidationError('Name is required');

        const rows = await sql`
      UPDATE workspaces SET name = ${name} WHERE id = ${id} RETURNING *
    `;

        return Response.json(rows[0]);
    } catch (error) {
        return errorResponse(error);
    }
}

// DELETE /api/workspaces/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { user } = await requireWorkspaceRole(req, id, ['OWNER']);

        await sql`DELETE FROM workspaces WHERE id = ${id} AND owner_id = ${user.userId}`;

        return Response.json({ message: 'Workspace deleted' });
    } catch (error) {
        return errorResponse(error);
    }
}
