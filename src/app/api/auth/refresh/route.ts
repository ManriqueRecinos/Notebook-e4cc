import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { generateToken } from '@/lib/auth';
import { errorResponse, ValidationError, UnauthorizedError } from '@/lib/errors';

export async function POST(req: NextRequest) {
    try {
        const { refreshToken } = await req.json();

        if (!refreshToken) {
            throw new ValidationError('Refresh token is required');
        }

        // Verify refresh token exists and is not expired
        const sessions = await sql`
      SELECT s.*, u.name FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.refresh_token = ${refreshToken}
        AND s.expires_at > NOW()
    `;

        if (sessions.length === 0) {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }

        const session = sessions[0];

        // Generate new access token
        const token = generateToken({ userId: session.user_id, name: session.name });

        return Response.json({
            token,
            user: { id: session.user_id, name: session.name },
        });
    } catch (error) {
        return errorResponse(error);
    }
}
