'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
    id: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (name: string, password: string) => Promise<void>;
    register: (name: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('lexora-token');
        const storedUser = localStorage.getItem('lexora-user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (name: string, password: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Login failed');
            }
            const data = await res.json();
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('lexora-token', data.token);
            localStorage.setItem('lexora-user', JSON.stringify(data.user));
            if (data.refreshToken) {
                localStorage.setItem('lexora-refresh-token', data.refreshToken);
            }
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const register = async (name: string, password: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Registration failed');
            }
            const data = await res.json();
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('lexora-token', data.token);
            localStorage.setItem('lexora-user', JSON.stringify(data.user));
            if (data.refreshToken) {
                localStorage.setItem('lexora-refresh-token', data.refreshToken);
            }
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        const refreshToken = localStorage.getItem('lexora-refresh-token');
        if (refreshToken) {
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            }).catch(() => { });
        }
        setToken(null);
        setUser(null);
        localStorage.removeItem('lexora-token');
        localStorage.removeItem('lexora-user');
        localStorage.removeItem('lexora-refresh-token');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
