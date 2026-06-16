'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface User {
  userId: string;
  username: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);

  const fetchUser = useCallback(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser, pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="navbar">
      <div className="container flex justify-between items-center">
        <Link href="/" className="logo">
          <h1 className="text-red" style={{ margin: 0 }}>ValoStrat</h1>
        </Link>
        <div className="nav-links flex gap-4 items-center">
          <Link href="/">Maps</Link>
          
          <div
            className="relative"
            onMouseEnter={() => setCameraDropdownOpen(true)}
            onMouseLeave={() => setCameraDropdownOpen(false)}
          >
            <button
              className="nav-dropdown-trigger"
              onClick={() => setCameraDropdownOpen(!cameraDropdownOpen)}
            >
              Camera
              <span style={{ fontSize: '0.7rem', transition: 'transform 0.2s', transform: cameraDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', display: 'inline-block', marginLeft: '4px' }}>▼</span>
            </button>
            {cameraDropdownOpen && (
              <div className="navbar-dropdown">
                <Link href="/camera" onClick={() => setCameraDropdownOpen(false)}>
                  <span>Live Camera</span>
                  <span className="feed-status-dot live"></span>
                </Link>
              </div>
            )}
          </div>

          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/upload" className="btn" style={{ padding: '8px 18px', fontSize: '0.95rem' }}>
                    Upload
                  </Link>
                  <span className="text-muted" style={{ fontSize: '0.9rem', fontFamily: 'var(--font-body)' }}>
                    {user.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="secondary"
                    style={{ padding: '8px 18px', fontSize: '0.95rem' }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login">Login</Link>
                  <Link href="/register" className="btn" style={{ padding: '8px 18px', fontSize: '0.95rem' }}>
                    Register
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
