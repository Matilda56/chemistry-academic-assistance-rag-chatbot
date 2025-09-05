'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// from app/admin-login -> ../../lib/withBase
import { withBase } from '/workspace/rag-bot/ui/app/lib/withBase.ts';

export default function AdminLogin() {
  const router = useRouter();

  // form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // gate render until we decide whether to redirect
  const [ready, setReady] = useState(false);

  // If already logged in, go straight to dashboard
  useEffect(() => {
    const authed =
      typeof window !== 'undefined' && localStorage.getItem('adminLoggedIn') === 'true';
    if (authed) {
      router.replace(withBase('/admin-dashboard'));
    } else {
      setReady(true);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      const u = username.trim();
      const p = password.trim();

      // demo credentials
      if (u === '1234' && p === '4321') {
        localStorage.setItem('adminLoggedIn', 'true');
        await router.replace(withBase('/admin-dashboard'));
      } else {
        setError('Incorrect username or password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-300 flex items-center justify-center p-4">
        <div className="text-white text-xl">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-300 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-admin-line text-3xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Login</h1>
          <p className="text-gray-600 mt-2">Please enter admin credentials</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              placeholder="Enter username"
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                <i className={showPwd ? 'ri-eye-off-line' : 'ri-eye-line'} />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-300 disabled:to-gray-400 text-white py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer"
          >
            {submitting ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href={withBase('/')}
            prefetch={false}
            className="text-purple-600 hover:text-purple-800 text-sm cursor-pointer"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
