import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { errorResponse } from '@/lib/errors';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/users/search?q=...
 * Search for users by name prefix (autocomplete style)
 */
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        if (!verifyToken(token)) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return Response.json([]);
        }

        const users = await sql`
            SELECT id, name, level
            FROM users
            WHERE name ILIKE ${query + '%'}
            LIMIT 10
        `;

        return Response.json(users);
    } catch (error) {
        return errorResponse(error);
    }
}
