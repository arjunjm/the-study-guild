import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, List, PenLine, ArrowRight, BookOpen } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { cn } from '../lib/utils';
import LessonRenderer from '../components/lesson/LessonRenderer';
import XPRewardOverlay from '../components/XPRewardOverlay';
import { computeRank, XP_REWARDS } from '../lib/xpUtils';
import { useToast } from '../contexts/ToastContext';
import type { Lesson, UserCourseProgress, Course } from '@study-guild/shared';
import type { GuildRank } from '@study-guild/shared';

interface CompleteResponse {
  progress: UserCourseProgress;
  xpGained: number;
  breakdown: { label: string; amount: number }[];
  rankChanged: boolean;
  prevRank: GuildRank;
  newRank: GuildRank;
  alreadyCompleted: boolean;
  newAchievements?: string[];
}

interface RewardState {
  xpGained: number;
  breakdown: { label: string; amount: number }[];
  newXP: number;
  courseComplete: boolean;
  rankUp?: { from: GuildRank; to: GuildRank };
  newAchievements?: string[];
}

const ACHIEVEMENT_LABELS: Record<string, string> = {
  'first-lesson': 'First Step', 'ten-lessons': 'Dedicated Learner', 'fifty-lessons': 'Knowledge Seeker',
  'first-course': 'Course Complete', 'five-courses': 'Guild Scholar', 'quiz-perfect': 'Perfect Score',
  'quiz-master': 'Quiz Master', 'rank-apprentice': 'Apprentice', 'rank-scholar': 'Scholar',
  'rank-expert': 'Expert', 'streak-3': '3-Day Streak', 'streak-7': 'Week Warrior', 'streak-30': 'Monthly Champion',
};

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [reward, setReward] = useState<RewardState | null>(null);
  const quizScoreRef = useRef<number | undefined>(undefined);

  const { data: lesson } = useQuery<Lesson>({
    queryKey: ['lesson', courseId, lessonId],
    queryFn: async () =>
      (await apiClient.get<{ data: Lesson }>(`/courses/${courseId}/lessons/${lessonId}`)).data.data,
  });

  const { data: course } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: async () =>
      (await apiClient.get<{ data: Course }>(`/courses/${courseId}`)).data.data,
  });

  const { data: progress } = useQuery<UserCourseProgress | null>({
    queryKey: ['progress', courseId],
    queryFn: async () =>
      (await apiClient.get<{ data: UserCourseProgress | null }>(`/progress/${courseId}`)).data.data,
  });

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ['lessons', courseId],
    queryFn: async () =>
      (await apiClient.get<{ data: Lesson[] }>(`/courses/${courseId}/lessons`)).data.data,
  });

  const completeMutation = useMutation({
    mutationFn: (quizScore?: number) =>
      apiClient.post<{ data: CompleteResponse }>('/progress/lesson-complete', { courseId, lessonId, quizScore }),
    onSuccess: (res) => {
      const data = res.data.data;
      const cachedUser = qc.getQueryData<{ xp: number; rank: GuildRank }>(['me']);
      const prevXP = cachedUser?.xp ?? 0;
      const newXP = prevXP + data.xpGained;

      const totalLessons = course?.totalLessons ?? 0;
      const completedAfter = data.progress.completedLessonIds.length;
      const courseNowComplete = totalLessons > 0 && completedAfter >= totalLessons;

      let breakdown = data.breakdown ?? buildClientBreakdown(quizScoreRef.current, lesson);
      let totalXP = data.xpGained;
      if (courseNowComplete && !data.alreadyCompleted) {
        breakdown = [...breakdown, { label: 'Course complete!', amount: XP_REWARDS.course_completed }];
        totalXP += XP_REWARDS.course_completed;
      }

      const rankUp = data.rankChanged
        ? { from: data.prevRank, to: data.newRank }
        : (() => {
            const prevRank = cachedUser?.rank ?? computeRank(prevXP);
            const newRank = computeRank(newXP + (courseNowComplete && !data.alreadyCompleted ? XP_REWARDS.course_completed : 0));
            return prevRank !== newRank ? { from: prevRank as GuildRank, to: newRank } : undefined;
          })();

      setReward({ xpGained: totalXP, breakdown, newXP, courseComplete: courseNowComplete, rankUp, newAchievements: data.newAchievements });
      if (data.newAchievements?.length) {
        data.newAchievements.forEach(id => {
          toast.success(`Achievement unlocked!`, ACHIEVEMENT_LABELS[id] ?? id);
        });
      }
      qc.invalidateQueries({ queryKey: ['progress', courseId] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });

  if (!lesson) return <LessonSkeleton />;

  const alreadyComplete = progress?.completedLessonIds.includes(lessonId!) ?? false;
  const completedCount = progress?.completedLessonIds.length ?? 0;

  const sortedLessons = lessons ? [...lessons].sort((a, b) => a.order - b.order) : [];
  const currentIdx = sortedLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? sortedLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx >= 0 && currentIdx < sortedLessons.length - 1 ? sortedLessons[currentIdx + 1] : null;
  const prevComplete = prevLesson ? (progress?.completedLessonIds.includes(prevLesson.id) ?? false) : false;
  const nextComplete = nextLesson ? (progress?.completedLessonIds.includes(nextLesson.id) ?? false) : false;
  return (
    <LessonPageContent
      lesson={lesson}
      courseId={courseId!}
      alreadyComplete={alreadyComplete}
      completedCount={completedCount}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
      prevComplete={prevComplete}
      nextComplete={nextComplete}
      totalLessons={sortedLessons.length}
      reward={reward}
      completing={completeMutation.isPending}
      onComplete={(quizScore) => { quizScoreRef.current = quizScore; completeMutation.mutate(quizScore); }}
      onDismissReward={() => {
        setReward(null);
        if (nextLesson && !reward?.courseComplete) {
          navigate(`/courses/${courseId}/lessons/${nextLesson.id}`);
        } else {
          navigate(`/courses/${courseId}`);
        }
      }}
    />
  );
}

function LessonPageContent({
  lesson, courseId, alreadyComplete, completedCount, prevLesson, nextLesson,
  prevComplete, nextComplete, totalLessons, reward, completing, onComplete, onDismissReward,
}: {
  lesson: Lesson;
  courseId: string;
  alreadyComplete: boolean;
  completedCount: number;
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
  prevComplete: boolean;
  nextComplete: boolean;
  totalLessons: number;
  reward: RewardState | null;
  completing: boolean;
  onComplete: (quizScore?: number) => void;
  onDismissReward: () => void;
}) {
  const navigate = useNavigate();
  const [scrollPct, setScrollPct] = useState(0);
  const [showToc, setShowToc] = useState(false);
  const [showNotes, setShowNotes] = useState(() => !!localStorage.getItem(`lesson-notes-${lesson.id}`));
  const [notes, setNotes] = useState(() => localStorage.getItem(`lesson-notes-${lesson.id}`) ?? '');
  const sections = lesson.content.sections;

  useEffect(() => {
    const t = setTimeout(() => {
      if (notes.trim()) localStorage.setItem(`lesson-notes-${lesson.id}`, notes);
      else localStorage.removeItem(`lesson-notes-${lesson.id}`);
    }, 600);
    return () => clearTimeout(t);
  }, [notes, lesson.id]);

  const onScroll = useCallback(() => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    setScrollPct(docHeight > 0 ? Math.min(100, Math.round((window.scrollY / docHeight) * 100)) : 0);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (reward) return;
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowLeft' && prevLesson) {
        navigate(`/courses/${courseId}/lessons/${prevLesson.id}`);
      } else if (e.key === 'ArrowRight' && nextLesson) {
        navigate(`/courses/${courseId}/lessons/${nextLesson.id}`);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [courseId, prevLesson, nextLesson, reward, navigate]);

  return (
    <>
      <div className="min-h-full">
        {/* Top bar */}
        <div className="relative sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-xl px-4 py-3 lg:px-10">
          <div className="flex items-center justify-between max-w-3xl mx-auto gap-4">

            <Link
              to={`/courses/${courseId}`}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition shrink-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back to course
            </Link>

            {totalLessons > 0 && (
              <div className="flex flex-1 items-center gap-2.5 max-w-xs mx-auto">
                <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
                    style={{ width: `${Math.round((completedCount / totalLessons) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 tabular-nums shrink-0">
                  {completedCount}/{totalLessons}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 ml-auto">
              {alreadyComplete && (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle className="h-3 w-3" /> Done
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                {lesson.estimatedMinutes} min
              </span>
              {sections.length >= 3 && (
                <div className="relative">
                  <button
                    onClick={() => setShowToc(v => !v)}
                    className={cn(
                      'flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition',
                      showToc ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600'
                    )}
                    title="Contents"
                  >
                    <List className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Contents</span>
                  </button>
                  {showToc && (
                    <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                      <p className="border-b border-slate-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {sections.length} sections
                      </p>
                      {sections.map((s, i) => {
                        const label = s.type === 'text' ? 'Reading'
                          : s.type === 'callout' ? (s.title || `${s.variant.charAt(0).toUpperCase()}${s.variant.slice(1)} note`)
                          : s.type === 'codeBlock' ? `Code: ${s.language}`
                          : s.type === 'flowDiagram' ? (s.title || 'Diagram')
                          : s.type === 'quiz' ? 'Quiz'
                          : s.type === 'interactive' ? 'Interactive'
                          : `Section ${i + 1}`;
                        const color = s.type === 'quiz' ? 'text-amber-600' : s.type === 'codeBlock' ? 'text-violet-600' : s.type === 'flowDiagram' ? 'text-cyan-600' : s.type === 'callout' ? 'text-blue-600' : 'text-slate-500';
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setShowToc(false);
                              document.getElementById(`lesson-section-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-slate-50"
                          >
                            <span className={`shrink-0 text-[10px] font-bold uppercase tabular-nums ${color}`}>{String(i + 1).padStart(2, '0')}</span>
                            <span className="truncate text-xs text-slate-700">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Reading progress */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-violet-400"
              style={{ width: `${scrollPct}%`, transition: scrollPct === 0 ? 'none' : 'width 0.1s linear' }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-3xl px-4 py-8 lg:px-10 lg:py-10">
          <h1 className="mb-8 text-2xl font-bold text-slate-900 lg:text-3xl">{lesson.title}</h1>
          <LessonRenderer
            content={lesson.content}
            onComplete={onComplete}
            completing={completing}
            alreadyComplete={alreadyComplete}
          />

          {/* Notes panel */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => setShowNotes(v => !v)}
              className="flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <PenLine className="h-4 w-4 text-slate-400" />
                My notes
                {notes.trim() && <span className="h-1.5 w-1.5 rounded-full bg-violet-500" title="Has notes" />}
              </span>
              <span className="text-xs text-slate-400">{showNotes ? 'collapse' : notes.trim() ? 'view' : 'add notes'}</span>
            </button>
            {showNotes && (
              <div className="border-t border-slate-100 px-5 py-4">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Jot down key points, questions, or reminders for this lesson…"
                  rows={5}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white"
                />
                <p className="mt-1.5 text-right text-[10px] text-slate-400">
                  {notes.length > 0 ? `${notes.length} chars · auto-saved` : 'saved locally in your browser'}
                </p>
              </div>
            )}
          </div>

          {/* Prev / Next navigation */}
          {(prevLesson || nextLesson) && (
            <div className="mt-10 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
              {prevLesson ? (
                <Link
                  to={`/courses/${courseId}/lessons/${prevLesson.id}`}
                  className="group flex max-w-[44%] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-violet-300 hover:bg-violet-50 shadow-sm"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-violet-500 transition" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 flex items-center gap-1">
                      Previous
                      {prevComplete && <CheckCircle className="h-2.5 w-2.5 text-emerald-500" />}
                    </p>
                    <p className="truncate text-sm font-medium text-slate-700 group-hover:text-slate-900 transition">{prevLesson.title}</p>
                  </div>
                </Link>
              ) : <div />}

              {nextLesson ? (
                <Link
                  to={`/courses/${courseId}/lessons/${nextLesson.id}`}
                  className="group ml-auto flex max-w-[44%] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-right transition hover:border-violet-300 hover:bg-violet-50 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 flex items-center justify-end gap-1">
                      {nextComplete && <CheckCircle className="h-2.5 w-2.5 text-emerald-500" />}
                      Next
                    </p>
                    <p className="truncate text-sm font-medium text-slate-700 group-hover:text-slate-900 transition">{nextLesson.title}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-violet-500 transition" />
                </Link>
              ) : (
                <Link
                  to={`/courses/${courseId}`}
                  className="group ml-auto flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 transition hover:border-emerald-300 hover:bg-emerald-100 shadow-sm"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-emerald-600">Finished</p>
                    <p className="text-sm font-medium text-emerald-700 group-hover:text-emerald-800 transition">Back to course</p>
                  </div>
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500 group-hover:text-emerald-600 transition" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky completion bar */}
      {alreadyComplete && !reward && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur-xl md:left-[68px] lg:left-[220px]">
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 lg:px-10">
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium shrink-0">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Lesson complete</span>
            </div>
            <div className="flex-1" />
            {nextLesson ? (
              <Link
                to={`/courses/${courseId}/lessons/${nextLesson.id}`}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
              >
                <span className="hidden sm:inline">Next:</span>
                <span className="max-w-[180px] truncate">{nextLesson.title}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            ) : (
              <Link
                to={`/courses/${courseId}`}
                className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                Back to course
              </Link>
            )}
          </div>
        </div>
      )}

      {reward && (
        <XPRewardOverlay
          {...reward}
          onDismiss={onDismissReward}
        />
      )}
    </>
  );
}

function buildClientBreakdown(quizScore: number | undefined, lesson: Lesson | undefined) {
  const breakdown: { label: string; amount: number }[] = [
    { label: 'Lesson complete', amount: XP_REWARDS.lesson_completed },
  ];
  if (quizScore !== undefined) {
    const quizSection = lesson?.content.sections.find(s => s.type === 'quiz');
    const passingScore = quizSection?.type === 'quiz' ? quizSection.passingScore : 60;
    if (quizScore >= passingScore) {
      breakdown.push({
        label: quizScore === 100 ? 'Perfect quiz!' : 'Quiz passed',
        amount: quizScore === 100 ? XP_REWARDS.quiz_perfect : XP_REWARDS.quiz_passed,
      });
    }
  }
  return breakdown;
}

function LessonSkeleton() {
  return (
    <div className="min-h-full animate-pulse">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 lg:px-10">
        <div className="flex items-center justify-between max-w-3xl mx-auto gap-4">
          <div className="h-3 w-24 rounded-lg bg-slate-100" />
          <div className="flex-1 max-w-xs mx-auto h-1.5 rounded-full bg-slate-100" />
          <div className="h-3 w-16 rounded-lg bg-slate-100" />
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-10 lg:py-10">
        <div className="mb-8 h-8 w-2/3 rounded-xl bg-slate-100" />
        <div className="space-y-3 mb-8">
          {[100, 90, 95, 70, 85].map((w, i) => (
            <div key={i} className="h-4 rounded-lg bg-slate-100" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="mb-4 h-4 w-1/3 rounded-lg bg-slate-100" />
        <div className="space-y-3 mb-10">
          {[85, 80, 90].map((w, i) => (
            <div key={i} className="h-4 rounded-lg bg-slate-100" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="h-px bg-slate-100 mb-6" />
        <div className="flex justify-between">
          <div className="h-14 w-40 rounded-xl bg-slate-100" />
          <div className="h-14 w-40 rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
