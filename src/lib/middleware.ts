import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';
import { NextRequest } from 'next/server';
import type { MemberRole } from '@/types';

/**
 * Verify that the user has the required role in the workspace.
 * Returns the member record if authorized.
 */
export async function requireWorkspaceRole(
    req: NextRequest,
    workspaceId: string,
    allowedRoles: MemberRole[] = ['OWNER', 'EDITOR', 'VIEWER']
) {
    const user = getUserFromRequest(req);
    if (!user) throw new UnauthorizedError('Authentication required');

    const rows = await sql`
    SELECT * FROM workspace_members
    WHERE workspace_id = ${workspaceId}
      AND user_id = ${user.userId}
  `;

    if (rows.length === 0) {
        throw new ForbiddenError('You are not a member of this workspace');
    }

    const member = rows[0];
    if (!allowedRoles.includes(member.role as MemberRole)) {
        throw new ForbiddenError(`Role '${member.role}' is not authorized for this action`);
    }

    return { user, member };
}

/**
 * Require that the user is NOT a VIEWER (can write).
 */
export async function requireWriteAccess(req: NextRequest, workspaceId: string) {
    return requireWorkspaceRole(req, workspaceId, ['OWNER', 'EDITOR']);
}

/**
 * Log an activity to the activity_logs table.
 */
export async function logActivity(params: {
    workspace_id: string;
    notebook_id?: string | null;
    user_id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    old_data?: Record<string, unknown> | null;
    new_data?: Record<string, unknown> | null;
}) {
    await sql`
    INSERT INTO activity_logs (workspace_id, notebook_id, user_id, entity_type, entity_id, action, old_data, new_data)
    VALUES (
      ${params.workspace_id},
      ${params.notebook_id || null},
      ${params.user_id},
      ${params.entity_type},
      ${params.entity_id},
      ${params.action},
      ${params.old_data ? JSON.stringify(params.old_data) : null},
      ${params.new_data ? JSON.stringify(params.new_data) : null}
    )
  `;
}
