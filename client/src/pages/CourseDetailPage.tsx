import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Share2, Star, Clock, CheckCircle, Circle, ChevronLeft, BookOpen, ArrowRight, Zap, Code2, HelpCircle, GitFork, Award } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { TAXONOMY } from '../data/taxonomy';
import { cn } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import type { Course, Lesson, UserCourseProgress } from '@study-guild/shared';

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const qc = useQueryClient();
  const toast = useToast();
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submittedRating, setSubmittedRating] = useState(0);

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
  const rateMutation = useMutation({
    mutationFn: (rating: number) => apiClient.post(`/courses/${courseId}/rate`, { rating }),
    onSuccess: (_data, rating) => {
      setSubmittedRating(rating);
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      toast.success('Rating saved!', `You rated this course ${rating} star${rating !== 1 ? 's' : ''}`);
    },
  });

  if (!course) return <CourseDetailSkeleton />;

  const completed = progress?.completedLessonIds.length ?? 0;
  const total = lessons?.length ?? 0;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const firstIncomplete = lessons?.find(l => !progress?.completedLessonIds.includes(l.id));
  const diffStyle = { beginner: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/20', advanced: 'text-red-400 bg-red-400/10 border-red-400/20' }[course.difficulty];
  const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-slate-800/60 mesh-bg px-4 py-10 lg:px-10 lg:py-12">
        <div className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full bg-violet-600/8 blur-3xl" />
        <div className="relative max-w-3xl">
          <Link to="/courses" className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition w-fit">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to courses
          </Link>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            {cat ? (
              <span className={cn('flex items-center gap-1 rounded-lg px-2 py-1 font-medium', cat.bgColor, cat.color)}>
                <cat.icon className="h-3 w-3" />
                {course.taxonomy.l1}
              </span>
            ) : (
              <span className="rounded-lg bg-slate-800 px-2 py-1 text-slate-300">{course.taxonomy.l1}</span>
            )}
            <span className="text-slate-600">›</span>
            <span className="text-slate-500">{course.taxonomy.l2}</span>
            <span className={`ml-1 rounded-full border px-2.5 py-0.5 font-medium capitalize ${diffStyle}`}>{course.difficulty}</span>
          </div>
          <h1 className="mb-3 font-display text-2xl font-bold text-white lg:text-4xl">{course.title}</h1>
          <p className="mb-4 max-w-xl text-sm text-slate-400 leading-relaxed">{course.description}</p>
          {course.tags && course.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {course.tags.map(tag => (
                <span key={tag} className="rounded-full bg-slate-800/80 px-2 py-0.5 text-xs text-slate-500">#{tag}</span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{total} lessons</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.estimatedMinutes} min</span>
            {course.ratingCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400/80">
                <Star className="h-3.5 w-3.5 fill-amber-400/80" />
                {course.ratingAverage.toFixed(1)} ({course.ratingCount} ratings)
              </span>
            )}
            <span>by <span className="text-slate-400">{course.authorName}</span></span>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 lg:px-10 lg:py-10 max-w-3xl">
        {/* Course completion celebration banner */}
        {pct === 100 && total > 0 && (
          <div className="mb-8 relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/30 via-slate-900 to-slate-900 p-6">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-amber-500/8 blur-xl" />
            <div className="relative flex items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15">
                <Award className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500 mb-0.5">Course Complete</p>
                <h2 className="text-lg font-bold text-white">{course.title}</h2>
                <p className="text-sm text-slate-400">
                  You've completed all {total} lessons · {course.estimatedMinutes} min of learning
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress + CTA */}
        {total > 0 && (
          <div className="mb-8 rounded-2xl border border-slate-800/60 bg-slate-900/50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {pct === 100 ? 'Course complete!' : pct === 0 ? 'Not started' : 'In progress'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{completed} of {total} lessons done</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied!', 'Share this course with a friend'))}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition"
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
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Lessons */}
        <div className="mb-8">
          <h2 className="mb-4 text-base font-semibold text-white">Course content</h2>
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
                  className="group flex items-center gap-4 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 transition-all hover:border-violet-500/30 hover:bg-slate-900/70"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    {done ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-white transition truncate">
                      <span className="text-slate-600 mr-2 text-xs">{String(i + 1).padStart(2, '0')}</span>
                      {lesson.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-600">{lesson.estimatedMinutes} min</span>
                      {hasQuiz && (
                        <span className="flex items-center gap-0.5 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-400">
                          <HelpCircle className="h-2.5 w-2.5" />Quiz
                        </span>
                      )}
                      {hasCode && (
                        <span className="flex items-center gap-0.5 rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                          <Code2 className="h-2.5 w-2.5" />Code
                        </span>
                      )}
                      {hasDiagram && (
                        <span className="flex items-center gap-0.5 rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400">
                          <GitFork className="h-2.5 w-2.5" />Diagram
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-700 opacity-0 group-hover:opacity-100 transition" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* XP reward summary */}
        <div className="mb-8 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
          <h3 className="mb-3 text-sm font-semibold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-400" />
            XP you'll earn
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Per lesson', xp: 10 * total, detail: `${total} × 10 XP` },
              { label: 'Course complete', xp: 50, detail: 'bonus' },
              { label: 'Quiz perfect', xp: 40, detail: 'per lesson (optional)' },
              { label: 'Total potential', xp: 10 * total + 50 + 40 * total, detail: 'all quizzes perfect' },
            ].map(({ label, xp, detail }) => (
              <div key={label} className="rounded-xl bg-slate-900/60 p-3">
                <p className="text-lg font-bold text-violet-300">+{xp}</p>
                <p className="text-xs font-medium text-slate-300">{label}</p>
                <p className="text-[11px] text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="mb-8 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
          <h3 className="mb-1 text-sm font-semibold text-white">Rate this course</h3>
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
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-slate-700/60 hover:border-amber-500/30 hover:bg-amber-500/5',
                    rateMutation.isPending && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <Star className={cn('h-5 w-5 transition', filled ? 'fill-amber-400 text-amber-400' : 'text-slate-600')} />
                </button>
              );
            })}
            {submittedRating > 0 && !rateMutation.isPending && (
              <span className="ml-2 text-xs text-emerald-400">Rating saved!</span>
            )}
          </div>
        </div>

        {/* Related courses */}
        {relatedCourses && relatedCourses.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">More in {course.taxonomy.l1}</h2>
              <Link
                to={`/courses?l1=${encodeURIComponent(course.taxonomy.l1)}`}
                className="text-xs text-violet-400 hover:text-violet-300 transition"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {relatedCourses.map(rc => {
                const diff = { beginner: 'text-emerald-400', intermediate: 'text-amber-400', advanced: 'text-red-400' }[rc.difficulty];
                return (
                  <Link
                    key={rc.id}
                    to={`/courses/${rc.id}`}
                    className="group rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 transition-all hover:border-violet-500/30 hover:bg-slate-900/70"
                  >
                    <p className="mb-1 text-xs text-slate-500">{rc.taxonomy.l2}</p>
                    <h3 className="mb-2 text-sm font-semibold text-slate-200 group-hover:text-violet-300 transition leading-snug">{rc.title}</h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn('font-medium capitalize', diff)}>{rc.difficulty}</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Clock className="h-3 w-3" />
                        {rc.estimatedMinutes}m
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Bone({ className }: { className?: string }) {
  return <div className={cn('rounded-lg bg-slate-800/70 animate-pulse', className)} />;
}

function CourseDetailSkeleton() {
  return (
    <div className="min-h-full">
      {/* Hero skeleton */}
      <div className="border-b border-slate-800/60 px-4 py-10 lg:px-10 lg:py-12">
        <div className="max-w-3xl">
          <Bone className="mb-4 h-3 w-24" />
          <div className="mb-3 flex gap-2">
            <Bone className="h-6 w-20 rounded-lg" />
            <Bone className="h-6 w-16 rounded-lg" />
            <Bone className="h-6 w-24 rounded-full" />
          </div>
          <Bone className="mb-3 h-8 w-3/4" />
          <Bone className="mb-2 h-4 w-full" />
          <Bone className="mb-6 h-4 w-2/3" />
          <div className="flex gap-4 mb-6">
            {[1,2,3,4].map(i => <Bone key={i} className="h-12 w-24 rounded-xl" />)}
          </div>
          <Bone className="h-10 w-40 rounded-xl" />
        </div>
      </div>

      {/* Body skeleton */}
      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-10 lg:py-10 flex gap-8">
        <div className="flex-1 min-w-0">
          <Bone className="mb-6 h-5 w-32" />
          {[1,2,3,4,5].map(i => (
            <div key={i} className="mb-3 flex items-center gap-3 rounded-xl border border-slate-800/50 p-4">
              <Bone className="h-7 w-7 rounded-full shrink-0" />
              <div className="flex-1">
                <Bone className="mb-1.5 h-3.5 w-3/5" />
                <Bone className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden lg:block w-64 shrink-0">
          <Bone className="mb-4 h-36 rounded-2xl" />
          <Bone className="mb-3 h-28 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
