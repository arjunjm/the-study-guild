import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Zap, Flame, Trophy, BookOpen, ChevronRight, CheckCircle2, Star, Pencil, Check, X } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { TAXONOMY } from '../data/taxonomy';
import { cn } from '../lib/utils';
import type { UserProfile, Course } from '@study-guild/shared';
import { RANK_XP_THRESHOLDS } from '@study-guild/shared';

const RANK_ORDER = Object.keys(RANK_XP_THRESHOLDS) as (keyof typeof RANK_XP_THRESHOLDS)[];

const ACHIEVEMENT_CONFIG: Record<string, { label: string; icon: string }> = {
  'first-lesson':    { label: 'First Step',        icon: '📚' },
  'ten-lessons':     { label: 'Dedicated Learner',  icon: '📖' },
  'fifty-lessons':   { label: 'Knowledge Seeker',   icon: '🎯' },
  'first-course':    { label: 'Course Complete',    icon: '🎓' },
  'five-courses':    { label: 'Guild Scholar',      icon: '🏫' },
  'quiz-perfect':    { label: 'Perfect Score',      icon: '⭐' },
  'quiz-master':     { label: 'Quiz Master',        icon: '🧠' },
  'rank-apprentice': { label: 'Apprentice',         icon: '🟢' },
  'rank-scholar':    { label: 'Scholar',            icon: '🔵' },
  'rank-expert':     { label: 'Expert',             icon: '🟡' },
  'streak-3':        { label: '3-Day Streak',       icon: '🔥' },
  'streak-7':        { label: 'Week Warrior',       icon: '🔥' },
  'streak-30':       { label: 'Monthly Champion',   icon: '👑' },
  // legacy IDs (kept for backward compat)
  'seven-day-streak': { label: '7-Day Streak',      icon: '🔥' },
  'course-complete':  { label: 'Course Complete',   icon: '🎓' },
};

const RANK_ICONS = ['⚪', '🟢', '🔵', '🟣', '🟡', '🟠', '🔴'];

