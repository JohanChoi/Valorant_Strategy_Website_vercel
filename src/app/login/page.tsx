'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed.');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '420px' }}>
        <h2 className="text-center mb-8" style={{ fontSize: '1.6rem' }}>
          <span className="text-red">{'//'}</span> Agent Login
        </h2>

        {error && (
          <div className="error-banner mb-4">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="agent@valorant.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="mt-4" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center mt-4 text-muted" style={{ fontSize: '0.9rem' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-red">Register</Link>
        </p>
      </div>
    </div>
  );
}
