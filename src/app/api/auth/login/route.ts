import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { comparePassword, generateToken, generateRefreshToken } from '@/lib/auth';
import { errorResponse, ValidationError, UnauthorizedError } from '@/lib/errors';

export async function POST(req: NextRequest) {
    try {
        const { name, password } = await req.json();

        if (!name || !password) {
            throw new ValidationError('Name and password are required');
        }

        // SELECT user by name
        const users = await sql`
      SELECT id, name, password_hash FROM users WHERE name = ${name}
    `;

        if (users.length === 0) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const user = users[0];

        // Verify password
        const valid = await comparePassword(password, user.password_hash);
        if (!valid) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Generate tokens
        const token = generateToken({ userId: user.id, name: user.name });
        const refreshToken = generateRefreshToken();

        const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7');
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const ua = req.headers.get('user-agent') || 'unknown';

        // INSERT INTO sessions
        await sql`
      INSERT INTO sessions (user_id, refresh_token, ip_address, user_agent, expires_at)
      VALUES (${user.id}, ${refreshToken}, ${ip}, ${ua}, ${expiresAt})
    `;

        return Response.json({
            user: { id: user.id, name: user.name },
            token,
            refreshToken,
        });
    } catch (error) {
        return errorResponse(error);
    }
}
