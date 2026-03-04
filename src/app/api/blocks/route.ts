import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { requireWriteAccess, logActivity } from '@/lib/middleware';
import { errorResponse, UnauthorizedError, ValidationError } from '@/lib/errors';

// GET /api/blocks?section_id=xxx
export async function GET(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();

        const sectionId = req.nextUrl.searchParams.get('section_id');
        if (!sectionId) throw new ValidationError('section_id is required');

        const rows = await sql`
      SELECT * FROM blocks WHERE section_id = ${sectionId} ORDER BY position
    `;

        return Response.json(rows);
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/blocks
export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();

        const { section_id, block_type, content, position } = await req.json();
        if (!section_id || !block_type) throw new ValidationError('section_id and block_type are required');

        // Get workspace_id via section → notebook
        const sec = await sql`
      SELECT s.notebook_id, n.workspace_id FROM sections s
      JOIN notebooks n ON s.notebook_id = n.id
      WHERE s.id = ${section_id}
    `;
        if (sec.length === 0) throw new ValidationError('Section not found');

        await requireWriteAccess(req, sec[0].workspace_id);

        // INSERT INTO blocks
        const rows = await sql`
      INSERT INTO blocks (section_id, block_type, content, position, created_by)
      VALUES (${section_id}, ${block_type}, ${JSON.stringify(content || {})}, ${position || 0}, ${user.userId})
      RETURNING *
    `;

        await logActivity({
            workspace_id: sec[0].workspace_id,
            notebook_id: sec[0].notebook_id,
            user_id: user.userId,
            entity_type: 'block',
            entity_id: rows[0].id,
            action: 'INSERT',
            new_data: { block_type, content },
        });

        return Response.json(rows[0], { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
