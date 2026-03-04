import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { errorResponse, ValidationError } from '@/lib/errors';

export async function POST(req: NextRequest) {
    try {
        const { refreshToken } = await req.json();

        if (!refreshToken) {
            throw new ValidationError('Refresh token is required');
        }

        // DELETE FROM sessions
        await sql`DELETE FROM sessions WHERE refresh_token = ${refreshToken}`;

        return Response.json({ message: 'Logged out successfully' });
    } catch (error) {
        return errorResponse(error);
    }
}
