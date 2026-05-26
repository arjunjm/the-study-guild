import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Star, Clock, X, BookOpen, ChevronRight } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { cn } from '../lib/utils';
import { TAXONOMY } from '../data/taxonomy';
import { useAuth } from '../contexts/AuthContext';
import type { Course, UserCourseProgress } from '@study-guild/shared';

const DIFFICULTY_STYLES = {
  beginner:     { label: 'Beginner',     classes: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  intermediate: { label: 'Intermediate', classes: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  advanced:     { label: 'Advanced',     classes: 'text-red-400 bg-red-400/10 border-red-400/30' },
};

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export default function CoursesPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterL1 = searchParams.get('l1') ?? '';
  const filterL2 = searchParams.get('l2') ?? '';
  const filterDiff = searchParams.get('difficulty') ?? '';

  // Local search state with debounced URL sync
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Press '/' anywhere to focus search (skip when typing in another input)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '/') return;
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (search.trim()) next.set('search', search.trim());
        else next.delete('search');
        return next;
      }, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  function setDifficulty(d: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (d && filterDiff !== d) next.set('difficulty', d);
      else next.delete('difficulty');
      return next;
    }, { replace: true });
  }

  function clearTopicFilter() {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('l1');
      next.delete('l2');
      return next;
    }, { replace: true });
  }

  function clearAll() {
    setSearch('');
    setSearchParams({});
  }

  const activeCat = TAXONOMY.find(c => c.l1 === filterL1);
  const activeItem = activeCat?.items.find(i => i.l2 === filterL2);
  const hasFilters = !!(filterL1 || filterL2 || filterDiff || search.trim());

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['courses', filterL1, filterL2, filterDiff, search],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filterL1) p.set('l1', filterL1);
      if (filterL2) p.set('l2', filterL2);
      if (filterDiff) p.set('difficulty', filterDiff);
      if (search.trim()) p.set('search', search.trim());
      return (await apiClient.get<{ data: Course[] }>(`/courses?${p}`)).data.data;
    },
  });

  // Always fetch all courses to compute category counts (unaffected by active filters)
  const { data: allCourses } = useQuery<Course[]>({
    queryKey: ['courses', '', '', '', ''],
    queryFn: async () => (await apiClient.get<{ data: Course[] }>('/courses')).data.data,
  });

  const { data: allProgress } = useQuery<UserCourseProgress[]>({
    queryKey: ['all-progress'],
    queryFn: async () => (await apiClient.get<{ data: UserCourseProgress[] }>('/progress')).data.data,
    enabled: isAuthenticated,
  });

  const progressMap = allProgress
    ? new Map(allProgress.map(p => [
        p.courseId,
        { completed: p.completedLessonIds.length, lastAccessed: p.lastAccessedAt, completedIds: new Set(p.completedLessonIds) },
      ]))
    : new Map<string, { completed: number; lastAccessed: string; completedIds: Set<string> }>();

  const categoryCounts = allCourses
    ? TAXONOMY.reduce((acc, cat) => {
        acc[cat.l1] = allCourses.filter(c => c.taxonomy.l1 === cat.l1).length;
        return acc;
      }, {} as Record<string, number>)
    : {};

  return (
    <div className="min-h-full px-4 py-8 lg:px-10 lg:py-10">
      {/* Header */}
      <div className="mb-7">
        <h1 className="mb-1 text-2xl font-bold text-white lg:text-3xl">Browse courses</h1>
        <p className="text-sm text-slate-400">
          {courses ? `${courses.length} course${courses.length !== 1 ? 's' : ''} available` : 'Loading…'}
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-4 relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          ref={searchInputRef}
          type="search"
          placeholder="Search courses… (press / to focus)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-700/60 bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:text-slate-300 transition"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Difficulty chips */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-600 font-medium">Level:</span>
        {DIFFICULTIES.map(d => {
          const isActive = filterDiff === d;
          return (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all duration-150',
                isActive
                  ? DIFFICULTY_STYLES[d].classes
                  : 'border-slate-700/60 text-slate-500 hover:border-slate-600 hover:text-slate-300'
              )}
            >
              {DIFFICULTY_STYLES[d].label}
            </button>
          );
        })}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-slate-700/40 px-3 py-1 text-xs text-slate-500 transition hover:border-red-500/30 hover:text-red-400"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* In-progress resume strip */}
      {!hasFilters && isAuthenticated && (() => {
        const inProgress = (allCourses ?? [])
          .filter(c => {
            const p = progressMap.get(c.id);
            if (!p || p.completed === 0) return false;
            return p.completed < c.totalLessons;
          })
          .sort((a, b) => {
            const pa = progressMap.get(a.id)!;
            const pb = progressMap.get(b.id)!;
            return new Date(pb.lastAccessed).getTime() - new Date(pa.lastAccessed).getTime();
          })
          .slice(0, 5);
        if (inProgress.length === 0) return null;
        return (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-slate-400">Continue learning</h2>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
              {inProgress.map(c => {
                const p = progressMap.get(c.id)!;
                const pct = Math.round((p.completed / c.totalLessons) * 100);
                const nextId = c.lessonIds.find(id => !p.completedIds.has(id));
                const cat = TAXONOMY.find(t => t.l1 === c.taxonomy.l1);
                return (
                  <Link
                    key={c.id}
                    to={nextId ? `/courses/${c.id}/lessons/${nextId}` : `/courses/${c.id}`}
                    className="group snap-start shrink-0 w-56 rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4 transition-all hover:border-violet-500/30 hover:bg-slate-900/80 hover:-translate-y-0.5"
                  >
                    {cat && (
                      <span className={cn('mb-2 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium', cat.bgColor, cat.color)}>
                        <cat.icon className="h-2.5 w-2.5" />
                        {c.taxonomy.l1}
                      </span>
                    )}
                    <p className="mb-3 text-sm font-semibold text-slate-200 group-hover:text-white transition leading-snug line-clamp-2">{c.title}</p>
                    <div className="mb-1 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{pct}% done</span>
                      <span className="flex items-center gap-0.5 text-violet-400 group-hover:text-violet-300 transition font-medium">
                        Resume <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Category overview — shown only when no filters are active */}
      {!hasFilters && !isLoading && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-400">Browse by topic</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-4">
            {TAXONOMY.map(cat => {
              const count = categoryCounts[cat.l1] ?? 0;
              if (count === 0) return null;
              return (
                <button
                  key={cat.l1}
                  onClick={() => navigate(`/courses?l1=${encodeURIComponent(cat.l1)}`)}
                  className={cn(
                    'group flex items-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 text-left transition-all duration-200',
                    'hover:border-slate-700 hover:bg-slate-900/70 hover:-translate-y-0.5 hover:shadow-lg',
                  )}
                >
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', cat.bgColor)}>
                    <cat.icon className={cn('h-4.5 w-4.5', cat.color)} style={{ width: 18, height: 18 }} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-200 group-hover:text-white transition">{cat.label}</p>
                    <p className="text-[11px] text-slate-500">{count} course{count !== 1 ? 's' : ''}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active topic breadcrumb + subcategory chips */}
      {activeCat && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-2.5">
            <activeCat.icon className={cn('h-4 w-4 shrink-0', activeCat.color)} />
            <span className={cn('text-sm font-medium', activeCat.color)}>{activeCat.label}</span>
            {activeItem && (
              <>
                <span className="text-slate-600 text-sm">›</span>
                <span className="text-sm text-slate-300">{activeItem.label}</span>
              </>
            )}
            <button
              onClick={clearTopicFilter}
              className="ml-auto rounded-lg p-1 text-slate-600 transition hover:text-slate-400"
              title="Clear topic filter"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Subcategory chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.delete('l2');
                return next;
              }, { replace: true })}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                !filterL2
                  ? cn(activeCat.activeColor.replace('border-r-2', '').trim(), 'border-transparent')
                  : 'border-slate-700/60 text-slate-500 hover:border-slate-600 hover:text-slate-300',
              )}
            >
              All
            </button>
            {activeCat.items.map(item => {
              const isActive = filterL2 === item.l2;
              return (
                <button
                  key={item.l2}
                  onClick={() => setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    if (isActive) next.delete('l2');
                    else next.set('l2', item.l2);
                    return next;
                  }, { replace: true })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    isActive
                      ? cn(activeCat.activeColor.replace('border-r-2', '').trim(), 'border-transparent')
                      : 'border-slate-700/60 text-slate-500 hover:border-slate-600 hover:text-slate-300',
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-slate-900/50 border border-slate-800/60 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && courses?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-2xl bg-slate-900/50 p-5">
            <Search className="h-8 w-8 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No courses found</p>
          <p className="mt-1 text-sm text-slate-600">Try adjusting your filters or search terms</p>
          {hasFilters && (
            <button onClick={clearAll} className="mt-4 text-xs text-violet-400 hover:text-violet-300 transition">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Course grid */}
      {!isLoading && courses && courses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => {
            const p = progressMap.get(course.id);
            const pct = p && course.totalLessons > 0 ? Math.round((p.completed / course.totalLessons) * 100) : 0;
            const nextLessonId = p && pct > 0 && pct < 100
              ? course.lessonIds.find(id => !p.completedIds.has(id))
              : undefined;
            return (
              <CourseCard
                key={course.id}
                course={course}
                progressPct={pct}
                lastAccessedAt={p?.lastAccessed}
                nextLessonId={nextLessonId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 11;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0" aria-hidden>
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgb(30,41,59)" strokeWidth="2.5" />
      <circle
        cx="14" cy="14" r={r} fill="none"
        stroke={pct === 100 ? '#10b981' : '#7c3aed'}
        strokeWidth="2.5"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 14 14)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {pct === 100 && (
        <polyline
          points="8,14 12,18 20,10"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function CourseCard({ course, progressPct, lastAccessedAt, nextLessonId }: {
  course: Course;
  progressPct?: number;
  lastAccessedAt?: string;
  nextLessonId?: string;
}) {
  const diff = DIFFICULTY_STYLES[course.difficulty];
  const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);
  const isNew = course.publishedAt
    ? (Date.now() - new Date(course.publishedAt).getTime()) < 30 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 transition-all duration-300 hover:border-violet-500/30 hover:bg-slate-900/70 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/5">
    <Link
      to={`/courses/${course.id}`}
      className="relative flex flex-col p-5"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-violet-500/5 to-transparent" />

      {isNew && (
        <div className="absolute right-3 top-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
          New
        </div>
      )}

      <div className="relative flex-1 flex flex-col">
        {/* Taxonomy with color */}
        <div className="mb-3 flex items-center gap-1.5 text-xs">
          {cat ? (
            <span className={cn('flex items-center gap-1 rounded-lg px-2 py-1 font-medium', cat.bgColor, cat.color)}>
              <cat.icon className="h-3 w-3" />
              {course.taxonomy.l1}
            </span>
          ) : (
            <span className="rounded-lg bg-slate-800 px-2 py-1 font-medium text-slate-300">{course.taxonomy.l1}</span>
          )}
          <span className="text-slate-600">›</span>
          <span className="text-slate-500">{course.taxonomy.l2}</span>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-base font-semibold text-white transition-colors group-hover:text-violet-300 leading-snug">
          {course.title}
        </h2>

        {/* Description */}
        <p className="mb-4 flex-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">{course.description}</p>

        {/* Author + lesson count + last studied */}
        <div className="mb-3 flex items-center justify-between text-xs text-slate-600">
          <span>by {course.authorName}</span>
          <div className="flex items-center gap-2">
            {lastAccessedAt && progressPct !== undefined && progressPct > 0 && (
              <span className="text-slate-600 italic">studied {relativeTime(lastAccessedAt)}</span>
            )}
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.totalLessons} lesson{course.totalLessons !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${diff.classes}`}>
            {diff.label}
          </span>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            {course.ratingCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400/80 font-medium">
                <Star className="h-3 w-3 fill-amber-400/80" />
                {course.ratingAverage.toFixed(1)}
                <span className="text-slate-600 font-normal">({course.ratingCount})</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.estimatedMinutes}m
            </span>
            {progressPct !== undefined && progressPct > 0 && (
              <ProgressRing pct={progressPct} />
            )}
          </div>
        </div>
      </div>
    </Link>
    {nextLessonId && (
      <Link
        to={`/courses/${course.id}/lessons/${nextLessonId}`}
        onClick={e => e.stopPropagation()}
        className="flex items-center justify-between border-t border-violet-500/20 bg-violet-500/8 px-5 py-2.5 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/12 hover:text-violet-200"
      >
        <span>Resume where you left off</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    )}
    </div>
  );
}
