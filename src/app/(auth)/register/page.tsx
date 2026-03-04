'use client';
import { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import '../auth.css';

export default function RegisterPage() {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await register(name, password);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card animate-fade-in">
                <div className="auth-header">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">L</div>
                        <span className="gradient-text">Lexora</span>
                    </div>
                    <h1 className="auth-title">Create your account</h1>
                    <p className="auth-subtitle">Join Lexora and start learning together</p>
                </div>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}
                    <div className="input-group">
                        <label className="input-label" htmlFor="reg-name">Username</label>
                        <input
                            id="reg-name"
                            className="input-field"
                            type="text"
                            placeholder="Choose a username"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label" htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            className="input-field"
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label" htmlFor="reg-confirm">Confirm Password</label>
                        <input
                            id="reg-confirm"
                            className="input-field"
                            type="password"
                            placeholder="Repeat your password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                        />
                    </div>
                    <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>
                <div className="auth-footer">
                    Already have an account? <Link href="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
