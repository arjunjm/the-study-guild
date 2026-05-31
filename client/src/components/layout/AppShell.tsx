import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Home, BookOpen, GraduationCap, Sword, Flame, Trophy,
  ChevronDown, ChevronRight, LogOut, User, Shield, Search, X, Clock, Keyboard, PenLine, MessageCircleQuestion, Route,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { TAXONOMY } from '../../data/taxonomy';
import type { UserProfile, Course } from '@study-guild/shared';

const NAV = [
  { to: '/',            label: 'Home',        icon: Home,          end: true },
  { to: '/courses',     label: 'Browse',      icon: BookOpen },
  { to: '/ask',         label: 'Ask Guild',   icon: MessageCircleQuestion },
  { to: '/paths',       label: 'Paths',       icon: Route },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/teach',       label: 'Teach',       icon: GraduationCap },
];

export default function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target as HTMLElement).isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(v => !v);
        return;
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setShortcutsOpen(false);
        return;
      }
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setShortcutsOpen(v => !v);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onSearchOpen={() => setSearchOpen(true)} onShortcutsOpen={() => setShortcutsOpen(true)} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
        <MobileNav />
      </div>
      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onNavigate={(path) => { setSearchOpen(false); navigate(path); }}
        />
      )}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    </div>
  );
}

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeL1 = searchParams.get('l1') ?? '';
  const activeL2 = searchParams.get('l2') ?? '';
  const isCoursesPage = location.pathname === '/courses';
  const [openSections, setOpenSections] = useState<Set<string>>(() => activeL1 ? new Set([activeL1]) : new Set());
  const visibleOpenSections = activeL1 ? new Set([...openSections, activeL1]) : openSections;

  function toggleSection(l1: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(l1)) next.delete(l1);
      else next.add(l1);
      return next;
    });
  }

  return (
    <aside className="hidden md:flex w-[68px] lg:w-[220px] shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-3 px-4 border-b border-slate-100">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 shadow-sm">
          <Sword className="h-4 w-4 text-white" />
        </div>
        <span className="hidden lg:block text-sm font-bold text-slate-900 tracking-tight">
          Study Guild
        </span>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Primary nav */}
        <nav className="flex shrink-0 flex-col gap-0.5 p-2 pt-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600')} />
                  <span className="hidden lg:block">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mx-3 my-2 border-t border-slate-100" />

        <div className="hidden lg:flex items-center gap-2 px-3 pb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Topics</span>
        </div>

        {/* Taxonomy accordion */}
        <div className="flex flex-col gap-0.5 px-2 pb-3">
          {TAXONOMY.map(cat => {
            const Icon = cat.icon;
            const isOpen = visibleOpenSections.has(cat.l1);
            const isCatActive = isCoursesPage && activeL1 === cat.l1;

            return (
              <div key={cat.l1}>
                <button
                  onClick={() => {
                    toggleSection(cat.l1);
                    navigate(`/courses?l1=${encodeURIComponent(cat.l1)}`);
                  }}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                    isCatActive && !activeL2
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  )}
                  title={cat.label}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isCatActive ? cat.color : 'text-slate-400 group-hover:text-slate-500')} />
                  <span className="hidden lg:block flex-1 text-left text-[13px]">{cat.label}</span>
                  <ChevronRight
                    className={cn(
                      'hidden lg:block h-3 w-3 shrink-0 text-slate-300 transition-transform duration-200',
                      isOpen && 'rotate-90'
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="hidden lg:block ml-4 mt-0.5 space-y-0.5 border-l border-slate-200 pl-3">
                    {cat.items.map(item => {
                      const isItemActive = isCoursesPage && activeL1 === cat.l1 && activeL2 === item.l2;
                      return (
                        <Link
                          key={item.l2}
                          to={`/courses?l1=${encodeURIComponent(cat.l1)}&l2=${encodeURIComponent(item.l2)}`}
                          className={cn(
                            'block rounded-md px-3 py-1.5 text-xs transition-colors duration-150',
                            isItemActive
                              ? 'bg-violet-50 text-violet-700 font-medium'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 p-3 border-t border-slate-100">
        <div className="hidden lg:flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">
          <Shield className="h-3.5 w-3.5 text-violet-500" />
          <span>Free & open access</span>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ onSearchOpen, onShortcutsOpen }: { onSearchOpen: () => void; onShortcutsOpen: () => void }) {
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get<{ data: UserProfile }>('/users/me')).data.data,
  });

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-violet-700">
          <Sword className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-bold text-slate-900">Study Guild</span>
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          onClick={onSearchOpen}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:block">Search…</span>
          <kbd className="hidden sm:inline-flex h-4 items-center rounded border border-slate-200 bg-white px-1 font-mono text-[10px] text-slate-400">⌘K</kbd>
        </button>

        {/* Shortcuts hint */}
        <button
          onClick={onShortcutsOpen}
          title="Keyboard shortcuts (?)"
          className="hidden sm:flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 hover:border-slate-300"
        >
          <Keyboard className="h-3.5 w-3.5" />
        </button>

        {/* Streak — kept because it's about learning, not points */}
        {user && user.streak > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600">
            <Flame className="h-3 w-3" />
            {user.streak}d streak
          </div>
        )}

        {user && <ProfileDropdown user={user} />}
      </div>
    </header>
  );
}

function ProfileDropdown({ user }: { user: UserProfile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition hover:bg-slate-50 hover:border-slate-300"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-violet-700 text-[11px] font-bold text-white">
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden lg:block max-w-[100px] truncate text-xs font-medium text-slate-700">
          {user.displayName}
        </span>
        <ChevronDown className={cn('hidden lg:block h-3.5 w-3.5 text-slate-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="animate-slide-up absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 overflow-hidden z-50">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{user.displayName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          </div>

          <div className="p-1">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <User className="h-4 w-4 text-slate-400" />
              My profile
            </Link>
            <Link
              to="/leaderboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Trophy className="h-4 w-4 text-slate-400" />
              Leaderboard
            </Link>
            <Link
              to="/teach"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <GraduationCap className="h-4 w-4 text-slate-400" />
              Teach
            </Link>
            <Link
              to="/notes"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <PenLine className="h-4 w-4 text-slate-400" />
              My Notes
            </Link>
          </div>

          <div className="border-t border-slate-100 p-1">
            <button
              onClick={async () => { setOpen(false); await logout(); navigate('/login'); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Browse', path: '/courses', icon: BookOpen },
  { label: 'Ask', path: '/ask', icon: MessageCircleQuestion },
  { label: 'Paths', path: '/paths', icon: Route },
  { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Notes', path: '/notes', icon: PenLine },
] as const;

const SEARCH_HISTORY_KEY = 'sg-search-history';

function getSearchHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? '[]') as string[]; }
  catch { return []; }
}

function addSearchHistory(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const prev = getSearchHistory().filter(q => q !== trimmed);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify([trimmed, ...prev].slice(0, 6)));
}

function SearchModal({ onClose, onNavigate }: { onClose: () => void; onNavigate: (path: string) => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => getSearchHistory());
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { data: courses } = useQuery<Course[]>({
    queryKey: ['courses', '', '', '', ''],
    queryFn: async () => (await apiClient.get<{ data: Course[] }>('/courses')).data.data,
  });

  const recentCourseIds = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sg-recent-courses') ?? '[]') as Array<{ id: string }>;
      return saved.map(c => c.id).slice(0, 4);
    } catch { return []; }
  })[0];

  useEffect(() => { inputRef.current?.focus(); }, []);

  const hasQuery = query.trim().length >= 1;
  const recentCourses = !hasQuery && courses
    ? courses.filter(c => recentCourseIds.includes(c.id)).sort((a, b) => recentCourseIds.indexOf(a.id) - recentCourseIds.indexOf(b.id))
    : [];
  const filtered = hasQuery
    ? (courses ?? []).filter(c =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.taxonomy.l1.toLowerCase().includes(query.toLowerCase()) ||
        c.taxonomy.l2.toLowerCase().includes(query.toLowerCase()) ||
        c.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 8)
    : recentCourses.length > 0 ? recentCourses : (courses?.slice(0, 5) ?? []);

  function navigateToCourse(courseId: string) {
    if (query.trim()) {
      addSearchHistory(query.trim());
      setSearchHistory(getSearchHistory());
    }
    onNavigate(`/courses/${courseId}`);
  }

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => { const next = i < filtered.length - 1 ? i + 1 : 0; itemRefs.current[next]?.scrollIntoView({ block: 'nearest' }); return next; });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => { const next = i > 0 ? i - 1 : filtered.length - 1; itemRefs.current[next]?.scrollIntoView({ block: 'nearest' }); return next; });
    } else if (e.key === 'Enter' && selectedIndex >= 0 && filtered[selectedIndex]) {
      e.preventDefault();
      navigateToCourse(filtered[selectedIndex].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, onNavigate, filtered, selectedIndex, query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[8vh] px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search courses…"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(-1); }}
            onKeyDown={handleKey}
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] text-slate-400">Esc</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length === 0 && hasQuery && (
            <div className="py-8 text-center text-sm text-slate-400">No courses found for "{query}"</div>
          )}

          {!hasQuery && (
            <>
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Quick navigation</p>
              <div className="mb-2 grid grid-cols-3 gap-1 sm:grid-cols-6">
                {QUICK_ACTIONS.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.path}
                      onClick={() => onNavigate(action.path)}
                      className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-center transition hover:bg-slate-50"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
                        <Icon className="h-4 w-4 text-slate-500" />
                      </span>
                      <span className="text-[10px] text-slate-500">{action.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mx-1 mb-2 border-t border-slate-100" />
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {recentCourses.length > 0 ? 'Recently viewed' : 'Suggested'}
              </p>
            </>
          )}

          {!hasQuery && searchHistory.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between px-3 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Recent searches</p>
                <button
                  onClick={() => { localStorage.removeItem(SEARCH_HISTORY_KEY); setSearchHistory([]); }}
                  className="text-[10px] text-slate-400 hover:text-slate-600 transition"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {searchHistory.map(q => (
                  <button
                    key={q}
                    onClick={() => setQuery(q)}
                    className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <Clock className="h-3 w-3 text-slate-400" />
                    {q}
                  </button>
                ))}
              </div>
              <div className="mx-1 mb-2 border-t border-slate-100" />
            </div>
          )}

          {filtered.map((course, idx) => {
            const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={course.id}
                ref={el => { itemRefs.current[idx] = el; }}
                onClick={() => navigateToCourse(course.id)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                  isSelected ? 'bg-violet-50 ring-1 ring-inset ring-violet-200' : 'hover:bg-slate-50'
                )}
              >
                {cat ? (
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cat.bgColor)}>
                    <cat.icon className={cn('h-4 w-4', cat.color)} />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm font-medium', isSelected ? 'text-violet-700' : 'text-slate-800 group-hover:text-slate-900')}>{course.title}</p>
                  <p className="text-xs text-slate-400">{course.taxonomy.l1} · {course.taxonomy.l2}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3 text-slate-300" />
                  <span className="text-xs text-slate-400">{course.estimatedMinutes}m</span>
                </div>
              </button>
            );
          })}
          {!hasQuery && (
            <button
              onClick={() => onNavigate('/courses')}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 mt-1"
            >
              <Search className="h-3 w-3" />
              Browse all courses
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const groups = [
    {
      label: 'Navigation',
      shortcuts: [
        { keys: ['⌘K', 'Ctrl+K'], desc: 'Open course search' },
        { keys: ['/'], desc: 'Focus search bar (Browse page)' },
        { keys: ['?'], desc: 'Show this shortcuts guide' },
        { keys: ['Esc'], desc: 'Close any modal' },
      ],
    },
    {
      label: 'Lessons',
      shortcuts: [
        { keys: ['←', '→'], desc: 'Previous / next lesson' },
        { keys: ['Ctrl+S'], desc: 'Save lesson (editor)' },
      ],
    },
    {
      label: 'Browse',
      shortcuts: [
        { keys: ['↑', '↓', 'Enter'], desc: 'Navigate autocomplete' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Keyboard className="h-4 w-4 text-violet-600" />
            <h2 className="text-sm font-semibold text-slate-900">Keyboard shortcuts</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {groups.map(group => (
            <div key={group.label}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.label}</p>
              <div className="space-y-1.5">
                {group.shortcuts.map(s => (
                  <div key={s.desc} className="flex items-center justify-between gap-4 rounded-xl px-3 py-2 bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-600">{s.desc}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, i) => (
                        <span key={k} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[10px] text-slate-400">or</span>}
                          <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] text-slate-600 shadow-sm">
                            {k}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-[11px] text-slate-400 text-center">Press <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono text-[10px]">?</kbd> to toggle</p>
        </div>
      </div>
    </div>
  );
}

function MobileNav() {
  const items = [
    { to: '/',            label: 'Home',    icon: Home,          end: true },
    { to: '/courses',     label: 'Browse',  icon: BookOpen },
    { to: '/ask',         label: 'Ask',     icon: MessageCircleQuestion },
    { to: '/paths',       label: 'Paths',   icon: Route },
    { to: '/leaderboard', label: 'Ranks',   icon: Trophy },
    { to: '/teach',       label: 'Teach',   icon: GraduationCap },
    { to: '/profile',     label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-slate-200 bg-white">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors"
        >
          {({ isActive }) => (
            <div className={cn('flex flex-col items-center gap-0.5', isActive ? 'text-violet-600' : 'text-slate-400')}>
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
