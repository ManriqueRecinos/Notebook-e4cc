import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

export interface JwtPayload {
    userId: string;
    name: string;
}

export function generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

export function verifyToken(token: string): JwtPayload | null {
    if (!JWT_SECRET || JWT_SECRET === 'fallback-secret') {
        console.warn('[Auth] Warning: Using fallback JWT secret. Check environment variables.');
    }

    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            console.error('[Auth] Token expired at:', err.expiredAt);
        } else if (err.name === 'JsonWebTokenError') {
            console.error('[Auth] Invalid token signature/format:', err.message);
        } else {
            console.error('[Auth] JWT Verification failed:', err.message);
        }
        return null;
    }
}

export function generateRefreshToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function getTokenFromRequest(req: NextRequest): string | null {
    const auth = req.headers.get('Authorization');
    if (auth && auth.startsWith('Bearer ')) {
        return auth.slice(7);
    }
    return null;
}

export function getUserFromRequest(req: NextRequest): JwtPayload | null {
    const token = getTokenFromRequest(req);
    if (!token) return null;
    return verifyToken(token);
}
