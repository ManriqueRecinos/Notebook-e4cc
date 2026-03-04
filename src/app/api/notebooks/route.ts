import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { requireWriteAccess, logActivity } from '@/lib/middleware';
import { errorResponse, UnauthorizedError, ValidationError } from '@/lib/errors';

// GET /api/notebooks?workspace_id=xxx
export async function GET(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();

        const workspaceId = req.nextUrl.searchParams.get('workspace_id');
        if (!workspaceId) throw new ValidationError('workspace_id is required');

        const rows = await sql`
      SELECT n.*, u.name as creator_name
      FROM notebooks n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.workspace_id = ${workspaceId}
      ORDER BY n.updated_at DESC
    `;

        return Response.json(rows);
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/notebooks
export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();

        const { workspace_id, title, description } = await req.json();
        if (!workspace_id || !title) throw new ValidationError('workspace_id and title are required');

        await requireWriteAccess(req, workspace_id);

        // INSERT INTO notebooks
        const rows = await sql`
      INSERT INTO notebooks (workspace_id, title, description, created_by)
      VALUES (${workspace_id}, ${title}, ${description || null}, ${user.userId})
      RETURNING *
    `;

        await logActivity({
            workspace_id,
            notebook_id: rows[0].id,
            user_id: user.userId,
            entity_type: 'notebook',
            entity_id: rows[0].id,
            action: 'INSERT',
            new_data: { title, description },
        });

        return Response.json(rows[0], { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
