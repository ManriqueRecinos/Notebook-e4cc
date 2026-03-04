import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { errorResponse } from '@/lib/errors';

export async function POST(req: NextRequest) {
    try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'BASIC 0'`;
        await sql`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'BASIC 0'`;
        return Response.json({ success: true, message: 'Schema updated: users.level and workspaces.level added.' });
    } catch (error) {
        return errorResponse(error);
    }
}
