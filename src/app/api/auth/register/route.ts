import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { hashPassword, generateToken, generateRefreshToken } from '@/lib/auth';
import { errorResponse, ValidationError } from '@/lib/errors';

export async function POST(req: NextRequest) {
    try {
        const { name, password } = await req.json();

        if (!name || !password) {
            throw new ValidationError('Name and password are required');
        }
        if (password.length < 6) {
            throw new ValidationError('Password must be at least 6 characters');
        }

        // Check if user exists
        const existing = await sql`SELECT id FROM users WHERE name = ${name}`;
        if (existing.length > 0) {
            throw new ValidationError('Username already taken');
        }

        // Hash password
        const password_hash = await hashPassword(password);

        // INSERT INTO users
        const users = await sql`
      INSERT INTO users (name, password_hash)
      VALUES (${name}, ${password_hash})
      RETURNING id, name, created_at
    `;
        const user = users[0];

        // Generate tokens
        const token = generateToken({ userId: user.id, name: user.name });
        const refreshToken = generateRefreshToken();

        // Calculate expiry
        const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7');
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

        // INSERT INTO sessions
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const ua = req.headers.get('user-agent') || 'unknown';

        await sql`
      INSERT INTO sessions (user_id, refresh_token, ip_address, user_agent, expires_at)
      VALUES (${user.id}, ${refreshToken}, ${ip}, ${ua}, ${expiresAt})
    `;

        return Response.json({
            user: { id: user.id, name: user.name },
            token,
            refreshToken,
        }, { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
