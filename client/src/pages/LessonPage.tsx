import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import LessonRenderer from '../components/lesson/LessonRenderer';
import XPRewardOverlay from '../components/XPRewardOverlay';
import { computeRank, XP_REWARDS } from '../lib/xpUtils';
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
}

interface RewardState {
  xpGained: number;
  breakdown: { label: string; amount: number }[];
  newXP: number;
  courseComplete: boolean;
  rankUp?: { from: GuildRank; to: GuildRank };
}

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
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

      // Determine if this finishes the course
      const totalLessons = course?.totalLessons ?? 0;
      const completedAfter = data.progress.completedLessonIds.length;
      const courseNowComplete = totalLessons > 0 && completedAfter >= totalLessons;

      // Add course_completed bonus if just finished
      let breakdown = data.breakdown ?? buildClientBreakdown(quizScoreRef.current, lesson);
      let totalXP = data.xpGained;
      if (courseNowComplete && !data.alreadyCompleted) {
        breakdown = [...breakdown, { label: 'Course complete!', amount: XP_REWARDS.course_completed }];
        totalXP += XP_REWARDS.course_completed;
      }

      const rankUp = data.rankChanged
        ? { from: data.prevRank, to: data.newRank }
        : (() => {
            // Fallback: calculate client-side if server didn't report rank change
            const prevRank = cachedUser?.rank ?? computeRank(prevXP);
            const newRank = computeRank(newXP + (courseNowComplete && !data.alreadyCompleted ? XP_REWARDS.course_completed : 0));
            return prevRank !== newRank ? { from: prevRank as GuildRank, to: newRank } : undefined;
          })();

      setReward({ xpGained: totalXP, breakdown, newXP, courseComplete: courseNowComplete, rankUp });
      qc.invalidateQueries({ queryKey: ['progress', courseId] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });

  if (!lesson) return (
    <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading lesson…</div>
  );

  const alreadyComplete = progress?.completedLessonIds.includes(lessonId!) ?? false;
  const completedCount = progress?.completedLessonIds.length ?? 0;

  const sortedLessons = lessons ? [...lessons].sort((a, b) => a.order - b.order) : [];
  const currentIdx = sortedLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? sortedLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx >= 0 && currentIdx < sortedLessons.length - 1 ? sortedLessons[currentIdx + 1] : null;
  return (
    <LessonPageContent
      lesson={lesson}
      courseId={courseId!}
      alreadyComplete={alreadyComplete}
      completedCount={completedCount}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
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
  totalLessons, reward, completing, onComplete, onDismissReward,
}: {
  lesson: Lesson;
  courseId: string;
  alreadyComplete: boolean;
  completedCount: number;
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
  totalLessons: number;
  reward: RewardState | null;
  completing: boolean;
  onComplete: (quizScore?: number) => void;
  onDismissReward: () => void;
}) {
  const navigate = useNavigate();

  // Keyboard navigation: ← prev lesson, → next lesson (skip when typing in inputs)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (reward) return; // overlay is open
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
        <div className="sticky top-0 z-10 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl px-4 py-3 lg:px-10">
          <div className="flex items-center justify-between max-w-3xl mx-auto gap-4">
            <Link
              to={`/courses/${courseId}`}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition shrink-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back to course
            </Link>

            {/* Course progress bar + lesson counter */}
            {totalLessons > 0 && (
              <div className="flex flex-1 items-center gap-2.5 max-w-xs mx-auto">
                <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
                    style={{ width: `${Math.round((completedCount / totalLessons) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-600 tabular-nums shrink-0">
                  {completedCount}/{totalLessons}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 ml-auto">
              {alreadyComplete && (
                <span className="flex items-center gap-1 text-xs text-emerald-400/80">
                  <CheckCircle className="h-3 w-3" /> Done
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                <Clock className="h-3.5 w-3.5" />
                {lesson.estimatedMinutes} min
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-3xl px-4 py-8 lg:px-10 lg:py-10">
          <h1 className="mb-8 text-2xl font-bold text-white lg:text-3xl">{lesson.title}</h1>
          <LessonRenderer
            content={lesson.content}
            onComplete={onComplete}
            completing={completing}
            alreadyComplete={alreadyComplete}
          />

          {/* Prev / Next navigation */}
          {(prevLesson || nextLesson) && (
            <div className="mt-10 flex items-center justify-between gap-4 border-t border-slate-800/60 pt-6">
              {prevLesson ? (
                <Link
                  to={`/courses/${courseId}/lessons/${prevLesson.id}`}
                  className="group flex max-w-[44%] items-center gap-2 rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3 text-left transition hover:border-violet-500/30 hover:bg-slate-900/70"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0 text-slate-600 group-hover:text-violet-400 transition" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-slate-600">Previous</p>
                    <p className="truncate text-sm font-medium text-slate-300 group-hover:text-white transition">{prevLesson.title}</p>
                  </div>
                </Link>
              ) : <div />}

              {nextLesson ? (
                <Link
                  to={`/courses/${courseId}/lessons/${nextLesson.id}`}
                  className="group ml-auto flex max-w-[44%] items-center gap-2 rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3 text-right transition hover:border-violet-500/30 hover:bg-slate-900/70"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-slate-600">Next</p>
                    <p className="truncate text-sm font-medium text-slate-300 group-hover:text-white transition">{nextLesson.title}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 group-hover:text-violet-400 transition" />
                </Link>
              ) : (
                <Link
                  to={`/courses/${courseId}`}
                  className="group ml-auto flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 transition hover:border-emerald-400/50 hover:bg-emerald-500/15"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-emerald-600">Finished</p>
                    <p className="text-sm font-medium text-emerald-300 group-hover:text-emerald-200 transition">Back to course</p>
                  </div>
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500 group-hover:text-emerald-400 transition" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

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