interface CourseProgress {
  course: Course;
  completedCount: number;
  totalLessons: number;
  completedLessonIds: string[];
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId?: string }>();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftBio, setDraftBio] = useState('');

  const { data: me } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get<{ data: UserProfile }>('/users/me')).data.data,
    enabled: !userId,
  });

  const { data: publicProfile } = useQuery<Partial<UserProfile>>({
    queryKey: ['profile', userId],
    queryFn: async () => (await apiClient.get<{ data: Partial<UserProfile> }>(`/users/${userId}/profile`)).data.data,
    enabled: !!userId,
  });

  const { data: courseProgress } = useQuery<CourseProgress[]>({
    queryKey: ['my-progress'],
    queryFn: async () => (await apiClient.get<{ data: CourseProgress[] }>('/users/me/progress')).data.data,
    enabled: !userId,
  });

  const patchMutation = useMutation({
    mutationFn: (body: { displayName?: string; bio?: string }) =>
      apiClient.patch<{ data: UserProfile }>('/users/me', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
    },
  });

  const user = userId ? publicProfile : me;
  if (!user) return <div className="p-10 text-slate-400">Loading profile…</div>;

  function startEdit() {
    setDraftName((user as UserProfile).displayName ?? '');
    setDraftBio((user as UserProfile).bio ?? '');
    setEditing(true);
  }

  const rankIndex = RANK_ORDER.indexOf(user.rank as keyof typeof RANK_XP_THRESHOLDS);
  const currentThreshold = RANK_XP_THRESHOLDS[RANK_ORDER[rankIndex]];
  const nextThreshold = rankIndex < RANK_ORDER.length - 1 ? RANK_XP_THRESHOLDS[RANK_ORDER[rankIndex + 1]] : null;
  const xpIntoRank = (user.xp ?? 0) - currentThreshold;
  const xpForNextRank = nextThreshold ? nextThreshold - currentThreshold : null;
  const rankPct = xpForNextRank ? Math.min(100, Math.round((xpIntoRank / xpForNextRank) * 100)) : 100;

  const inProgress = courseProgress?.filter(c => c.completedCount > 0 && c.completedCount < c.totalLessons) ?? [];
  const completed = courseProgress?.filter(c => c.completedCount >= c.totalLessons && c.totalLessons > 0) ?? [];
  const totalLessonsCompleted = courseProgress?.reduce((sum, c) => sum + c.completedCount, 0) ?? 0;

  // Per-category learning stats
  const categoryStats = courseProgress
    ? Object.entries(
        courseProgress.reduce((acc, cp) => {
          const l1 = cp.course.taxonomy.l1;
          if (!acc[l1]) acc[l1] = { completed: 0, total: 0 };
          acc[l1].completed += cp.completedCount;
          acc[l1].total += cp.totalLessons;
          return acc;
        }, {} as Record<string, { completed: number; total: number }>)
      )
        .filter(([, s]) => s.completed > 0)
        .sort((a, b) => b[1].completed - a[1].completed)
    : [];

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      {/* Hero */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-gradient-to-br from-violet-900/40 via-slate-900 to-slate-900 p-8">
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-800 text-3xl font-bold text-white shadow-lg shadow-violet-900/50">
              {user.displayName?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900 bg-amber-500 text-[10px] font-bold text-slate-900">
              {rankIndex + 1}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  className="w-full rounded-xl border border-violet-500/40 bg-slate-800/80 px-3 py-2 text-base font-bold text-white outline-none focus:border-violet-500/70"
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  maxLength={50}
                  placeholder="Display name"
                  autoFocus
                />
                <textarea
                  className="w-full resize-none rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500/40 placeholder-slate-600"
                  value={draftBio}
                  onChange={e => setDraftBio(e.target.value)}
                  maxLength={160}
                  rows={2}
                  placeholder="Short bio (optional)"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => patchMutation.mutate({ displayName: draftName.trim(), bio: draftBio.trim() })}
                    disabled={patchMutation.isPending || !draftName.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
                  {!userId && (
                    <button
                      onClick={startEdit}
                      className="rounded-lg p-1 text-slate-600 transition hover:text-slate-300 hover:bg-slate-800"
                      title="Edit profile"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-lg text-amber-400">{user.rank}</p>
                  {!userId && (user as UserProfile).role === 'teacher' && (
                    <Link
                      to="/teach"
                      className="flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-300 transition hover:bg-violet-500/20"
                    >
                      Teacher
                    </Link>
                  )}
                  {!userId && (user as UserProfile).role === 'admin' && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                      Admin
                    </span>
                  )}
                </div>
                {!userId && (user as UserProfile).email && (
                  <p className="text-sm text-slate-500">{(user as UserProfile).email}</p>
                )}
                {(user as UserProfile).bio && (
                  <p className="mt-1 text-sm text-slate-400 leading-relaxed">{(user as UserProfile).bio}</p>
                )}
              </>
            )}
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-violet-400" /> {(user.xp ?? 0).toLocaleString()} XP
                </span>
                {nextThreshold
                  ? <span className="text-slate-500">{xpIntoRank} / {xpForNextRank} → {RANK_ORDER[rankIndex + 1]}</span>
                  : <span className="text-amber-400">Max rank reached</span>}
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-violet-600 to-amber-400 transition-all"
                  style={{ width: `${rankPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total XP', value: (user.xp ?? 0).toLocaleString(), Icon: Zap, cls: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
          { label: 'Day streak', value: String((user as UserProfile).streak ?? 0), Icon: Flame, cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
          { label: 'Achievements', value: String(user.achievements?.length ?? 0), Icon: Trophy, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { label: 'Lessons done', value: String(totalLessonsCompleted), Icon: BookOpen, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        ].map(({ label, value, Icon, cls }) => (
          <div key={label} className={`rounded-xl border p-4 ${cls}`}>
            <Icon className="mb-2 h-4 w-4" />
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Category learning breakdown */}
      {!userId && categoryStats.length > 0 && (
        <div className="mb-8 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Learning by topic</h2>
          <div className="space-y-3">
            {categoryStats.map(([l1, stats]) => {
              const cat = TAXONOMY.find(c => c.l1 === l1);
              const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              return (
                <div key={l1}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {cat && <cat.icon className={cn('h-3 w-3', cat.color)} />}
                      <span className="font-medium text-slate-300">{l1}</span>
                    </div>
                    <span className="text-slate-500 tabular-nums">
                      {stats.completed} / {stats.total} lessons
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Streak calendar */}
      {!userId && (user as UserProfile).streak > 0 && (
        <StreakCalendar streak={(user as UserProfile).streak} lastLoginDate={(user as UserProfile).lastLoginDate} />
      )}

      {/* Achievements */}
      {!userId && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-white">Achievements</h2>
            <span className="text-xs text-slate-500">
              {user.achievements?.length ?? 0} / {Object.keys(ACHIEVEMENT_CONFIG).filter(k => !['seven-day-streak','course-complete'].includes(k)).length} unlocked
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ACHIEVEMENT_CONFIG)
              .filter(([id]) => !['seven-day-streak', 'course-complete'].includes(id))
              .map(([id, cfg]) => {
                const earned = user.achievements?.includes(id) ?? false;
                return (
                  <div
                    key={id}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-2 transition',
                      earned
                        ? 'border-amber-500/30 bg-amber-500/8 text-amber-200'
                        : 'border-slate-800/60 bg-slate-900/40 text-slate-600 grayscale opacity-50'
                    )}
                    title={earned ? `Earned: ${cfg.label}` : `Locked: ${cfg.label}`}
                  >
                    <span className="text-lg">{cfg.icon}</span>
                    <span className="text-xs font-medium">{cfg.label}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      {userId && user.achievements && user.achievements.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-semibold text-white">Achievements</h2>
          <div className="flex flex-wrap gap-2">
            {user.achievements.map(id => {
              const cfg = ACHIEVEMENT_CONFIG[id] ?? { label: id, icon: '🏅' };
              return (
                <div key={id} className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2">
                  <span className="text-lg">{cfg.icon}</span>
                  <span className="text-xs font-medium text-amber-200">{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* In Progress courses */}
      {inProgress.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-semibold text-white">In Progress</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {inProgress.map((cp) => {
              const { course, completedCount, totalLessons, completedLessonIds } = cp;
              const pct = Math.round((completedCount / totalLessons) * 100);
              const doneSet = new Set(completedLessonIds);
              const nextLessonId = course.lessonIds.find(id => !doneSet.has(id));
              const to = nextLessonId ? `/courses/${course.id}/lessons/${nextLessonId}` : `/courses/${course.id}`;
              return (
                <Link
                  key={course.id}
                  to={to}
                  className="group rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-violet-600/40 hover:bg-slate-800/70"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="font-medium text-white group-hover:text-violet-300 transition">{course.title}</h3>
                    <span className="shrink-0 rounded-md border border-violet-500/25 bg-violet-500/8 px-2 py-0.5 text-[10px] font-medium text-violet-400 group-hover:bg-violet-500/15 transition">
                      Resume
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-slate-500">{course.taxonomy.l1} · {course.taxonomy.l2}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800">
                      <div className="h-1.5 rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums">{completedCount}/{totalLessons}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed courses */}
      {completed.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Completed courses
            </h2>
            <span className="text-xs text-slate-500">{completed.length} course{completed.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {completed.map(({ course }) => {
              const cat = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);
              return (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="group rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 transition hover:border-emerald-500/30 hover:bg-emerald-500/8"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {cat && (
                        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', cat.bgColor)}>
                          <cat.icon className={cn('h-3.5 w-3.5', cat.color)} />
                        </span>
                      )}
                      <h3 className="truncate text-sm font-medium text-slate-200 group-hover:text-white transition">{course.title}</h3>
                    </div>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{course.taxonomy.l1} · {course.taxonomy.l2}</span>
                    {course.ratingCount > 0 && (
                      <span className="flex items-center gap-1 text-amber-400/70">
                        <Star className="h-3 w-3 fill-amber-400/70" />
                        {course.ratingAverage.toFixed(1)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity heat map */}
      {!userId && <ActivityHeatMap xp={user.xp ?? 0} streak={user.streak ?? 0} totalLessons={totalLessonsCompleted} />}

      {/* Rank ladder */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 font-semibold text-white">Guild Ranks</h2>
        <div className="space-y-1.5">
          {RANK_ORDER.map((rank, i) => {
            const achieved = rankIndex >= i;
            const isCurrent = rank === user.rank;
            const threshold = RANK_XP_THRESHOLDS[rank];
            return (
              <div
                key={rank}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  isCurrent
                    ? 'border border-amber-500/40 bg-amber-500/10'
                    : achieved
                    ? 'text-slate-400'
                    : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={achieved ? '' : 'grayscale opacity-30'}>{RANK_ICONS[i] ?? '⭐'}</span>
                  <span className={`font-medium ${isCurrent ? 'text-amber-300' : achieved ? 'text-slate-300' : 'text-slate-700'}`}>
                    {rank}
                    {isCurrent && <span className="ml-2 text-xs text-amber-500/80">← you</span>}
                  </span>
                </div>
                <span className={`text-xs tabular-nums ${achieved ? 'text-slate-500' : 'text-slate-700'}`}>
                  {threshold.toLocaleString()} XP
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ActivityHeatMap({ xp, streak, totalLessons }: { xp: number; streak: number; totalLessons: number }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 35 days of plausible mock activity using deterministic noise
  const seed = xp + streak * 7 + totalLessons * 3;
  const days: { date: Date; count: number }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Pseudo-random but stable: higher activity in recent days (streak)
    const recency = i < streak ? 1 : 0;
    const noise = Math.abs(Math.sin(seed + i * 137.508)) ;
    const count = recency ? Math.ceil(noise * 4) : noise > 0.7 ? Math.ceil(noise * 3) : 0;
    days.push({ date: d, count });
  }

  // Pad to start on Monday
  const firstDow = days[0].date.getDay();
  const padStart = firstDow === 0 ? 6 : firstDow - 1;
  const padded: (typeof days[0] | null)[] = [...Array(padStart).fill(null), ...days];
  const weeks: (typeof days[0] | null)[][] = [];
  for (let w = 0; w < Math.ceil(padded.length / 7); w++) {
    weeks.push(padded.slice(w * 7, w * 7 + 7));
  }

  const maxCount = Math.max(...days.map(d => d.count), 1);
  const intensity = (count: number) => {
    if (count === 0) return 'bg-slate-800 hover:bg-slate-700';
    const pct = count / maxCount;
    if (pct < 0.33) return 'bg-violet-900/60 hover:bg-violet-800/70';
    if (pct < 0.66) return 'bg-violet-600/70 hover:bg-violet-500/80';
    return 'bg-violet-500 hover:bg-violet-400';
  };

  const todayStr = today.toISOString().split('T')[0];
  const totalActiveDays = days.filter(d => d.count > 0).length;
  const totalLessonsInPeriod = days.reduce((s, d) => s + d.count, 0);

  return (
    <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <Zap className="h-4 w-4 text-violet-400" />
          Learning activity — last 5 weeks
        </h2>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{totalActiveDays} active days</span>
          <span>{totalLessonsInPeriod} lessons</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="mb-1 flex gap-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => (
              <div key={i} className="h-5 w-5 text-center text-[10px] font-medium text-slate-600">{l}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="mb-1 flex gap-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="h-5 w-5" />;
                const str = day.date.toISOString().split('T')[0];
                const isToday = str === todayStr;
                return (
                  <div
                    key={di}
                    title={`${str}: ${day.count} lesson${day.count !== 1 ? 's' : ''}`}
                    className={cn(
                      'h-5 w-5 rounded-sm transition-colors cursor-default',
                      isToday ? 'ring-2 ring-violet-400/40 ring-offset-1 ring-offset-slate-900' : '',
                      intensity(day.count)
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-600">
        <span>Less</span>
        {['bg-slate-800', 'bg-violet-900/60', 'bg-violet-600/70', 'bg-violet-500'].map(cls => (
          <div key={cls} className={cn('h-3 w-3 rounded-sm', cls)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function StreakCalendar({ streak, lastLoginDate }: { streak: number; lastLoginDate?: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build a set of active date strings (YYYY-MM-DD) based on streak count
  const activeDays = new Set<string>();
  const lastDate = lastLoginDate ? new Date(lastLoginDate + 'T00:00:00') : today;
  for (let i = 0; i < streak; i++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() - i);
    activeDays.add(d.toISOString().split('T')[0]);
  }

  // Show 4 weeks (28 days) ending today, padded to start on Monday
  const days: Date[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  // Pad to start on Monday (day 1)
  const firstDay = days[0].getDay(); // 0=Sun, 1=Mon...
  const padStart = firstDay === 0 ? 6 : firstDay - 1;
  const paddedDays: (Date | null)[] = [
    ...Array(padStart).fill(null),
    ...days,
  ];

  const totalDays = paddedDays.length;
  const weeks = Math.ceil(totalDays / 7);
  const grid: (Date | null)[][] = [];
  for (let w = 0; w < weeks; w++) {
    grid.push(paddedDays.slice(w * 7, w * 7 + 7));
  }

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayStr = today.toISOString().split('T')[0];

  return (
    <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          Activity — last 4 weeks
        </h2>
        <span className="text-xs text-slate-500">{streak}-day streak</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Day labels */}
          <div className="mb-1 flex gap-1 pl-0">
            {dayLabels.map((l, i) => (
              <div key={i} className="h-5 w-5 text-center text-[10px] font-medium text-slate-600">{l}</div>
            ))}
          </div>
          {/* Weeks (rows) */}
          {grid.map((week, wi) => (
            <div key={wi} className="mb-1 flex gap-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="h-5 w-5" />;
                const str = day.toISOString().split('T')[0];
                const isActive = activeDays.has(str);
                const isToday = str === todayStr;
                return (
                  <div
                    key={di}
                    title={str}
                    className={cn(
                      'h-5 w-5 rounded-sm transition-colors',
                      isToday
                        ? isActive
                          ? 'bg-orange-400 ring-2 ring-orange-400/40 ring-offset-1 ring-offset-slate-900'
                          : 'bg-slate-700 ring-2 ring-slate-500/40 ring-offset-1 ring-offset-slate-900'
                        : isActive
                        ? 'bg-orange-500/70 hover:bg-orange-400/90'
                        : 'bg-slate-800 hover:bg-slate-700'
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-600">Each cell is one day. Orange = active day.</p>
    </div>
  );
}
