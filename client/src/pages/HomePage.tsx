import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Flame, Trophy, ArrowRight, Clock, Star, Gift, CheckCircle2, Shuffle, Bookmark } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { TAXONOMY } from '../data/taxonomy';
import { cn } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';
import type { UserProfile, Course } from '@study-guild/shared';
import type { LeaderboardEntry } from '@study-guild/shared';

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

export default function HomePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [loginClaimed, setLoginClaimed] = useState<DailyLoginResult | null>(null);

  const dailyLoginMutation = useMutation({
    mutationFn: () => apiClient.post<{ data: DailyLoginResult }>('/progress/daily-login'),
    onSuccess: (res) => {
      const data = res.data.data;
      setLoginClaimed(data);
      if (!data.alreadyClaimed) {
        qc.invalidateQueries({ queryKey: ['me'] });
        toast.success(`+${data.xpAwarded} XP claimed!`, `🔥 ${data.streak}-day streak — keep it going`);
      } else {
        toast.info('Already claimed today', 'Come back tomorrow for more XP');
      }
    },
  });

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

  const inProgress = courseProgress?.filter(c => c.completedCount > 0 && c.completedCount < c.totalLessons) ?? [];
  const completedCourses = courseProgress?.filter(c => c.completedCount >= c.totalLessons && c.totalLessons > 0) ?? [];
  const totalLessonsCompleted = courseProgress?.reduce((s, p) => s + p.completedCount, 0) ?? 0;
  const completedIdSet = (cp: CourseProgress) => new Set(cp.completedLessonIds);
  const startedCourseIds = new Set(courseProgress?.map(p => p.course.id) ?? []);

  const activeTaxonomies = new Set(inProgress.map(p => p.course.taxonomy.l1));

  const [bookmarkedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('sg-bookmarks') ?? '[]')); }
    catch { return new Set(); }
  });
  const savedCourses = courses?.filter(c => bookmarkedIds.has(c.id)) ?? [];

  const recommended = courses && activeTaxonomies.size > 0
    ? courses
        .filter(c => activeTaxonomies.has(c.taxonomy.l1) && !startedCourseIds.has(c.id))
        .slice(0, 3)
    : [];

  const featured = courses
    ? Object.values(
        courses.reduce((acc, c) => {
          if (!acc[c.taxonomy.l1]) acc[c.taxonomy.l1] = c;
          return acc;
        }, {} as Record<string, Course>)
      ).slice(0, 6)
    : [];

  const handleSurpriseMe = useCallback(() => {
    if (!courses || courses.length === 0) return;
    const completedIds = new Set(completedCourses.map(c => c.course.id));
    const inProgressIds = new Set(inProgress.map(c => c.course.id));
    const pool = courses.filter(c => inProgressIds.has(c.id) || (!completedIds.has(c.id) && !startedCourseIds.has(c.id)));
    const pick = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : courses[Math.floor(Math.random() * courses.length)];
    const cp = courseProgress?.find(p => p.course.id === pick.id);
    const completedSet = new Set(cp?.completedLessonIds ?? []);
    const firstIncompleteLesson = pick.lessonIds.find(id => !completedSet.has(id));
    if (firstIncompleteLesson) {
      toast.info(`Surprise! Let's learn...`, pick.title);
      navigate(`/courses/${pick.id}/lessons/${firstIncompleteLesson}`);
    } else {
      navigate(`/courses/${pick.id}`);
    }
  }, [courses, courseProgress, completedCourses, inProgress, startedCourseIds, navigate, toast]);

  return (
    <div className="min-h-full">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white px-4 py-10 lg:px-10 lg:py-14">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-violet-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-64 w-64 rounded-full bg-amber-100/30 blur-3xl" />

        <div className="relative max-w-4xl">
          {(user?.streak ?? 0) > 0 && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
              <Flame className="h-3 w-3" />
              {user?.streak}-day streak — keep it going!
            </div>
          )}
          <h1 className="mb-3 font-display text-3xl font-bold text-slate-900 lg:text-5xl">
            Welcome back,{' '}
            <span className="text-gradient">{user?.displayName?.split(' ')[0] ?? 'Guildmate'}</span>
          </h1>
          <p className="mb-8 max-w-lg text-base text-slate-500 lg:text-lg">
            {totalLessonsCompleted > 0
              ? `You've completed ${totalLessonsCompleted} lesson${totalLessonsCompleted !== 1 ? 's' : ''}. Keep the momentum going.`
              : 'Pick a course and start learning with your guild.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:from-violet-500 hover:to-violet-400"
            >
              <BookOpen className="h-4 w-4" />
              Browse courses
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={handleSurpriseMe}
              disabled={!courses}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-40"
              title="Pick a random lesson for me"
            >
              <Shuffle className="h-4 w-4" />
              Surprise me
            </button>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              View profile
            </Link>
          </div>
        </div>
      </section>

      <div className="px-4 py-8 lg:px-10 lg:py-10 space-y-10">
        {/* Stats row */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Trophy} color="amber" label="Guild Rank" value={user?.rank ?? '—'} />
          <StatCard icon={Flame} color="orange" label="Day Streak" value={`${user?.streak ?? 0} days`} />
          <StatCard icon={BookOpen} color="emerald" label="Lessons done" value={totalLessonsCompleted} />
          <StatCard icon={Trophy} color="violet" label="Completed" value={completedCourses.length} />
        </section>

        {/* New user onboarding */}
        {courseProgress !== undefined && courseProgress.length === 0 && (
          <section className="rounded-2xl border border-dashed border-violet-300 bg-violet-50 p-6 text-center">
            <div className="mb-3 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
                <BookOpen className="h-7 w-7 text-violet-600" />
              </div>
            </div>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Start your first course</h2>
            <p className="mb-5 text-sm text-slate-500 max-w-xs mx-auto">
              Pick a topic you're curious about and learn alongside your guild.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition"
            >
              <BookOpen className="h-4 w-4" />
              Browse courses
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}

        {/* Daily login XP */}
        {user && !loginClaimed && (
          <section>
            <button
              onClick={() => dailyLoginMutation.mutate()}
              disabled={dailyLoginMutation.isPending}
              className="group flex w-full items-center gap-4 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-left transition-all hover:border-violet-300 hover:bg-violet-100 disabled:opacity-60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 transition group-hover:bg-violet-200">
                <Gift className="h-5 w-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-violet-700">Claim your daily XP</p>
                <p className="text-xs text-slate-500">+5 XP · Extends your streak</p>
              </div>
              <span className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                {dailyLoginMutation.isPending ? 'Claiming…' : '+5 XP'}
              </span>
            </button>
          </section>
        )}

        {/* Daily login claimed confirmation */}
        {loginClaimed && (
          <section>
            <div className={cn(
              'flex items-center gap-4 rounded-2xl border px-5 py-4',
              loginClaimed.alreadyClaimed
                ? 'border-slate-200 bg-slate-50'
                : 'border-emerald-200 bg-emerald-50'
            )}>
              <CheckCircle2 className={cn('h-5 w-5 shrink-0', loginClaimed.alreadyClaimed ? 'text-slate-400' : 'text-emerald-600')} />
              <div>
                <p className={cn('text-sm font-medium', loginClaimed.alreadyClaimed ? 'text-slate-500' : 'text-emerald-700')}>
                  {loginClaimed.alreadyClaimed ? 'Already claimed today' : `+${loginClaimed.xpAwarded} XP claimed!`}
                </p>
                <p className="text-xs text-slate-400">{loginClaimed.streak}-day streak · Come back tomorrow</p>
              </div>
            </div>
          </section>
        )}

        {/* Continue Learning */}
        {inProgress.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Continue Learning</h2>
              <Link to="/profile" className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition">
                All progress <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {inProgress.slice(0, 2).map((cp) => {
                const { course, completedCount, totalLessons } = cp;
                const pct = Math.round((completedCount / totalLessons) * 100);
                const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);
                const done = completedIdSet(cp);
                const nextLessonId = course.lessonIds.find(id => !done.has(id));
                const to = nextLessonId ? `/courses/${course.id}/lessons/${nextLessonId}` : `/courses/${course.id}`;
                return (
                  <Link
                    key={course.id}
                    to={to}
                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-violet-300 hover:bg-violet-50 shadow-sm"
                  >
                    <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl', cat?.bgColor ?? 'bg-slate-100')}>
                      {cat ? <cat.icon className={cn('h-6 w-6', cat.color)} /> : <BookOpen className="h-6 w-6 text-slate-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 group-hover:text-violet-700 transition">{course.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 tabular-nums">{completedCount}/{totalLessons}</span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700 group-hover:bg-violet-100 transition">
                      Resume
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Completed courses */}
        {completedCourses.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Trophy className="h-4 w-4 text-amber-500" />
                Completed
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {completedCourses.length}
                </span>
              </h2>
              <Link to="/profile" className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
              {completedCourses.slice(0, 6).map(cp => {
                const cat = TAXONOMY.find(c => c.l1 === cp.course.taxonomy.l1);
                return (
                  <Link
                    key={cp.course.id}
                    to={`/courses/${cp.course.id}`}
                    className="group flex min-w-[200px] max-w-[220px] flex-col gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-100 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cat?.bgColor ?? 'bg-slate-100')}>
                        {cat ? <cat.icon className={cn('h-4 w-4', cat.color)} /> : <BookOpen className="h-4 w-4 text-slate-400" />}
                      </div>
                      <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-600" />
                    </div>
                    <p className="line-clamp-2 text-xs font-medium text-slate-700 group-hover:text-slate-900 leading-snug">
                      {cp.course.title}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium">{cp.totalLessons} lessons · done</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Saved for later */}
        {savedCourses.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Bookmark className="h-4 w-4 text-amber-500 fill-amber-400" />
                Saved for later
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {savedCourses.length}
                </span>
              </h2>
              <Link to="/courses?saved=1" className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition">
                View all saved <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedCourses.slice(0, 3).map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}

        {/* Recommended for you */}
        {recommended.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recommended for you</h2>
                <p className="text-xs text-slate-400 mt-0.5">Based on what you're learning</p>
              </div>
              <Link to="/courses" className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 transition">
                Browse all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}

        {/* Featured courses */}
        {featured.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Explore topics</h2>
              <Link to="/courses" className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 transition">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}

        {/* Dev tip of the day */}
        <DevTipCard />

        {/* Top learners mini-leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Trophy className="h-4 w-4 text-amber-500" />
                Top learners
              </h2>
              <Link to="/leaderboard" className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition">
                Full leaderboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden shadow-sm">
              {leaderboard.map(entry => (
                <div
                  key={entry.userId}
                  className={cn(
                    'flex items-center gap-4 px-5 py-3',
                    entry.isCurrentUser && 'bg-violet-50'
                  )}
                >
                  <span className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    entry.position === 1 ? 'bg-amber-100 text-amber-700' :
                    entry.position === 2 ? 'bg-slate-100 text-slate-600' :
                    entry.position === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-400'
                  )}>
                    {entry.position}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {entry.displayName.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', entry.isCurrentUser ? 'text-violet-700' : 'text-slate-800')}>
                      {entry.displayName}
                      {entry.isCurrentUser && <span className="ml-1.5 text-[10px] text-violet-500">you</span>}
                    </p>
                    <p className="text-xs text-slate-400">{entry.guildRank}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-violet-600 tabular-nums">
                    {entry.xp.toLocaleString()} XP
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
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
  { tip: 'Error messages should help the caller fix the problem. "Invalid input" is useless; "username must be 3–20 chars" is helpful.', tag: 'UX' },
  { tip: 'Short-lived feature flags are useful; long-lived ones become tech debt. Set a deletion date when you create one.', tag: 'Engineering' },
  { tip: 'Review your own PR before asking others. You\'ll catch 30% of issues in 5 minutes of self-review.', tag: 'Code review' },
  { tip: 'The most dangerous phrase in tech is "it works on my machine". Reproducible builds start with pinned dependencies.', tag: 'DevOps' },
  { tip: 'JWTs aren\'t encrypted by default — they\'re base64-encoded. Never put secrets in the payload without using JWE.', tag: 'Security' },
  { tip: 'Validate at the boundary, trust internally. You don\'t need to re-validate data inside a service you wrote.', tag: 'Architecture' },
  { tip: 'A retry without exponential back-off can make an outage worse. Add jitter to prevent thundering herd.', tag: 'Reliability' },
  { tip: 'TypeScript\'s `unknown` is safer than `any`. It forces you to narrow the type before using it.', tag: 'TypeScript' },
  { tip: 'React renders are cheap. If you\'re over-optimising with useMemo everywhere, measure first.', tag: 'React' },
  { tip: 'HTTP 409 Conflict is more accurate than 400 when the request is valid but conflicts with server state.', tag: 'APIs' },
  { tip: 'Cache invalidation is hard because you\'re trying to predict the future. Use short TTLs and stale-while-revalidate.', tag: 'Caching' },
  { tip: 'chmod 777 on a production file is never the solution. Understand permissions — it takes 10 minutes.', tag: 'Linux' },
  { tip: 'The second system is always over-engineered. Build the simplest thing that works, refactor when you understand the problem.', tag: 'Architecture' },
  { tip: 'SQL\'s EXPLAIN ANALYZE shows what the query planner actually does — not what you hoped it would do.', tag: 'Databases' },
];

function DevTipCard() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
  const tip = DEV_TIPS[dayOfYear % DEV_TIPS.length];
  return (
    <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-base">💡</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-700">Dev tip of the day</span>
        <span className="ml-auto rounded-full border border-cyan-200 bg-white px-2 py-0.5 text-[10px] text-cyan-700">{tip.tag}</span>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{tip.tip}</p>
    </section>
  );
}

function StatCard({ icon: Icon, color, label, value }: {
  icon: typeof Trophy; color: 'amber' | 'violet' | 'orange' | 'emerald'; label: string; value: string | number;
}) {
  const colors = {
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'text-amber-600' },
    violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  icon: 'text-violet-600' },
    orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  icon: 'text-orange-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600' },
  }[color];

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-4 shadow-sm`}>
      <Icon className={`mb-3 h-5 w-5 ${colors.icon}`} />
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const difficultyColor = {
    beginner:     'text-emerald-700 bg-emerald-50 border-emerald-200',
    intermediate: 'text-amber-700 bg-amber-50 border-amber-200',
    advanced:     'text-red-700 bg-red-50 border-red-200',
  }[course.difficulty];
  const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);

  return (
    <Link
      to={`/courses/${course.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100 hover:-translate-y-0.5 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-1.5 text-xs">
        {cat ? (
          <span className={cn('flex items-center gap-1 rounded-lg px-2 py-1 font-medium', cat.bgColor, cat.color)}>
            <cat.icon className="h-3 w-3" />
            {course.taxonomy.l1}
          </span>
        ) : (
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-500">{course.taxonomy.l1}</span>
        )}
        <span className="text-slate-300">›</span>
        <span className="text-slate-400">{course.taxonomy.l2}</span>
      </div>
      <h3 className="mb-2 font-semibold text-slate-900 transition-colors group-hover:text-violet-700">{course.title}</h3>
      <p className="mb-4 flex-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">{course.description}</p>
      <div className="flex items-center justify-between">
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${difficultyColor}`}>
          {course.difficulty}
        </span>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {course.ratingCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {course.ratingAverage.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {course.totalLessons}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.estimatedMinutes}m
          </span>
        </div>
      </div>
    </Link>
  );
}
