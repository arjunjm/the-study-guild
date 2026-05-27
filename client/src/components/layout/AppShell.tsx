import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Home, BookOpen, GraduationCap, Sword, Flame, Zap, Trophy,
  ChevronDown, ChevronRight, LogOut, User, Shield, Search, X, Clock, Keyboard,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { TAXONOMY } from '../../data/taxonomy';
import type { UserProfile, Course } from '@study-guild/shared';
import { RANK_XP_THRESHOLDS } from '@study-guild/shared';

const NAV = [
  { to: '/',            label: 'Home',        icon: Home,          end: true },
  { to: '/courses',     label: 'Browse',      icon: BookOpen },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/teach',       label: 'Teach',       icon: GraduationCap },
];

const RANK_ORDER = Object.keys(RANK_XP_THRESHOLDS) as (keyof typeof RANK_XP_THRESHOLDS)[];

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
    <div className="flex min-h-screen bg-[#020817]">
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
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeL1 = searchParams.get('l1') ?? '';
  const activeL2 = searchParams.get('l2') ?? '';
  const isCoursesPage = location.pathname === '/courses';

  // Auto-open the active category when navigating from outside
  useEffect(() => {
    if (activeL1) {
      setOpenSections(prev => new Set([...prev, activeL1]));
    }
  }, [activeL1]);

  function toggleSection(l1: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(l1)) next.delete(l1);
      else next.add(l1);
      return next;
    });
  }

  return (
    <aside className="hidden md:flex w-[68px] lg:w-[220px] shrink-0 flex-col border-r border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-4 border-b border-slate-800/60">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-amber-500 shadow-lg glow-violet">
          <Sword className="h-5 w-5 text-white" />
        </div>
        <span className="hidden lg:block font-display text-base font-bold text-gradient-gold tracking-wide">
          Study Guild
        </span>
      </div>

      {/* Scrollable content area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Primary nav */}
        <nav className="flex shrink-0 flex-col gap-1 p-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-violet-500/15 text-violet-300 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-violet-400" />
                  )}
                  <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-colors', isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300')} />
                  <span className="hidden lg:block">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Divider + Browse Topics header */}
        <div className="mx-3 border-t border-slate-800/60" />
        <div className="hidden lg:flex items-center gap-2 px-4 pb-1.5 pt-3">
          <BookOpen className="h-3 w-3 text-slate-600" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Browse Topics</span>
        </div>

        {/* Taxonomy accordion */}
        <div className="flex flex-col gap-0.5 p-3 pt-1.5">
          {TAXONOMY.map(cat => {
            const Icon = cat.icon;
            const isOpen = openSections.has(cat.l1);
            const isCatActive = isCoursesPage && activeL1 === cat.l1;

            return (
              <div key={cat.l1}>
                {/* Category header */}
                <button
                  onClick={() => {
                    toggleSection(cat.l1);
                    navigate(`/courses?l1=${encodeURIComponent(cat.l1)}`);
                  }}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                    isCatActive && !activeL2
                      ? 'bg-slate-800/60 text-slate-200'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  )}
                  title={cat.label}
                >
                  <Icon className={cn('h-[17px] w-[17px] shrink-0 transition-colors', isCatActive ? cat.color : 'text-slate-500 group-hover:text-slate-400')} />
                  <span className="hidden lg:block flex-1 text-left text-[13px]">{cat.label}</span>
                  <ChevronRight
                    className={cn(
                      'hidden lg:block h-3.5 w-3.5 shrink-0 text-slate-600 transition-transform duration-200',
                      isOpen && 'rotate-90'
                    )}
                  />
                </button>

                {/* Subcategory items */}
                {isOpen && (
                  <div className="hidden lg:block ml-4 mt-0.5 space-y-0.5 border-l border-slate-800/60 pl-3">
                    {cat.items.map(item => {
                      const isItemActive = isCoursesPage && activeL1 === cat.l1 && activeL2 === item.l2;
                      return (
                        <Link
                          key={item.l2}
                          to={`/courses?l1=${encodeURIComponent(cat.l1)}&l2=${encodeURIComponent(item.l2)}`}
                          className={cn(
                            'relative block rounded-lg px-3 py-1.5 text-xs transition-all duration-150',
                            isItemActive
                              ? cn(cat.activeColor, 'font-medium')
                              : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
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

      {/* Bottom badge */}
      <div className="shrink-0 p-3 border-t border-slate-800/60">
        <div className="hidden lg:flex items-center gap-2 rounded-xl bg-slate-800/40 px-3 py-2 text-xs text-slate-500">
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

  const rankIdx = user ? RANK_ORDER.indexOf(user.rank as keyof typeof RANK_XP_THRESHOLDS) : 0;
  const nextThreshold = rankIdx < RANK_ORDER.length - 1 ? RANK_XP_THRESHOLDS[RANK_ORDER[rankIdx + 1]] : null;
  const currThreshold = RANK_XP_THRESHOLDS[RANK_ORDER[rankIdx]];
  const rankPct = nextThreshold
    ? Math.min(100, Math.round(((user?.xp ?? 0) - currThreshold) / (nextThreshold - currThreshold) * 100))
    : 100;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/60 bg-slate-950/70 px-4 backdrop-blur-xl lg:px-6">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-amber-500">
          <Sword className="h-4 w-4 text-white" />
        </div>
        <span className="font-display text-sm font-bold text-gradient-gold">Study Guild</span>
      </div>
      <div className="hidden md:block" />

      {/* Right side */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Search button */}
        <button
          onClick={onSearchOpen}
          className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-600 hover:text-slate-200"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:block">Search courses…</span>
          <kbd className="hidden sm:inline-flex h-4 items-center rounded bg-slate-700/60 px-1 font-mono text-[10px] text-slate-500">⌘K</kbd>
        </button>
        {/* Keyboard shortcuts hint */}
        <button
          onClick={onShortcutsOpen}
          title="Keyboard shortcuts (?)"
          className="hidden sm:flex items-center justify-center h-8 w-8 rounded-xl border border-slate-700/50 bg-slate-800/40 text-slate-500 transition hover:border-slate-600 hover:text-slate-300"
        >
          <Keyboard className="h-3.5 w-3.5" />
        </button>
        {/* Streak chip */}
        {user && user.streak > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300">
            <Flame className="h-3.5 w-3.5 animate-pulse-glow" />
            {user.streak} day streak
          </div>
        )}

        {/* XP chip */}
        {user && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
            <Zap className="h-3.5 w-3.5" />
            {user.xp.toLocaleString()} XP
          </div>
        )}

        {/* Rank XP mini-bar */}
        {user && (
          <div className="hidden lg:flex flex-col justify-center gap-0.5 w-28">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span className="text-amber-400/80 font-medium">{user.rank}</span>
              <span>{rankPct}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all duration-700"
                style={{ width: `${rankPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Profile dropdown */}
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
        className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-2.5 py-1.5 text-sm transition hover:bg-slate-800 hover:border-slate-600"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-bold text-white">
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden lg:block max-w-[100px] truncate text-xs font-medium text-slate-200">
          {user.displayName}
        </span>
        <ChevronDown className={cn('hidden lg:block h-3.5 w-3.5 text-slate-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="animate-slide-up absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* User info header */}
          <div className="border-b border-slate-800 bg-gradient-to-br from-violet-900/20 to-transparent p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.displayName}</p>
                <p className="text-xs text-amber-400 font-medium">{user.rank}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5 space-y-0.5">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <User className="h-4 w-4 text-slate-400" />
              View profile
            </Link>
            <Link
              to="/leaderboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Trophy className="h-4 w-4 text-amber-400/70" />
              Leaderboard
            </Link>
            <Link
              to="/teach"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <GraduationCap className="h-4 w-4 text-slate-400" />
              Teacher dashboard
            </Link>
          </div>

          <div className="border-t border-slate-800 p-1.5">
            <button
              onClick={async () => { setOpen(false); await logout(); navigate('/login'); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
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
  { label: 'Browse courses', path: '/courses', icon: BookOpen },
  { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { label: 'My profile', path: '/profile', icon: User },
  { label: 'Teach', path: '/teach', icon: GraduationCap },
] as const;

function SearchModal({ onClose, onNavigate }: { onClose: () => void; onNavigate: (path: string) => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  useEffect(() => {
    setSelectedIndex(-1);
  }, [filtered.length, query]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => {
        const next = i < filtered.length - 1 ? i + 1 : 0;
        itemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => {
        const next = i > 0 ? i - 1 : filtered.length - 1;
        itemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'Enter' && selectedIndex >= 0 && filtered[selectedIndex]) {
      e.preventDefault();
      onNavigate(`/courses/${filtered[selectedIndex].id}`);
    }
  }, [onClose, onNavigate, filtered, selectedIndex]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm pt-[10vh] px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search courses…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-600 hover:text-slate-400">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center rounded bg-slate-800 px-1.5 font-mono text-[10px] text-slate-500">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length === 0 && hasQuery && (
            <div className="py-8 text-center text-sm text-slate-500">No courses found for "{query}"</div>
          )}

          {!hasQuery && (
            <>
              {/* Quick nav actions */}
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Quick navigation</p>
              <div className="mb-2 grid grid-cols-3 gap-1">
                {QUICK_ACTIONS.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.path}
                      onClick={() => onNavigate(action.path)}
                      className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition hover:bg-slate-800/60"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
                        <Icon className="h-4 w-4 text-slate-400" />
                      </span>
                      <span className="text-xs text-slate-500">{action.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mx-1 mb-2 border-t border-slate-800/60" />
              {recentCourses.length > 0 && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Recently viewed</p>
              )}
              {recentCourses.length === 0 && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Suggested courses</p>
              )}
            </>
          )}

          {filtered.map((course, idx) => {
            const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={course.id}
                ref={el => { itemRefs.current[idx] = el; }}
                onClick={() => onNavigate(`/courses/${course.id}`)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition',
                  isSelected ? 'bg-violet-500/15 ring-1 ring-inset ring-violet-500/30' : 'hover:bg-slate-800/60'
                )}
              >
                {cat ? (
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cat.bgColor)}>
                    <cat.icon className={cn('h-4 w-4', cat.color)} />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                    <BookOpen className="h-4 w-4 text-slate-500" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm font-medium transition', isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white')}>{course.title}</p>
                  <p className="text-xs text-slate-500">{course.taxonomy.l1} · {course.taxonomy.l2}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3 text-slate-600" />
                  <span className="text-xs text-slate-600">{course.estimatedMinutes}m</span>
                </div>
              </button>
            );
          })}
          {!hasQuery && (
            <button
              onClick={() => onNavigate('/courses')}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-500 transition hover:bg-slate-800/40 hover:text-slate-300 mt-1"
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
        { keys: ['/'], desc: 'Focus search bar (on Browse page)' },
        { keys: ['?'], desc: 'Show this shortcuts guide' },
        { keys: ['Esc'], desc: 'Close any modal or overlay' },
      ],
    },
    {
      label: 'Lessons',
      shortcuts: [
        { keys: ['←', '→'], desc: 'Navigate previous / next lesson' },
        { keys: ['Ctrl+S'], desc: 'Save lesson (in editor)' },
      ],
    },
    {
      label: 'Browse',
      shortcuts: [
        { keys: ['↑', '↓', 'Enter'], desc: 'Navigate search autocomplete' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Keyboard className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Keyboard shortcuts</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-600 hover:text-slate-400 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-4 space-y-5">
          {groups.map(group => (
            <div key={group.label}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">{group.label}</p>
              <div className="space-y-1.5">
                {group.shortcuts.map(s => (
                  <div key={s.desc} className="flex items-center justify-between gap-4 rounded-xl px-3 py-2 bg-slate-800/30">
                    <span className="text-xs text-slate-400">{s.desc}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, i) => (
                        <span key={k} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[10px] text-slate-600">or</span>}
                          <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-slate-700/80 px-1.5 font-mono text-[10px] text-slate-300 border border-slate-600/50">
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

        <div className="border-t border-slate-800 px-5 py-3">
          <p className="text-[11px] text-slate-600 text-center">Press <kbd className="rounded bg-slate-800 px-1 font-mono text-[10px]">?</kbd> to toggle this guide</p>
        </div>
      </div>
    </div>
  );
}

function MobileNav() {
  const items = [
    { to: '/',            label: 'Home',        icon: Home,          end: true },
    { to: '/courses',     label: 'Browse',      icon: BookOpen },
    { to: '/leaderboard', label: 'Ranks',       icon: Trophy },
    { to: '/teach',       label: 'Teach',       icon: GraduationCap },
    { to: '/profile',     label: 'Profile',     icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      {items.map(({ to, label, icon: Icon, end }) => {
        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors"
          >
            {({ isActive: navActive }) => (
              <div className={cn('flex flex-col items-center gap-0.5', navActive ? 'text-violet-400' : 'text-slate-500')}>
                {navActive && (
                  <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-violet-400" />
                )}
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </div>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
