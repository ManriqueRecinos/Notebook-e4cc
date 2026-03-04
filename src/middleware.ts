import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedPaths = ['/dashboard', '/workspace'];

// API routes that DON'T require auth
const publicApiPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check protected pages
    const isProtectedPage = protectedPaths.some(p => pathname.startsWith(p));
    if (isProtectedPage) {
        // For pages, we check client-side (AuthContext handles redirect)
        return NextResponse.next();
    }

    // Check protected API routes
    const isApiRoute = pathname.startsWith('/api/');
    const isPublicApi = publicApiPaths.some(p => pathname === p);

    if (isApiRoute && !isPublicApi) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/workspace/:path*', '/api/:path*'],
};
