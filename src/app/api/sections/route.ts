import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { requireWriteAccess, logActivity } from '@/lib/middleware';
import { errorResponse, UnauthorizedError, ValidationError } from '@/lib/errors';

// GET /api/sections?notebook_id=xxx
export async function GET(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();

        const notebookId = req.nextUrl.searchParams.get('notebook_id');
        if (!notebookId) throw new ValidationError('notebook_id is required');

        const rows = await sql`
      SELECT * FROM sections WHERE notebook_id = ${notebookId} ORDER BY position
    `;

        return Response.json(rows);
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/sections
export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();

        const { notebook_id, title, type, position } = await req.json();
        if (!notebook_id || !type) throw new ValidationError('notebook_id and type are required');

        // Get workspace_id from notebook
        const nb = await sql`SELECT workspace_id FROM notebooks WHERE id = ${notebook_id}`;
        if (nb.length === 0) throw new ValidationError('Notebook not found');

        await requireWriteAccess(req, nb[0].workspace_id);

        // INSERT INTO sections
        const rows = await sql`
      INSERT INTO sections (notebook_id, title, type, position)
      VALUES (${notebook_id}, ${title || 'Untitled'}, ${type}, ${position || 0})
      RETURNING *
    `;

        await logActivity({
            workspace_id: nb[0].workspace_id,
            notebook_id,
            user_id: user.userId,
            entity_type: 'section',
            entity_id: rows[0].id,
            action: 'INSERT',
            new_data: { title, type },
        });

        return Response.json(rows[0], { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
