import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Flame,
  GraduationCap,
  ScrollText,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Star,
  Sword,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { TAXONOMY } from '../data/taxonomy';
import { cn } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import { rankProgressInfo, XP_REWARDS } from '../lib/xpUtils';
import type { Course, LeaderboardEntry, UserProfile } from '@study-guild/shared';

interface CourseProgress {
  course: Course;
  completedCount: number;
  totalLessons: number;
  completedLessonIds: string[];
}

interface DailyLoginResult {
  alreadyClaimed: boolean;
  xpAwarded: number;
  streak: number;
}

type IconComponent = typeof Trophy;

const DIFFICULTY_STYLES = {
  beginner: {
    label: 'Novice',
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    accent: 'text-emerald-500',
  },
  intermediate: {
    label: 'Adept',
    classes: 'border-amber-200 bg-amber-50 text-amber-700',
    accent: 'text-amber-500',
  },
  advanced: {
    label: 'Heroic',
    classes: 'border-red-200 bg-red-50 text-red-700',
    accent: 'text-red-500',
  },
} as const;

export default function HomePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const dailyLoginStarted = useRef(false);

  const dailyLoginMutation = useMutation({
    mutationFn: () => apiClient.post<{ data: DailyLoginResult }>('/progress/daily-login'),
    onSuccess: (res) => {
      const data = res.data.data;
      if (!data.alreadyClaimed) {
        qc.invalidateQueries({ queryKey: ['me'] });
        toast.success(`+${data.xpAwarded} XP earned`, `Day ${data.streak} streak`);
      }
    },
  });

  useEffect(() => {
    if (dailyLoginStarted.current) return;
    dailyLoginStarted.current = true;
    dailyLoginMutation.mutate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: user } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get<{ data: UserProfile }>('/users/me')).data.data,
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['courses', 'featured'],
    queryFn: async () => (await apiClient.get<{ data: Course[] }>('/courses')).data.data,
  });

  const { data: courseProgress } = useQuery<CourseProgress[]>({
    queryKey: ['my-progress'],
    queryFn: async () => (await apiClient.get<{ data: CourseProgress[] }>('/users/me/progress')).data.data,
  });

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => (await apiClient.get<{ data: LeaderboardEntry[] }>('/leaderboard')).data.data,
    select: (data) => data.slice(0, 5),
  });

  const progressList = courseProgress ?? [];
  const inProgress = progressList.filter(c => c.completedCount > 0 && c.completedCount < c.totalLessons);
  const completedCourses = progressList.filter(c => c.completedCount >= c.totalLessons && c.totalLessons > 0);
  const totalLessonsCompleted = progressList.reduce((s, p) => s + p.completedCount, 0);
  const startedCourseIds = new Set(progressList.map(p => p.course.id));
  const activeTaxonomies = new Set(inProgress.map(p => p.course.taxonomy.l1));
  const totalLearningMinutes = courses?.reduce((sum, course) => sum + course.estimatedMinutes, 0) ?? 0;
  const totalLearningHours = Math.max(1, Math.round(totalLearningMinutes / 60));

  const [bookmarkedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('sg-bookmarks') ?? '[]')); }
    catch { return new Set(); }
  });
  const savedCourses = courses?.filter(c => bookmarkedIds.has(c.id)) ?? [];

  const topRated = courses
    ? [...courses]
        .sort((a, b) => (b.ratingAverage * Math.log(b.ratingCount + 1)) - (a.ratingAverage * Math.log(a.ratingCount + 1)))
        .slice(0, 4)
    : [];

  const topicalRecommendations = courses && activeTaxonomies.size > 0
    ? courses.filter(c => activeTaxonomies.has(c.taxonomy.l1) && !startedCourseIds.has(c.id))
    : [];

  const featured = courses
    ? Object.values(
        courses.reduce((acc, c) => {
          if (!acc[c.taxonomy.l1]) acc[c.taxonomy.l1] = c;
          return acc;
        }, {} as Record<string, Course>)
      ).slice(0, 6)
    : [];

  const recommended = (topicalRecommendations.length > 0
    ? topicalRecommendations
    : topRated.filter(c => !startedCourseIds.has(c.id))
  ).slice(0, 3);
  const recommendedContracts = recommended.length > 0 ? recommended : featured.slice(0, 3);

  const userXp = user?.xp ?? 0;
  const rankInfo = rankProgressInfo(userXp);
  const firstName = user?.displayName?.split(' ')[0] ?? 'Guildmate';
  const dailyLogin = dailyLoginMutation.data?.data.data;
  const primaryProgress = inProgress[0];
  const primaryContract = primaryProgress?.course ?? recommendedContracts[0] ?? featured[0];

  function handleSurpriseMe() {
    if (!courses || courses.length === 0) return;
    const completedIds = new Set(completedCourses.map(c => c.course.id));
    const inProgressIds = new Set(inProgress.map(c => c.course.id));
    const pool = courses.filter(c => inProgressIds.has(c.id) || (!completedIds.has(c.id) && !startedCourseIds.has(c.id)));
    const pick = pickSurpriseCourse(pool, courses);
    const cp = courseProgress?.find(p => p.course.id === pick.id);
    const completedSet = new Set(cp?.completedLessonIds ?? []);
    const firstIncompleteLesson = pick.lessonIds.find(id => !completedSet.has(id));
    if (firstIncompleteLesson) {
      toast.info('A new quest appears', pick.title);
      navigate(`/courses/${pick.id}/lessons/${firstIncompleteLesson}`);
    } else {
      navigate(`/courses/${pick.id}`);
    }
  }

  return (
    <div className="min-h-full overflow-hidden bg-slate-50 text-slate-900">
      <section className="relative isolate overflow-hidden border-b border-slate-900 bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.42),transparent_32%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.28),transparent_30%),linear-gradient(135deg,#020617_0%,#111827_55%,#1e1b4b_100%)]" />
        <div className="absolute inset-0 opacity-30 dot-pattern" />
        <div className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-10 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative px-4 py-8 lg:px-10 lg:py-10">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-violet-100 shadow-lg shadow-violet-950/20 backdrop-blur">
              <Sword className="h-3.5 w-3.5 text-amber-300" />
              Guild Hall
            </div>
            <div className="flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-medium text-amber-100">
              <Flame className="h-3.5 w-3.5 text-amber-300" />
              {user?.streak ?? dailyLogin?.streak ?? 0} day streak
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
            <div>
              <div className="mb-6 max-w-4xl">
                <p className="mb-3 text-sm font-medium text-violet-200">Welcome back, {firstName}</p>
                <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Ready the next quest.
                  <span className="block text-gradient-gold">Raise your rank.</span>
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 lg:text-lg">
                  Your guild hall now tracks your rank, active quests, daily momentum, and the best contracts to pick up next.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <RankProgressPanel user={user} rankInfo={rankInfo} />
                <div className="grid grid-cols-2 gap-3">
                  <HeroMetric icon={BookOpen} label="Lessons cleared" value={totalLessonsCompleted} />
                  <HeroMetric icon={GraduationCap} label="Active quests" value={inProgress.length} />
                  <HeroMetric icon={CheckCircle2} label="Courses mastered" value={completedCourses.length} />
                  <HeroMetric icon={Compass} label="Guild library" value={`${totalLearningHours}h`} />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {primaryProgress ? (
                  <Link
                    to={getResumePath(primaryProgress)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:from-amber-400 hover:to-orange-400"
                  >
                    Continue main quest
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:from-amber-400 hover:to-orange-400"
                  >
                    Find your first quest
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <button
                  onClick={handleSurpriseMe}
                  disabled={!courses}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-violet-300/50 hover:bg-white/15 disabled:opacity-40"
                  title="Pick a random lesson for me"
                >
                  <Shuffle className="h-4 w-4" />
                  Surprise me
                </button>
                <Link
                  to="/leaderboard"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-300/40 hover:text-white"
                >
                  <Trophy className="h-4 w-4 text-amber-300" />
                  View ranks
                </Link>
              </div>
            </div>

            <DailyQuestCard
              primaryContract={primaryContract}
              primaryProgress={primaryProgress}
              dailyLogin={dailyLogin}
              checkingDaily={dailyLoginMutation.isPending}
            />
          </div>
        </div>
      </section>

      <div className="px-4 py-8 lg:px-10 lg:py-10">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-8">
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Trophy} color="amber" label="Guild rank" value={user?.rank ?? rankInfo.rank} />
              <StatCard icon={Zap} color="violet" label="Total XP" value={userXp.toLocaleString()} />
              <StatCard icon={BookOpen} color="emerald" label="Lessons done" value={totalLessonsCompleted} />
              <StatCard icon={ShieldCheck} color="sky" label="Saved quests" value={savedCourses.length} />
            </section>

            {primaryProgress ? (
              <JumpBackInCard cp={primaryProgress} />
            ) : (
              <FirstQuestCard course={recommendedContracts[0] ?? featured[0]} />
            )}

            {inProgress.length > 1 && (
              <section>
                <SectionHeading
                  eyebrow="Quest log"
                  title="Also in progress"
                  action={<Link to="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 transition hover:text-violet-700">All progress <ArrowRight className="h-3.5 w-3.5" /></Link>}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {inProgress.slice(1, 5).map(cp => (
                    <CompactProgressCard key={cp.course.id} cp={cp} />
                  ))}
                </div>
              </section>
            )}

            {recommendedContracts.length > 0 && (
              <section>
                <SectionHeading
                  eyebrow="Open contracts"
                  title="Recommended next"
                  description={activeTaxonomies.size > 0 ? 'Matched to the topics you are already studying.' : 'High-rated quests to start your journey.'}
                  action={<Link to="/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 transition hover:text-violet-700">Browse all <ArrowRight className="h-3.5 w-3.5" /></Link>}
                />
                <div className="grid gap-4 lg:grid-cols-3">
                  {recommendedContracts.map(course => (
                    <ContractCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            )}

            {completedCourses.length > 0 && (
              <section>
                <SectionHeading
                  eyebrow="Victory shelf"
                  title="Recently mastered"
                  action={<Link to="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 transition hover:text-violet-700">View profile <ArrowRight className="h-3.5 w-3.5" /></Link>}
                />
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                  {completedCourses.slice(0, 6).map(cp => (
                    <CompletedBadge key={cp.course.id} cp={cp} />
                  ))}
                </div>
              </section>
            )}

            {featured.length > 0 && (
              <section>
                <SectionHeading
                  eyebrow="Guild wings"
                  title="Explore by discipline"
                  action={<Link to="/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 transition hover:text-violet-700">Quest board <ArrowRight className="h-3.5 w-3.5" /></Link>}
                />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map(course => (
                    <TopicWingCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className="space-y-5">
            <AchievementVault achievements={user?.achievements ?? []} />
            {savedCourses.length > 0 && <SavedContracts courses={savedCourses.slice(0, 3)} />}
            {leaderboard && leaderboard.length > 0 && <LeaderboardPanel entries={leaderboard} currentUserId={user?.id} />}
            <DevTipCard />
          </aside>
        </div>
      </div>
    </div>
  );
}

function RankProgressPanel({ user, rankInfo }: {
  user?: UserProfile;
  rankInfo: ReturnType<typeof rankProgressInfo>;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-violet-950/30 backdrop-blur">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-400/20 blur-2xl" />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-200">Current rank</p>
            <h2 className="mt-1 font-display text-3xl font-bold text-white">{user?.rank ?? rankInfo.rank}</h2>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10">
            <Trophy className="h-7 w-7 text-amber-300" />
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-200">{(user?.xp ?? 0).toLocaleString()} XP</span>
          {rankInfo.nextRank ? (
            <span className="text-slate-400">{rankInfo.pct}% to {rankInfo.nextRank}</span>
          ) : (
            <span className="text-amber-300">Max rank reached</span>
          )}
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-950/70 ring-1 ring-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-amber-300 shadow-lg shadow-violet-500/30 transition-all duration-700"
            style={{ width: `${rankInfo.pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ icon: Icon, label, value }: { icon: IconComponent; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
      <Icon className="mb-4 h-5 w-5 text-violet-200" />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}

function DailyQuestCard({ primaryContract, primaryProgress, dailyLogin, checkingDaily }: {
  primaryContract?: Course;
  primaryProgress?: CourseProgress;
  dailyLogin?: DailyLoginResult;
  checkingDaily: boolean;
}) {
  const href = primaryProgress ? getResumePath(primaryProgress) : primaryContract ? `/courses/${primaryContract.id}` : '/courses';
  const progressPct = primaryProgress ? getProgressPct(primaryProgress) : 0;
  const loginCopy = checkingDaily
    ? 'Checking today\'s guild ledger...'
    : dailyLogin?.alreadyClaimed
    ? 'Daily check-in already claimed'
    : dailyLogin
    ? `Daily check-in claimed: +${dailyLogin.xpAwarded} XP`
    : `Daily check-in awards +${XP_REWARDS.daily_login} XP`;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-300/15 via-white/[0.08] to-violet-400/10 p-5 shadow-2xl shadow-slate-950/30 backdrop-blur">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-300/20 blur-2xl" />
      <div className="relative">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950/40 ring-1 ring-white/10">
            <ScrollText className="h-5 w-5 text-amber-300" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">Today&apos;s contract</p>
            <p className="text-sm text-slate-300">{loginCopy}</p>
          </div>
        </div>

        {primaryContract ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-200">
              {primaryProgress ? 'Continue your main quest' : 'Recommended first quest'}
            </p>
            <h3 className="text-lg font-bold text-white">{primaryContract.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{primaryContract.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {primaryContract.totalLessons} lessons</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {primaryContract.estimatedMinutes}m</span>
              <span className="flex items-center gap-1 text-amber-200"><Zap className="h-3.5 w-3.5" /> +{XP_REWARDS.lesson_completed} XP next lesson</span>
            </div>
            {primaryProgress && (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs text-slate-400">
                  <span>{primaryProgress.completedCount}/{primaryProgress.totalLessons} lessons complete</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-violet-400" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}
            <Link
              to={href}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-100"
            >
              {primaryProgress ? 'Resume contract' : 'Accept contract'}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-300">
            The quest board is waiting for its first published course.
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, action }: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function JumpBackInCard({ cp }: { cp: CourseProgress }) {
  const { course, completedCount, totalLessons } = cp;
  const pct = getProgressPct(cp);
  const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);
  const CatIcon = cat?.icon ?? BookOpen;
  const remainingLessons = Math.max(0, totalLessons - completedCount);
  const avgMin = course.totalLessons > 0 ? Math.round(course.estimatedMinutes / course.totalLessons) : 0;
  const remainingMin = remainingLessons * avgMin;

  return (
    <Link
      to={getResumePath(cp)}
      className="group relative block overflow-hidden rounded-3xl border border-violet-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100"
    >
      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-violet-50 to-transparent opacity-80" />
      <div className="relative grid gap-5 lg:grid-cols-[88px_minmax(0,1fr)_auto] lg:items-center">
        <div className={cn('flex h-20 w-20 items-center justify-center rounded-3xl ring-1 ring-slate-900/5', cat?.bgColor ?? 'bg-slate-100')}>
          <CatIcon className={cn('h-9 w-9', cat?.color ?? 'text-slate-400')} />
        </div>
        <div className="min-w-0">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-500">
            <Sparkles className="h-3.5 w-3.5" />
            Continue your main quest
          </p>
          <h3 className="text-2xl font-bold text-slate-950 transition group-hover:text-violet-700">{course.title}</h3>
          <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-500">{course.description}</p>
          <div className="mt-4 max-w-xl">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
              <span>{completedCount} of {totalLessons} lessons complete</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
          {remainingMin > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              ~{remainingMin} min left
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-violet-700">
            Resume
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CompactProgressCard({ cp }: { cp: CourseProgress }) {
  const pct = getProgressPct(cp);
  const cat = TAXONOMY.find(c => c.l1 === cp.course.taxonomy.l1);
  const CatIcon = cat?.icon ?? BookOpen;

  return (
    <Link
      to={getResumePath(cp)}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
    >
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', cat?.bgColor ?? 'bg-slate-100')}>
        <CatIcon className={cn('h-5 w-5', cat?.color ?? 'text-slate-400')} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-violet-700">{cp.course.title}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-slate-400">{pct}%</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-violet-500" />
    </Link>
  );
}

function FirstQuestCard({ course }: { course?: Course }) {
  if (!course) return null;
  return (
    <section className="relative overflow-hidden rounded-3xl border border-dashed border-violet-300 bg-violet-50 p-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm">
        <Sword className="h-8 w-8 text-violet-600" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500">New adventurer</p>
      <h2 className="mt-1 text-2xl font-bold text-slate-950">Choose your first quest</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        Start with <span className="font-semibold text-slate-700">{course.title}</span>, or open the quest board to pick your own path.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link to={`/courses/${course.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500">
          Start recommended quest
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/courses" className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-white px-5 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50">
          Browse quest board
        </Link>
      </div>
    </section>
  );
}

function ContractCard({ course }: { course: Course }) {
  const diff = DIFFICULTY_STYLES[course.difficulty];
  const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);
  const CatIcon = cat?.icon ?? ScrollText;

  return (
    <Link
      to={`/courses/${course.id}`}
      className="group relative flex min-h-[250px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100"
    >
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-amber-50 transition group-hover:bg-amber-100" />
      <div className="relative mb-5 flex items-start justify-between gap-3">
        <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-slate-900/5', cat?.bgColor ?? 'bg-slate-100')}>
          <CatIcon className={cn('h-6 w-6', cat?.color ?? 'text-slate-400')} />
        </span>
        <span className={cn('rounded-full border px-2.5 py-1 text-xs font-bold', diff.classes)}>
          {diff.label}
        </span>
      </div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{course.taxonomy.l1} / {course.taxonomy.l2}</p>
      <h3 className="text-lg font-bold leading-snug text-slate-950 transition group-hover:text-amber-700">{course.title}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-500">{course.description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {course.totalLessons}</span>
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.estimatedMinutes}m</span>
        {course.ratingCount > 0 && (
          <span className="ml-auto flex items-center gap-1 font-semibold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {course.ratingAverage.toFixed(1)}
          </span>
        )}
      </div>
    </Link>
  );
}

function TopicWingCard({ course }: { course: Course }) {
  const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);
  const CatIcon = cat?.icon ?? Compass;
  return (
    <Link
      to={`/courses?l1=${encodeURIComponent(course.taxonomy.l1)}`}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', cat?.bgColor ?? 'bg-slate-100')}>
        <CatIcon className={cn('h-6 w-6', cat?.color ?? 'text-slate-400')} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900 group-hover:text-violet-700">{cat?.label ?? course.taxonomy.l1}</p>
        <p className="truncate text-xs text-slate-500">{course.title}</p>
      </div>
    </Link>
  );
}

function CompletedBadge({ cp }: { cp: CourseProgress }) {
  const cat = TAXONOMY.find(c => c.l1 === cp.course.taxonomy.l1);
  const CatIcon = cat?.icon ?? Trophy;
  return (
    <Link
      to={`/courses/${cp.course.id}`}
      className="group flex min-w-[220px] flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100"
    >
      <div className="flex items-center gap-2">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', cat?.bgColor ?? 'bg-white')}>
          <CatIcon className={cn('h-4.5 w-4.5', cat?.color ?? 'text-emerald-600')} style={{ height: 18, width: 18 }} />
        </span>
        <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" />
      </div>
      <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-800 group-hover:text-slate-950">{cp.course.title}</p>
      <p className="text-xs font-semibold text-emerald-700">{cp.totalLessons} lessons mastered</p>
    </Link>
  );
}

function SavedContracts({ courses }: { courses: Course[] }) {
  return (
    <section className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-500">Pinned</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">Saved contracts</h2>
        </div>
        <Bookmark className="h-5 w-5 fill-amber-400 text-amber-500" />
      </div>
      <div className="space-y-2">
        {courses.map(course => (
          <Link key={course.id} to={`/courses/${course.id}`} className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-amber-200 hover:bg-amber-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-xs font-bold text-amber-600">{course.title.charAt(0)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-amber-700">{course.title}</p>
              <p className="text-xs text-slate-500">{course.taxonomy.l1}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function AchievementVault({ achievements }: { achievements: string[] }) {
  const slots = Math.max(5, Math.min(8, achievements.length + 2));
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500">Vault</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">Achievement seals</h2>
        </div>
        <Award className="h-5 w-5 text-violet-500" />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: slots }).map((_, i) => {
          const unlocked = i < achievements.length;
          return (
            <div
              key={i}
              className={cn(
                'flex aspect-square items-center justify-center rounded-2xl border text-lg',
                unlocked
                  ? 'border-amber-200 bg-amber-50 text-amber-500 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-300'
              )}
              title={unlocked ? 'Achievement unlocked' : 'Locked achievement'}
            >
              {unlocked ? <Trophy className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-slate-500">
        <span className="font-semibold text-slate-800">{achievements.length}</span> seal{achievements.length !== 1 ? 's' : ''} unlocked. Complete lessons, ace quizzes, and keep streaks alive to fill the vault.
      </p>
    </section>
  );
}

function LeaderboardPanel({ entries, currentUserId }: { entries: LeaderboardEntry[]; currentUserId?: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-500">Hall of fame</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">Top learners</h2>
        </div>
        <Link to="/leaderboard" className="text-xs font-semibold text-violet-600 transition hover:text-violet-700">Full ranks</Link>
      </div>
      <div className="space-y-2">
        {entries.map(entry => {
          const isCurrent = entry.isCurrentUser || entry.userId === currentUserId;
          return (
            <div
              key={entry.userId}
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-3 py-2.5',
                isCurrent ? 'border-violet-200 bg-violet-50' : 'border-slate-100 bg-slate-50'
              )}
            >
              <span className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                entry.position === 1 ? 'bg-amber-500 text-white' :
                entry.position === 2 ? 'bg-slate-200 text-slate-700' :
                entry.position === 3 ? 'bg-orange-200 text-orange-800' :
                'bg-white text-slate-500'
              )}>
                {entry.position}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-xs font-bold text-slate-600 shadow-sm">
                {entry.displayName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm font-semibold', isCurrent ? 'text-violet-700' : 'text-slate-800')}>
                  {entry.displayName}
                  {isCurrent && <span className="ml-1.5 text-[10px] text-violet-500">you</span>}
                </p>
                <p className="text-xs text-slate-500">{entry.guildRank}</p>
              </div>
              <span className="text-xs font-bold text-violet-600">{entry.xp.toLocaleString()} XP</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, color, label, value }: {
  icon: IconComponent;
  color: 'amber' | 'violet' | 'emerald' | 'sky';
  label: string;
  value: string | number;
}) {
  const colors = {
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'text-amber-600' },
    violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  icon: 'text-violet-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600' },
    sky:     { bg: 'bg-sky-50',     border: 'border-sky-200',     icon: 'text-sky-600' },
  }[color];

  return (
    <div className={cn('rounded-3xl border p-4 shadow-sm', colors.border, colors.bg)}>
      <Icon className={cn('mb-4 h-5 w-5', colors.icon)} />
      <p className="text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

const DEV_TIPS = [
  { tip: 'Measure before you optimise. A profiler shows where time is actually spent — intuition is usually wrong.', tag: 'Performance' },
  { tip: 'Write the test first, even just the test name. It forces you to clarify what the code should do before writing it.', tag: 'Testing' },
  { tip: 'Commits should answer "why", not "what". The diff already shows what changed — the message explains the reason.', tag: 'Git' },
  { tip: 'Every index on a table speeds up reads and slows down writes. Add indexes based on your actual query patterns.', tag: 'Databases' },
  { tip: 'p99 latency matters more than averages. One slow request in 100 is a bad user experience, not a rounding error.', tag: 'Observability' },
  { tip: 'A function that does one thing is easier to name, test, and reuse. If "and" appears in the name, split it.', tag: 'Code quality' },
  { tip: 'Error messages should help the caller fix the problem. "Invalid input" is useless; "username must be 3-20 chars" is helpful.', tag: 'UX' },
  { tip: 'Short-lived feature flags are useful; long-lived ones become tech debt. Set a deletion date when you create one.', tag: 'Engineering' },
  { tip: 'Review your own PR before asking others. You will catch 30% of issues in 5 minutes of self-review.', tag: 'Code review' },
  { tip: 'JWTs are not encrypted by default. Never put secrets in the payload without using JWE.', tag: 'Security' },
];

function DevTipCard() {
  const [dayOfYear] = useState(() => {
    const now = new Date();
    return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
  });
  const [offset, setOffset] = useState(0);
  const idx = (dayOfYear + offset) % DEV_TIPS.length;
  const tip = DEV_TIPS[idx];

  return (
    <section className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
          <Target className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-600">Mentor note</p>
          <p className="text-xs text-slate-500">{tip.tag}</p>
        </div>
        <button
          onClick={() => setOffset(o => (o + 1) % DEV_TIPS.length)}
          className="ml-auto rounded-xl p-2 text-cyan-500 transition hover:bg-cyan-100 hover:text-cyan-700"
          title="Next tip"
        >
          <Shuffle className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-sm leading-6 text-slate-700">{tip.tip}</p>
    </section>
  );
}

function getResumePath(cp: CourseProgress) {
  const done = new Set(cp.completedLessonIds);
  const nextLessonId = cp.course.lessonIds.find(id => !done.has(id));
  return nextLessonId ? `/courses/${cp.course.id}/lessons/${nextLessonId}` : `/courses/${cp.course.id}`;
}

function getProgressPct(cp: CourseProgress) {
  return cp.totalLessons > 0 ? Math.round((cp.completedCount / cp.totalLessons) * 100) : 0;
}

function pickSurpriseCourse(pool: Course[], courses: Course[]) {
  const candidates = pool.length > 0 ? pool : courses;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
