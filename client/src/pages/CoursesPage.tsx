import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Star, Clock, X, BookOpen, ChevronRight, Bookmark } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { cn } from '../lib/utils';
import { TAXONOMY } from '../data/taxonomy';
import { useAuth } from '../contexts/AuthContext';
import type { Course, UserCourseProgress } from '@study-guild/shared';

const DIFFICULTY_STYLES = {
  beginner:     { label: 'Beginner',     classes: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  intermediate: { label: 'Intermediate', classes: 'text-amber-700 bg-amber-50 border-amber-200' },
  advanced:     { label: 'Advanced',     classes: 'text-red-700 bg-red-50 border-red-200' },
};

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export default function CoursesPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterL1 = searchParams.get('l1') ?? '';
  const filterL2 = searchParams.get('l2') ?? '';
  const filterDiff = searchParams.get('difficulty') ?? '';
  const filterTag = searchParams.get('tag') ?? '';
  const sortBy = (searchParams.get('sort') ?? 'newest') as 'newest' | 'rating' | 'popular';

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [recentCourses] = useState<Array<{ id: string; title: string; l1: string; l2: string; difficulty: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('sg-recent-courses') ?? '[]'); }
    catch { return []; }
  });

  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('sg-bookmarks') ?? '[]')); }
    catch { return new Set(); }
  });
  const toggleBookmark = useCallback((courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId); else next.add(courseId);
      localStorage.setItem('sg-bookmarks', JSON.stringify([...next]));
      return next;
    });
  }, []);

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

  function setSort(s: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (s === 'newest') next.delete('sort');
      else next.set('sort', s);
      return next;
    }, { replace: true });
  }

  function setTag(tag: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (filterTag === tag) next.delete('tag');
      else next.set('tag', tag);
      return next;
    }, { replace: true });
  }

  function clearAll() {
    setSearch('');
    setSearchParams({});
  }

  const activeCat = TAXONOMY.find(c => c.l1 === filterL1);
  const activeItem = activeCat?.items.find(i => i.l2 === filterL2);
  const hasFilters = !!(filterL1 || filterL2 || filterDiff || search.trim() || filterTag);

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

  const { data: allCourses } = useQuery<Course[]>({
    queryKey: ['courses', '', '', '', ''],
    queryFn: async () => (await apiClient.get<{ data: Course[] }>('/courses')).data.data,
  });

  const { data: allProgress } = useQuery<UserCourseProgress[]>({
    queryKey: ['all-progress'],
    queryFn: async () => (await apiClient.get<{ data: UserCourseProgress[] }>('/progress')).data.data,
    enabled: isAuthenticated,
  });

  const progressMap = Array.isArray(allProgress)
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

  const difficultyCounts = allCourses
    ? DIFFICULTIES.reduce((acc, d) => {
        acc[d] = allCourses.filter(c => c.difficulty === d).length;
        return acc;
      }, {} as Record<string, number>)
    : {};

  const suggestions = search.trim().length >= 2 && allCourses
    ? allCourses
        .filter(c => c.title.toLowerCase().includes(search.toLowerCase().trim()))
        .slice(0, 6)
    : [];

  const popularTags = allCourses
    ? Object.entries(
        allCourses.flatMap(c => c.tags ?? []).reduce((acc, t) => { acc[t] = (acc[t] ?? 0) + 1; return acc; }, {} as Record<string, number>)
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag)
    : [];

  const totalHours = allCourses
    ? Math.round(allCourses.reduce((s, c) => s + (c.estimatedMinutes ?? 0), 0) / 60)
    : 0;

  const sortedCourses = courses ? [...courses].sort((a, b) => {
    if (sortBy === 'rating') return (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0);
    if (sortBy === 'popular') return (b.ratingCount ?? 0) - (a.ratingCount ?? 0);
    const dateA = new Date(a.publishedAt ?? a.createdAt ?? 0).getTime();
    const dateB = new Date(b.publishedAt ?? b.createdAt ?? 0).getTime();
    return dateB - dateA;
  }) : courses;

  const showBookmarkedOnly = searchParams.get('saved') === '1';
  const displayCourses = (() => {
    let list = filterTag ? sortedCourses?.filter(c => c.tags?.includes(filterTag)) : sortedCourses;
    if (showBookmarkedOnly) list = list?.filter(c => bookmarks.has(c.id));
    return list;
  })();

  return (
    <div className="min-h-full px-4 py-8 lg:px-10 lg:py-10">
      {/* Header */}
      <div className="mb-7">
        <h1 className="mb-1 text-2xl font-bold text-slate-900 lg:text-3xl">Browse courses</h1>
        <p className="text-sm text-slate-500">
          {displayCourses
            ? `${displayCourses.length} course${displayCourses.length !== 1 ? 's' : ''} available`
            : 'Loading…'}
          {!hasFilters && totalHours > 0 && (
            <span className="ml-2 text-slate-400">· {totalHours}+ hours of content</span>
          )}
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-4 relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
        <input
          ref={searchInputRef}
          type="search"
          placeholder="Search courses… (press / to focus)"
          value={search}
          onChange={e => { setSearch(e.target.value); setShowSuggestions(true); setSuggestionIdx(-1); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => { setShowSuggestions(false); setSuggestionIdx(-1); }, 150)}
          onKeyDown={e => {
            if (!showSuggestions || suggestions.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSuggestionIdx(i => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSuggestionIdx(i => Math.max(i - 1, -1));
            } else if (e.key === 'Enter' && suggestionIdx >= 0) {
              e.preventDefault();
              navigate(`/courses/${suggestions[suggestionIdx].id}`);
              setShowSuggestions(false);
            } else if (e.key === 'Escape') {
              setShowSuggestions(false);
              setSuggestionIdx(-1);
            }
          }}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600 transition z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
            {suggestions.map((c, idx) => {
              const cat = TAXONOMY.find(t => t.l1 === c.taxonomy.l1);
              return (
                <button
                  key={c.id}
                  onMouseDown={() => navigate(`/courses/${c.id}`)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left transition',
                    idx === suggestionIdx ? 'bg-slate-50' : 'hover:bg-slate-50'
                  )}
                >
                  {cat && (
                    <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md', cat.bgColor)}>
                      <cat.icon className={cn('h-3 w-3', cat.color)} />
                    </span>
                  )}
                  <span className="flex-1 truncate text-sm text-slate-800">{c.title}</span>
                  <span className="shrink-0 text-xs text-slate-400 capitalize">{c.difficulty}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Popular tags strip */}
      {!hasFilters && popularTags.length > 0 && (
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-thin">
          <span className="shrink-0 text-[11px] font-medium text-slate-400">Popular:</span>
          {popularTags.map(tag => (
            <button
              key={tag}
              onClick={() => setTag(tag)}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Active tag chip */}
      {filterTag && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-slate-500">Tag:</span>
          <button
            onClick={() => setTag(filterTag)}
            className="flex items-center gap-1 rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-100"
          >
            #{filterTag}
            <X className="ml-0.5 h-3 w-3" />
          </button>
        </div>
      )}

      {/* Difficulty chips */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">Level:</span>
        {DIFFICULTIES.map(d => {
          const isActive = filterDiff === d;
          const count = difficultyCounts[d] ?? 0;
          return (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all duration-150',
                isActive
                  ? DIFFICULTY_STYLES[d].classes
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              )}
            >
              {DIFFICULTY_STYLES[d].label}
              {count > 0 && (
                <span className={cn('ml-1 font-normal', isActive ? 'opacity-70' : 'text-slate-400')}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          {bookmarks.size > 0 && (
            <button
              onClick={() => setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                if (showBookmarkedOnly) next.delete('saved'); else next.set('saved', '1');
                return next;
              }, { replace: true })}
              className={cn(
                'flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150',
                showBookmarkedOnly
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              )}
            >
              <Bookmark className="h-3 w-3" />
              Saved ({bookmarks.size})
            </button>
          )}
          <span className="text-xs text-slate-500 font-medium">Sort:</span>
          {(['newest', 'rating', 'popular'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all duration-150',
                sortBy === s
                  ? 'border-violet-300 bg-violet-50 text-violet-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              )}
            >
              {s === 'newest' ? 'Newest' : s === 'rating' ? 'Top rated' : 'Popular'}
            </button>
          ))}
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 transition hover:border-red-200 hover:text-red-600"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Recently viewed strip */}
      {!hasFilters && recentCourses.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-600">Recently viewed</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
            {recentCourses.map(c => {
              const cat = TAXONOMY.find(t => t.l1 === c.l1);
              const diffColor = { beginner: 'text-emerald-700', intermediate: 'text-amber-700', advanced: 'text-red-700' }[c.difficulty as 'beginner' | 'intermediate' | 'advanced'] ?? 'text-slate-500';
              return (
                <Link
                  key={c.id}
                  to={`/courses/${c.id}`}
                  className="group snap-start shrink-0 w-48 rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:border-violet-300 hover:bg-violet-50 hover:-translate-y-0.5 shadow-sm"
                >
                  {cat && (
                    <span className={cn('mb-2 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium', cat.bgColor, cat.color)}>
                      <cat.icon className="h-2.5 w-2.5" />
                      {c.l1}
                    </span>
                  )}
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-violet-700 transition line-clamp-2 leading-snug">{c.title}</p>
                  <p className={`mt-1 text-[11px] capitalize ${diffColor}`}>{c.difficulty}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

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
            <h2 className="mb-3 text-sm font-semibold text-slate-600">Continue learning</h2>
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
                    className="group snap-start shrink-0 w-56 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-violet-300 hover:bg-violet-50 hover:-translate-y-0.5 shadow-sm"
                  >
                    {cat && (
                      <span className={cn('mb-2 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium', cat.bgColor, cat.color)}>
                        <cat.icon className="h-2.5 w-2.5" />
                        {c.taxonomy.l1}
                      </span>
                    )}
                    <p className="mb-3 text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition leading-snug line-clamp-2">{c.title}</p>
                    <div className="mb-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{pct}% done</span>
                      <span className="flex items-center gap-0.5 text-violet-600 group-hover:text-violet-700 transition font-medium">
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

      {/* Top-rated strip */}
      {!hasFilters && !isLoading && allCourses && allCourses.length > 0 && (() => {
        const topRated = [...allCourses]
          .filter(c => c.ratingCount >= 30)
          .sort((a, b) => (b.ratingAverage * Math.log(b.ratingCount + 1)) - (a.ratingAverage * Math.log(a.ratingCount + 1)))
          .slice(0, 3);
        if (topRated.length === 0) return null;
        return (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-slate-600 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              Top rated this week
            </h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {topRated.map((course, i) => {
                const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);
                const diff = DIFFICULTY_STYLES[course.difficulty];
                return (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 transition-all hover:border-amber-300 hover:from-amber-100 hover:to-amber-50 shadow-sm"
                  >
                    <div className="relative flex-shrink-0">
                      <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', cat?.bgColor ?? 'bg-slate-100')}>
                        {cat ? <cat.icon className={cn('h-5 w-5', cat.color)} /> : <BookOpen className="h-5 w-5 text-slate-400" />}
                      </span>
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                        {i + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800 group-hover:text-slate-900 transition leading-snug">{course.title}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="flex items-center gap-0.5 text-amber-600">
                          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                          {course.ratingAverage.toFixed(1)}
                        </span>
                        <span>·</span>
                        <span className={cn('capitalize font-medium', diff.classes.split(' ')[0])}>{course.difficulty}</span>
                        <span>·</span>
                        <span>{course.estimatedMinutes}m</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

      {!hasFilters && !isLoading && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-600">Browse by topic</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-4">
            {TAXONOMY.map(cat => {
              const count = categoryCounts[cat.l1] ?? 0;
              if (count === 0) return null;
              return (
                <button
                  key={cat.l1}
                  onClick={() => navigate(`/courses?l1=${encodeURIComponent(cat.l1)}`)}
                  className={cn(
                    'group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all duration-200 shadow-sm',
                    'hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md',
                  )}
                >
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', cat.bgColor)}>
                    <cat.icon className={cn('h-4.5 w-4.5', cat.color)} style={{ width: 18, height: 18 }} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition">{cat.label}</p>
                    <p className="text-[11px] text-slate-400">{count} course{count !== 1 ? 's' : ''}</p>
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
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
            <activeCat.icon className={cn('h-4 w-4 shrink-0', activeCat.color)} />
            <span className={cn('text-sm font-medium', activeCat.color)}>{activeCat.label}</span>
            {activeItem && (
              <>
                <span className="text-slate-400 text-sm">›</span>
                <span className="text-sm text-slate-600">{activeItem.label}</span>
              </>
            )}
            <button
              onClick={clearTopicFilter}
              className="ml-auto rounded-lg p-1 text-slate-400 transition hover:text-slate-600"
              title="Clear topic filter"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
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
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700',
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
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700',
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
            <div key={i} className="h-52 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (displayCourses?.length === 0) && (() => {
        const queryWords = search.trim().toLowerCase().split(/\s+/).filter(w => w.length >= 3);
        const suggestions = allCourses
          ? allCourses
              .filter(c => {
                if (filterTag && c.tags?.includes(filterTag)) return true;
                if (queryWords.some(w =>
                  c.title.toLowerCase().includes(w) ||
                  c.taxonomy.l1.toLowerCase().includes(w) ||
                  c.tags?.some(t => t.includes(w))
                )) return true;
                if (filterL1 && c.taxonomy.l1 === filterL1) return true;
                return false;
              })
              .slice(0, 3)
          : [];
        return (
          <div className="py-12 text-center">
            <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-4">
              <Search className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-700">No courses found</p>
            <p className="mt-1 text-sm text-slate-500">
              {search.trim() ? `No matches for "${search.trim()}"` : 'Try adjusting your filters'}
            </p>
            {suggestions.length > 0 && (
              <div className="mt-8 text-left max-w-xl mx-auto">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">You might like</p>
                <div className="space-y-2">
                  {suggestions.map(c => {
                    const cat = TAXONOMY.find(t => t.l1 === c.taxonomy.l1);
                    return (
                      <Link
                        key={c.id}
                        to={`/courses/${c.id}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-violet-300 hover:bg-violet-50 shadow-sm"
                      >
                        {cat ? (
                          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cat.bgColor)}>
                            <cat.icon className={cn('h-4 w-4', cat.color)} />
                          </span>
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <BookOpen className="h-4 w-4 text-slate-400" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-medium text-slate-800">{c.title}</p>
                          <p className="text-xs text-slate-500">{c.taxonomy.l1} · {c.difficulty}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            {hasFilters && (
              <button onClick={clearAll} className="mt-6 text-xs text-violet-600 hover:text-violet-700 transition">
                Clear all filters
              </button>
            )}
          </div>
        );
      })()}

      {/* Course grid */}
      {!isLoading && displayCourses && displayCourses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayCourses.map(course => {
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
                onTagClick={tag => setTag(tag)}
                bookmarked={bookmarks.has(course.id)}
                onBookmark={e => toggleBookmark(course.id, e)}
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
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgb(226,232,240)" strokeWidth="2.5" />
      <circle
        cx="14" cy="14" r={r} fill="none"
        stroke={pct === 100 ? '#059669' : '#7c3aed'}
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
          stroke="#059669"
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

function CourseCard({ course, progressPct, lastAccessedAt, nextLessonId, onTagClick, bookmarked, onBookmark }: {
  course: Course;
  progressPct?: number;
  lastAccessedAt?: string;
  onTagClick?: (tag: string) => void;
  nextLessonId?: string;
  bookmarked?: boolean;
  onBookmark?: (e: React.MouseEvent) => void;
}) {
  const diff = DIFFICULTY_STYLES[course.difficulty];
  const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);
  const isNew = course.publishedAt
    ? (Date.now() - new Date(course.publishedAt).getTime()) < 30 * 24 * 60 * 60 * 1000
    : false;
  const isHot = course.ratingAverage >= 4.5 && course.ratingCount >= 40;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100 hover:-translate-y-1 shadow-sm">
    <Link
      to={`/courses/${course.id}`}
      className="relative flex flex-col p-5"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-violet-50/50 to-transparent rounded-2xl" />

      {(isHot || isNew) && !bookmarked && (
        <div className={cn(
          'absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1',
          isHot
            ? 'bg-orange-50 border-orange-200 text-orange-600'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        )}>
          {isHot ? '🔥 Hot' : 'New'}
        </div>
      )}
      {onBookmark && (
        <button
          onClick={onBookmark}
          title={bookmarked ? 'Remove bookmark' : 'Save course'}
          className={cn(
            'absolute right-3 top-3 z-10 rounded-lg p-1.5 transition-all',
            bookmarked
              ? 'text-amber-600 bg-amber-50 opacity-100'
              : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-600 hover:bg-slate-100'
          )}
        >
          <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-amber-500 text-amber-500')} />
        </button>
      )}

      <div className="relative flex-1 flex flex-col">
        <div className="mb-3 flex items-center gap-1.5 text-xs">
          {cat ? (
            <span className={cn('flex items-center gap-1 rounded-lg px-2 py-1 font-medium', cat.bgColor, cat.color)}>
              <cat.icon className="h-3 w-3" />
              {course.taxonomy.l1}
            </span>
          ) : (
            <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-600">{course.taxonomy.l1}</span>
          )}
          <span className="text-slate-300">›</span>
          <span className="text-slate-400">{course.taxonomy.l2}</span>
        </div>

        <h2 className="mb-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-violet-700 leading-snug">
          {course.title}
        </h2>

        <p className="mb-3 flex-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">{course.description}</p>

        {course.tags && course.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {course.tags.slice(0, 3).map(tag => (
              <button
                key={tag}
                onClick={e => { e.preventDefault(); e.stopPropagation(); onTagClick?.(tag); }}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              >
                #{tag}
              </button>
            ))}
            {course.tags.length > 3 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                +{course.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
          <span>by {course.authorName}</span>
          <div className="flex items-center gap-2">
            {lastAccessedAt && progressPct !== undefined && progressPct > 0 && (
              <span className="text-slate-400 italic">studied {relativeTime(lastAccessedAt)}</span>
            )}
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.totalLessons} lesson{course.totalLessons !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${diff.classes}`}>
            {diff.label}
          </span>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {course.ratingCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {course.ratingAverage.toFixed(1)}
                <span className="text-slate-400 font-normal">({course.ratingCount})</span>
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
        className="flex items-center justify-between border-t border-violet-100 bg-violet-50 px-5 py-2.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
      >
        <span>Resume where you left off</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    )}
    </div>
  );
}
