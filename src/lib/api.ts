/**
 * Authenticated API client for Lexora
 * Automatically attaches JWT token from localStorage
 */

type FetchOptions = {
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
};

export async function api<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { method = 'GET', body, params } = options;

    let url = endpoint;
    if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('lexora-token') : null;
    if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        if (res.status === 401 && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('lexora-unauthorized'));
        }
        throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
}

export const apiGet = <T = unknown>(endpoint: string, params?: Record<string, string>) =>
    api<T>(endpoint, { params });

export const apiPost = <T = unknown>(endpoint: string, body: unknown) =>
    api<T>(endpoint, { method: 'POST', body });

export const apiPatch = <T = unknown>(endpoint: string, body: unknown) =>
    api<T>(endpoint, { method: 'PATCH', body });

export const apiDelete = <T = unknown>(endpoint: string) =>
    api<T>(endpoint, { method: 'DELETE' });
