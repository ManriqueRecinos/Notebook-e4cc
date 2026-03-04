import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { errorResponse, UnauthorizedError, ValidationError } from '@/lib/errors';

// GET /api/workspaces – list user's workspaces
export async function GET(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();

        const rows = await sql`
      SELECT w.*, wm.role,
        (SELECT COUNT(*)::int FROM notebooks WHERE workspace_id = w.id) as notebooks_count,
        (SELECT COUNT(*)::int FROM workspace_members WHERE workspace_id = w.id) as members_count
      FROM workspaces w
      JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = ${user.userId}
      ORDER BY w.created_at DESC
    `;

        return Response.json(rows);
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/workspaces – create a workspace
export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();

        const { name } = await req.json();
        if (!name) throw new ValidationError('Workspace name is required');

        // INSERT INTO workspaces
        const workspaces = await sql`
      INSERT INTO workspaces (name, owner_id)
      VALUES (${name}, ${user.userId})
      RETURNING *
    `;
        const workspace = workspaces[0];

        // INSERT OWNER into workspace_members
        await sql`
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES (${workspace.id}, ${user.userId}, 'OWNER')
    `;

        // INSERT subscription (FREE by default)
        await sql`
      INSERT INTO subscriptions (workspace_id, plan, status)
      VALUES (${workspace.id}, 'FREE', 'ACTIVE')
    `;

        return Response.json(workspace, { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
