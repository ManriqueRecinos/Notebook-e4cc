import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { requireWorkspaceRole } from '@/lib/middleware';
import { errorResponse, UnauthorizedError, ValidationError } from '@/lib/errors';

// GET /api/activity?workspace_id=xxx&limit=20&offset=0
export async function GET(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();

        const workspaceId = req.nextUrl.searchParams.get('workspace_id');
        if (!workspaceId) throw new ValidationError('workspace_id is required');

        await requireWorkspaceRole(req, workspaceId);

        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
        const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

        const rows = await sql`
      SELECT al.*, u.name as user_name
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.workspace_id = ${workspaceId}
      ORDER BY al.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

        return Response.json(rows);
    } catch (error) {
        return errorResponse(error);
    }
}
