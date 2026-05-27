import { Navigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../contexts/AuthContext';
import { loginRequest } from '../lib/msalConfig';
import { Sword, FlaskConical, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, isDevMode, devLogin } = useAuth();
  const { instance } = useMsal();

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50">
      {/* Subtle ambient orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet-100/80 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-amber-100/60 blur-3xl" />
      {/* Subtle dot grid */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.4,
      }} />

      <div className="relative w-full max-w-sm px-4">
        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-violet-600 shadow-lg shadow-violet-200">
              <Sword className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                The Study Guild
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Community-driven learning, together.
              </p>
            </div>
          </div>

          {/* Features list */}
          <div className="mb-7 space-y-2.5">
            {[
              'Interactive lessons with flow diagrams',
              'Community-curated courses, always free',
              'Track progress and earn achievements',
            ].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-xs text-slate-500">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                {f}
              </div>
            ))}
          </div>

          {/* CTA */}
          {isDevMode ? (
            <div className="space-y-3">
              <button
                onClick={devLogin}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-amber-200 transition hover:from-amber-400 hover:to-amber-300"
              >
                <FlaskConical className="h-4 w-4" />
                Enter dev mode
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <p className="text-center text-xs text-slate-400">
                No Azure config detected — using mock data
              </p>
            </div>
          ) : (
            <button
              onClick={() => instance.loginPopup(loginRequest)}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:from-violet-500 hover:to-violet-400"
            >
              Sign in with Microsoft
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          All courses are free. No subscription required.
        </p>
      </div>
    </div>
  );
}
