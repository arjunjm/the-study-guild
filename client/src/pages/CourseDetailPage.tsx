import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Share2, Star, Clock, CheckCircle, Circle, ChevronLeft, BookOpen, ArrowRight, Code2, HelpCircle, GitFork, Award, Download, X, ExternalLink, Bookmark } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { TAXONOMY } from '../data/taxonomy';
import { cn } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { getTopicResources, RESOURCE_TYPE_LABELS, RESOURCE_TYPE_COLORS } from '../data/topicResources';
import type { Course, Lesson, UserCourseProgress, UserProfile } from '@study-guild/shared';

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const toast = useToast();
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submittedRating, setSubmittedRating] = useState(0);
  const [showCert, setShowCert] = useState(() => searchParams.get('cert') === '1');
  const [bookmarked, setBookmarked] = useState(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem('sg-bookmarks') ?? '[]')).has(courseId ?? ''); }
    catch { return false; }
  });

  function toggleBookmark() {
    setBookmarked(prev => {
      const next = !prev;
      try {
        const saved = new Set<string>(JSON.parse(localStorage.getItem('sg-bookmarks') ?? '[]'));
        if (next) saved.add(courseId!); else saved.delete(courseId!);
        localStorage.setItem('sg-bookmarks', JSON.stringify([...saved]));
      } catch { /* ignore */ }
      return next;
    });
  }

  const { data: course } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: async () => (await apiClient.get<{ data: Course }>(`/courses/${courseId}`)).data.data,
  });
  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ['lessons', courseId],
    queryFn: async () => (await apiClient.get<{ data: Lesson[] }>(`/courses/${courseId}/lessons`)).data.data,
  });
  const { data: progress } = useQuery<UserCourseProgress | null>({
    queryKey: ['progress', courseId],
    queryFn: async () => (await apiClient.get<{ data: UserCourseProgress | null }>(`/progress/${courseId}`)).data.data,
  });
  const { data: relatedCourses } = useQuery<Course[]>({
    queryKey: ['courses-related', course?.taxonomy.l1],
    queryFn: async () => {
      const p = new URLSearchParams({ l1: course!.taxonomy.l1 });
      return (await apiClient.get<{ data: Course[] }>(`/courses?${p}`)).data.data;
    },
    enabled: !!course,
    select: (data) => data.filter(c => c.id !== courseId).slice(0, 3),
  });
  const { data: me } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get<{ data: UserProfile }>('/users/me')).data.data,
  });
  const rateMutation = useMutation({
    mutationFn: (rating: number) => apiClient.post(`/courses/${courseId}/rate`, { rating }),
    onSuccess: (_data, rating) => {
      setSubmittedRating(rating);
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      toast.success('Rating saved!', `You rated this course ${rating} star${rating !== 1 ? 's' : ''}`);
    },
  });

  useEffect(() => {
    if (!course) return;
    try {
      const key = 'sg-recent-courses';
      const prev = JSON.parse(localStorage.getItem(key) ?? '[]') as Array<{ id: string; title: string; l1: string; l2: string; difficulty: string }>;
      const next = [{ id: course.id, title: course.title, l1: course.taxonomy.l1, l2: course.taxonomy.l2, difficulty: course.difficulty }, ...prev.filter(c => c.id !== course.id)].slice(0, 6);
      localStorage.setItem(key, JSON.stringify(next));
    } catch { /* ignore */ }
  }, [course?.id]);

  if (!course) return <CourseDetailSkeleton />;

  const completed = progress?.completedLessonIds.length ?? 0;
  const total = lessons?.length ?? 0;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const firstIncomplete = lessons?.find(l => !progress?.completedLessonIds.includes(l.id));
  const remainingMinutes = lessons && pct > 0 && pct < 100
    ? lessons.filter(l => !progress?.completedLessonIds.includes(l.id)).reduce((s, l) => s + l.estimatedMinutes, 0)
    : 0;
  const diffStyle = {
    beginner: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    intermediate: 'text-amber-700 bg-amber-50 border-amber-200',
    advanced: 'text-red-700 bg-red-50 border-red-200',
  }[course.difficulty];
  const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);

  return (
    <>
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-white px-4 py-10 lg:px-10 lg:py-12">
        <div className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full bg-violet-100/40 blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <Link to="/courses" className="mb-4 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition w-fit">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to courses
          </Link>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            {cat ? (
              <span className={cn('flex items-center gap-1 rounded-lg px-2 py-1 font-medium', cat.bgColor, cat.color)}>
                <cat.icon className="h-3 w-3" />
                {course.taxonomy.l1}
              </span>
            ) : (
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">{course.taxonomy.l1}</span>
            )}
            <span className="text-slate-300">›</span>
            <span className="text-slate-500">{course.taxonomy.l2}</span>
            <span className={`ml-1 rounded-full border px-2.5 py-0.5 font-medium capitalize ${diffStyle}`}>{course.difficulty}</span>
          </div>
          <h1 className="mb-3 font-display text-2xl font-bold text-slate-900 lg:text-4xl">{course.title}</h1>
          <p className="mb-4 max-w-xl text-sm text-slate-500 leading-relaxed">{course.description}</p>
          {course.tags && course.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {course.tags.map(tag => (
                <Link
                  key={tag}
                  to={`/courses?search=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{total} lessons</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.estimatedMinutes} min</span>
              {course.ratingCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  {course.ratingAverage.toFixed(1)} ({course.ratingCount} ratings)
                </span>
              )}
              <span>by <span className="text-slate-700">{course.authorName}</span></span>
            </div>
            <button
              onClick={toggleBookmark}
              title={bookmarked ? 'Remove from saved' : 'Save course'}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                bookmarked
                  ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
              )}
            >
              <Bookmark className={cn('h-3.5 w-3.5', bookmarked && 'fill-amber-500 text-amber-500')} />
              {bookmarked ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-10 lg:py-10">
        {/* Course completion celebration banner */}
        {pct === 100 && total > 0 && (
          <>
            <div className="mb-6 relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-100 blur-2xl" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
                    <Award className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 mb-0.5">Course Complete</p>
                    <h2 className="text-lg font-bold text-slate-900">{course.title}</h2>
                    <p className="text-sm text-slate-500">
                      You've completed all {total} lessons · {course.estimatedMinutes} min of learning
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCert(true)}
                  className="self-start sm:self-auto sm:shrink-0 flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <Award className="h-4 w-4" />
                  Certificate
                </button>
              </div>
            </div>
            {relatedCourses && relatedCourses.length > 0 && (() => {
              const DIFFICULTY_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };
              const nextLevel = relatedCourses
                .filter(rc => (DIFFICULTY_ORDER[rc.difficulty] ?? 0) >= (DIFFICULTY_ORDER[course.difficulty] ?? 0))
                .sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 0) - (DIFFICULTY_ORDER[b.difficulty] ?? 0))
                .slice(0, 2);
              if (nextLevel.length === 0) return null;
              return (
                <div className="mb-8 rounded-2xl border border-violet-200 bg-violet-50 p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-violet-600">What to learn next</p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {nextLevel.map(rc => {
                      const diff = { beginner: 'text-emerald-700', intermediate: 'text-amber-700', advanced: 'text-red-700' }[rc.difficulty];
                      const rcCat = TAXONOMY.find(c => c.l1 === rc.taxonomy.l1);
                      return (
                        <Link
                          key={rc.id}
                          to={`/courses/${rc.id}`}
                          className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-violet-300 hover:bg-white shadow-sm"
                        >
                          {rcCat && (
                            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', rcCat.bgColor)}>
                              <rcCat.icon className={cn('h-4 w-4', rcCat.color)} />
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800 group-hover:text-violet-700 transition leading-snug">{rc.title}</p>
                            <div className="mt-0.5 flex items-center gap-2 text-xs">
                              <span className={cn('font-medium capitalize', diff)}>{rc.difficulty}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-500">{rc.estimatedMinutes}m</span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-violet-500 transition" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* Progress + CTA */}
        {total > 0 && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {pct === 100 ? 'Course complete!' : pct === 0 ? 'Not started' : 'In progress'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {completed} of {total} lessons done
                  {remainingMinutes > 0 && (
                    <span className="ml-1.5">
                      · <Clock className="inline h-2.5 w-2.5 -mt-0.5" /> {remainingMinutes} min remaining
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied!', 'Share this course with a friend'))}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:border-slate-300 transition"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
                {firstIncomplete && (
                  <Link
                    to={`/courses/${courseId}/lessons/${firstIncomplete.id}`}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition"
                  >
                    {pct === 0 ? 'Start' : 'Continue'}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* What you'll learn */}
        {lessons && lessons.length >= 4 && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">What you'll learn</h2>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {lessons.map(lesson => (
                <div key={lesson.id} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span className="leading-relaxed">{lesson.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lessons */}
        <div className="mb-8">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Course content</h2>
          <div className="space-y-2">
            {lessons?.map((lesson, i) => {
              const done = progress?.completedLessonIds.includes(lesson.id);
              const hasQuiz = lesson.content.sections.some(s => s.type === 'quiz');
              const hasCode = lesson.content.sections.some(s => s.type === 'codeBlock');
              const hasDiagram = lesson.content.sections.some(s => s.type === 'flowDiagram');
              return (
                <Link
                  key={lesson.id}
                  to={`/courses/${courseId}/lessons/${lesson.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-violet-300 hover:bg-violet-50 shadow-sm"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {done ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 group-hover:text-slate-900 transition truncate">
                      <span className="text-slate-400 mr-2 text-xs">{String(i + 1).padStart(2, '0')}</span>
                      {lesson.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-400">{lesson.estimatedMinutes} min</span>
                      {hasQuiz && (
                        <span className="flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                          <HelpCircle className="h-2.5 w-2.5" />Quiz
                        </span>
                      )}
                      {hasCode && (
                        <span className="flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          <Code2 className="h-2.5 w-2.5" />Code
                        </span>
                      )}
                      {hasDiagram && (
                        <span className="flex items-center gap-0.5 rounded-full bg-cyan-50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700">
                          <GitFork className="h-2.5 w-2.5" />Diagram
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {done && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        done
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-violet-500 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Rating */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Rate this course</h3>
          <p className="mb-4 text-xs text-slate-500">Your feedback helps other learners find great content.</p>
          <div className="flex items-center gap-2" onMouseLeave={() => setHoveredRating(0)}>
            {[1, 2, 3, 4, 5].map(n => {
              const filled = hoveredRating ? n <= hoveredRating : n <= submittedRating;
              return (
                <button
                  key={n}
                  onClick={() => rateMutation.mutate(n)}
                  onMouseEnter={() => setHoveredRating(n)}
                  disabled={rateMutation.isPending}
                  className={cn(
                    'rounded-lg border p-2 transition',
                    filled
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-slate-200 hover:border-amber-200 hover:bg-amber-50',
                    rateMutation.isPending && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <Star className={cn('h-5 w-5 transition', filled ? 'fill-amber-500 text-amber-500' : 'text-slate-300')} />
                </button>
              );
            })}
            {submittedRating > 0 && !rateMutation.isPending && (
              <span className="ml-2 text-xs text-emerald-600">Rating saved!</span>
            )}
          </div>
        </div>

        {/* Further Reading */}
        {(() => {
          const resources = getTopicResources(course.taxonomy.l1, course.taxonomy.l2);
          if (resources.length === 0) return null;
          return (
            <div className="mb-8">
              <h2 className="mb-1 text-base font-semibold text-slate-900">Further Reading</h2>
              <p className="mb-4 text-xs text-slate-500">Curated resources to go deeper on {course.taxonomy.l2}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {resources.map(r => (
                  <a
                    key={r.url}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-violet-300 hover:shadow-md"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className={cn('inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', RESOURCE_TYPE_COLORS[r.type])}>
                        {RESOURCE_TYPE_LABELS[r.type]}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-violet-400 transition" />
                    </div>
                    <p className="mb-0.5 text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition leading-snug">{r.title}</p>
                    {r.author && <p className="mb-1.5 text-xs text-slate-400">{r.author}</p>}
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{r.description}</p>
                  </a>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Related courses */}
        {relatedCourses && relatedCourses.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">More in {course.taxonomy.l1}</h2>
              <Link
                to={`/courses?l1=${encodeURIComponent(course.taxonomy.l1)}`}
                className="text-xs text-violet-600 hover:text-violet-700 transition"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {relatedCourses.map(rc => {
                const diff = { beginner: 'text-emerald-700', intermediate: 'text-amber-700', advanced: 'text-red-700' }[rc.difficulty];
                return (
                  <Link
                    key={rc.id}
                    to={`/courses/${rc.id}`}
                    className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-violet-300 hover:bg-violet-50 shadow-sm"
                  >
                    <p className="mb-1 text-xs text-slate-400">{rc.taxonomy.l2}</p>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition leading-snug line-clamp-2">{rc.title}</h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn('font-medium capitalize', diff)}>{rc.difficulty}</span>
                      <div className="flex items-center gap-2 text-slate-500">
                        {rc.ratingAverage > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-600">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span>{rc.ratingAverage.toFixed(1)}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {rc.estimatedMinutes}m
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Certificate modal */}
    {showCert && course && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) setShowCert(false); }}
      >
        <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-50 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-50 blur-3xl" />
          </div>

          <button
            onClick={() => setShowCert(false)}
            className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-400 transition hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative px-10 py-12 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-50 shadow-lg shadow-amber-100">
              <Award className="h-10 w-10 text-amber-600" />
            </div>

            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Certificate of Completion</p>
            <p className="mb-1 text-sm text-slate-500">This certifies that</p>
            <p className="mb-3 font-display text-2xl font-bold text-slate-900">{me?.displayName || 'Guild Member'}</p>
            <p className="mb-1 text-sm text-slate-500">has successfully completed</p>
            <p className="mb-6 font-display text-xl font-bold text-amber-600 leading-snug">{course.title}</p>

            <div className="mb-8 flex justify-center gap-8 text-center text-xs text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">{total}</p>
                <p>Lessons</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">{course.estimatedMinutes} min</p>
                <p>Study time</p>
              </div>
              <div>
                <p className="font-semibold capitalize text-slate-700">{course.difficulty}</p>
                <p>Level</p>
              </div>
            </div>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
            </div>

            <p className="mb-6 text-xs text-slate-400">The Study Guild · {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`I just completed "${course.title}" on The Study Guild! 🎓`).then(() => toast.success('Copied to clipboard!', 'Share your achievement'));
                }}
                className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function Bone({ className }: { className?: string }) {
  return <div className={cn('rounded-lg bg-slate-100 animate-pulse', className)} />;
}

function CourseDetailSkeleton() {
  return (
    <div className="min-h-full">
      <div className="border-b border-slate-200 bg-white px-4 py-10 lg:px-10 lg:py-12">
        <div className="max-w-3xl mx-auto">
          <Bone className="mb-4 h-3 w-24" />
          <div className="mb-3 flex gap-2">
            <Bone className="h-6 w-20 rounded-lg" />
            <Bone className="h-6 w-16 rounded-lg" />
            <Bone className="h-6 w-24 rounded-full" />
          </div>
          <Bone className="mb-3 h-8 w-3/4" />
          <Bone className="mb-2 h-4 w-full" />
          <Bone className="mb-6 h-4 w-2/3" />
          <div className="flex gap-4">
            {[1,2,3,4].map(i => <Bone key={i} className="h-4 w-24 rounded-full" />)}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-10 lg:py-10">
        <Bone className="mb-6 h-20 rounded-2xl" />
        <Bone className="mb-6 h-5 w-32" />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            <Bone className="h-7 w-7 rounded-full shrink-0" />
            <div className="flex-1">
              <Bone className="mb-1.5 h-3.5 w-3/5" />
              <Bone className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
