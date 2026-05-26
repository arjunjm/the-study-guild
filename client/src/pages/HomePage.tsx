import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Zap, Flame, Trophy, ArrowRight, Clock, Star, ChevronRight, Gift, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { TAXONOMY } from '../data/taxonomy';
import { cn } from '../lib/utils';
import type { UserProfile, Course } from '@study-guild/shared';
import { RANK_XP_THRESHOLDS } from '@study-guild/shared';
import type { LeaderboardEntry } from '@study-guild/shared';

const RANK_ORDER = Object.keys(RANK_XP_THRESHOLDS) as (keyof typeof RANK_XP_THRESHOLDS)[];

interface CourseProgress {
  course: Course;
  completedCount: number;
  totalLessons: number;
}

interface DailyLoginResult {
  alreadyClaimed: boolean;
  xpAwarded: number;
  streak: number;
}

export default function HomePage() {
  const qc = useQueryClient();
  const [loginClaimed, setLoginClaimed] = useState<DailyLoginResult | null>(null);

  const dailyLoginMutation = useMutation({
    mutationFn: () => apiClient.post<{ data: DailyLoginResult }>('/progress/daily-login'),
    onSuccess: (res) => {
      const data = res.data.data;
      setLoginClaimed(data);
      if (!data.alreadyClaimed) qc.invalidateQueries({ queryKey: ['me'] });
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

  const rankIdx = user ? RANK_ORDER.indexOf(user.rank as keyof typeof RANK_XP_THRESHOLDS) : 0;
  const nextRank = rankIdx < RANK_ORDER.length - 1 ? RANK_ORDER[rankIdx + 1] : null;
  const currThreshold = RANK_XP_THRESHOLDS[RANK_ORDER[rankIdx]];
  const nextThreshold = nextRank ? RANK_XP_THRESHOLDS[nextRank] : null;
  const rankPct = nextThreshold
    ? Math.min(100, Math.round(((user?.xp ?? 0) - currThreshold) / (nextThreshold - currThreshold) * 100))
    : 100;

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => (await apiClient.get<{ data: LeaderboardEntry[] }>('/leaderboard')).data.data,
    select: (data) => data.slice(0, 5),
  });

  const inProgress = courseProgress?.filter(c => c.completedCount > 0 && c.completedCount < c.totalLessons) ?? [];
  const startedCourseIds = new Set(courseProgress?.map(p => p.course.id) ?? []);

  // Categories the user is actively learning in (from in-progress courses)
  const activeTaxonomies = new Set(inProgress.map(p => p.course.taxonomy.l1));

  // Recommended: courses in the user's active taxonomies they haven't started, up to 3
  const recommended = courses && activeTaxonomies.size > 0
    ? courses
        .filter(c => activeTaxonomies.has(c.taxonomy.l1) && !startedCourseIds.has(c.id))
        .slice(0, 3)
    : [];

  // Per-category: how many courses has the user started?
  const startedPerCategory = courseProgress
    ? courseProgress.reduce((acc, p) => {
        const l1 = p.course.taxonomy.l1;
        acc[l1] = (acc[l1] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};

  // Pick one course per taxonomy category for diversity, up to 6
  const featured = courses
    ? Object.values(
        courses.reduce((acc, c) => {
          if (!acc[c.taxonomy.l1]) acc[c.taxonomy.l1] = c;
          return acc;
        }, {} as Record<string, Course>)
      ).slice(0, 6)
    : [];

  return (
    <div className="min-h-full">
      {/* Hero */}
      <section className="relative overflow-hidden mesh-bg dot-pattern border-b border-slate-800/60 px-4 py-10 lg:px-10 lg:py-14">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-64 w-64 rounded-full bg-amber-500/8 blur-3xl" />

        <div className="relative max-w-4xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1 text-xs font-medium text-amber-300">
            <Flame className="h-3 w-3" />
            {user?.streak ?? 0}-day streak — keep it going!
          </div>
          <h1 className="mb-3 font-display text-3xl font-bold text-white lg:text-5xl">
            Welcome back,{' '}
            <span className="text-gradient">{user?.displayName?.split(' ')[0] ?? 'Guildmate'}</span>
          </h1>
          <p className="mb-8 max-w-lg text-base text-slate-400 lg:text-lg">
            You're a{' '}
            <span className="font-semibold text-amber-400">{user?.rank ?? 'Initiate'}</span>. Keep learning and earn your next rank.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-500 hover:to-violet-400 hover:shadow-violet-500/40"
            >
              <BookOpen className="h-4 w-4" />
              Browse courses
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
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
          <StatCard icon={Zap} color="violet" label="Total XP" value={(user?.xp ?? 0).toLocaleString()} />
          <StatCard icon={Flame} color="orange" label="Day Streak" value={`${user?.streak ?? 0} days`} />
          <StatCard icon={BookOpen} color="emerald" label="Courses started" value={Object.values(startedPerCategory).reduce((a, b) => a + b, 0)} />
        </section>

        {/* Daily login XP */}
        {user && !loginClaimed && (
          <section>
            <button
              onClick={() => dailyLoginMutation.mutate()}
              disabled={dailyLoginMutation.isPending}
              className="group flex w-full items-center gap-4 rounded-2xl border border-violet-500/20 bg-violet-500/8 px-5 py-4 text-left transition-all hover:border-violet-500/35 hover:bg-violet-500/12 disabled:opacity-60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 transition group-hover:bg-violet-500/20">
                <Gift className="h-5 w-5 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-violet-300">Claim your daily XP</p>
                <p className="text-xs text-slate-500">+5 XP · Extends your streak</p>
              </div>
              <span className="shrink-0 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">
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
                ? 'border-slate-700/40 bg-slate-900/40'
                : 'border-emerald-500/25 bg-emerald-500/8'
            )}>
              <CheckCircle2 className={cn('h-5 w-5 shrink-0', loginClaimed.alreadyClaimed ? 'text-slate-600' : 'text-emerald-400')} />
              <div>
                <p className={cn('text-sm font-medium', loginClaimed.alreadyClaimed ? 'text-slate-500' : 'text-emerald-300')}>
                  {loginClaimed.alreadyClaimed ? 'Already claimed today' : `+${loginClaimed.xpAwarded} XP claimed!`}
                </p>
                <p className="text-xs text-slate-600">{loginClaimed.streak}-day streak · Come back tomorrow</p>
              </div>
            </div>
          </section>
        )}

        {/* Rank progress card */}
        {user && (
          <section className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Rank progress</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {nextRank ? `${(nextThreshold! - user.xp).toLocaleString()} XP until ${nextRank}` : 'Maximum rank reached!'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Current</p>
                <p className="font-display text-sm font-semibold text-amber-400">{user.rank}</p>
              </div>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-amber-400 transition-all duration-1000"
                style={{ width: `${rankPct}%` }}
              />
              <div className="shimmer-bar absolute inset-0 rounded-full" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-600">
              <span>{user.rank}</span>
              {nextRank && <span>{nextRank}</span>}
            </div>
          </section>
        )}

        {/* Continue Learning */}
        {inProgress.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Continue Learning</h2>
              <Link to="/profile" className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition">
                All progress <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {inProgress.slice(0, 2).map(({ course, completedCount, totalLessons }) => {
                const pct = Math.round((completedCount / totalLessons) * 100);
                const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);
                return (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 transition-all hover:border-violet-500/30 hover:bg-slate-900/80"
                  >
                    <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl', cat?.bgColor ?? 'bg-slate-800')}>
                      {cat ? <cat.icon className={cn('h-6 w-6', cat.color)} /> : <BookOpen className="h-6 w-6 text-slate-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white group-hover:text-violet-300 transition">{course.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-800">
                          <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 tabular-nums">{completedCount}/{totalLessons}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-600 group-hover:text-violet-400 transition" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Recommended for you — courses in your active taxonomies not yet started */}
        {recommended.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Recommended for you</h2>
                <p className="text-xs text-slate-500 mt-0.5">Based on what you're learning</p>
              </div>
              <Link to="/courses" className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition">
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

        {/* Featured courses — one per category for variety */}
        {featured.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Explore topics</h2>
              <Link to="/courses" className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition">
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

        {/* Top learners mini-leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Trophy className="h-4 w-4 text-amber-400" />
                Top learners
              </h2>
              <Link to="/leaderboard" className="flex items-center gap-1 text-sm text-amber-400/80 hover:text-amber-300 transition">
                Full leaderboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 divide-y divide-slate-800/60 overflow-hidden">
              {leaderboard.map(entry => (
                <div
                  key={entry.userId}
                  className={cn(
                    'flex items-center gap-4 px-5 py-3',
                    entry.isCurrentUser && 'bg-violet-500/8'
                  )}
                >
                  <span className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    entry.position === 1 ? 'bg-amber-400/20 text-amber-300' :
                    entry.position === 2 ? 'bg-slate-400/20 text-slate-300' :
                    entry.position === 3 ? 'bg-orange-400/20 text-orange-300' :
                    'bg-slate-800 text-slate-500'
                  )}>
                    {entry.position}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                    {entry.displayName.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', entry.isCurrentUser ? 'text-violet-200' : 'text-slate-200')}>
                      {entry.displayName}
                      {entry.isCurrentUser && <span className="ml-1.5 text-[10px] text-violet-400">you</span>}
                    </p>
                    <p className="text-xs text-slate-600">{entry.guildRank}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-violet-300 tabular-nums">
                    <Zap className="h-3 w-3" />
                    {entry.xp.toLocaleString()}
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

function StatCard({ icon: Icon, color, label, value }: {
  icon: typeof Trophy; color: 'amber' | 'violet' | 'orange' | 'emerald'; label: string; value: string | number;
}) {
  const colors = {
    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/15',   icon: 'text-amber-400',   glow: 'shadow-amber-500/10' },
    violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/15',  icon: 'text-violet-400',  glow: 'shadow-violet-500/10' },
    orange:  { bg: 'bg-orange-500/10',  border: 'border-orange-500/15',  icon: 'text-orange-400',  glow: 'shadow-orange-500/10' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/15', icon: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
  }[color];

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-4 shadow-lg ${colors.glow}`}>
      <Icon className={`mb-3 h-5 w-5 ${colors.icon}`} />
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const difficultyColor = {
    beginner:     'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    advanced:     'text-red-400 bg-red-400/10 border-red-400/20',
  }[course.difficulty];
  const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);

  return (
    <Link
      to={`/courses/${course.id}`}
      className="group flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition-all duration-300 hover:border-violet-500/30 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-0.5"
    >
      <div className="mb-3 flex items-center gap-1.5 text-xs">
        {cat ? (
          <span className={cn('flex items-center gap-1 rounded-lg px-2 py-1 font-medium', cat.bgColor, cat.color)}>
            <cat.icon className="h-3 w-3" />
            {course.taxonomy.l1}
          </span>
        ) : (
          <span className="rounded-lg bg-slate-800 px-2 py-1 text-slate-400">{course.taxonomy.l1}</span>
        )}
        <span className="text-slate-600">›</span>
        <span className="text-slate-500">{course.taxonomy.l2}</span>
      </div>
      <h3 className="mb-2 font-semibold text-white transition-colors group-hover:text-violet-300">{course.title}</h3>
      <p className="mb-4 flex-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">{course.description}</p>
      <div className="flex items-center justify-between">
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${difficultyColor}`}>
          {course.difficulty}
        </span>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          {course.ratingCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400/80">
              <Star className="h-3 w-3 fill-amber-400/80" />
              {course.ratingAverage.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.estimatedMinutes}m
          </span>
        </div>
      </div>
    </Link>
  );
}
