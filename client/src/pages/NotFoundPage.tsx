import { Link } from 'react-router-dom';
import { BookOpen, Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-800/60 bg-slate-900/60">
        <BookOpen className="h-9 w-9 text-slate-600" />
      </div>
      <p className="mb-1 text-6xl font-bold text-slate-700">404</p>
      <h1 className="mb-2 text-xl font-semibold text-white">Page not found</h1>
      <p className="mb-8 max-w-sm text-sm text-slate-500">
        This page doesn't exist or was moved. Try browsing the course library instead.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
        >
          <Home className="h-4 w-4" /> Home
        </Link>
        <Link
          to="/courses"
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <Search className="h-4 w-4" /> Browse courses
        </Link>
      </div>
    </div>
  );
}
