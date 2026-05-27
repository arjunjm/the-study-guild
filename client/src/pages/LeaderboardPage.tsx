import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy, Zap, Flame, Medal, BookOpen, Calendar } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { cn } from '../lib/utils';
import type { LeaderboardEntry } from '@study-guild/shared';

const RANK_COLORS: Record<string, string> = {
  Grandmaster: 'text-amber-600',
  Master:      'text-violet-600',
  Expert:      'text-cyan-600',
  Adept:       'text-emerald-600',
  Scholar:     'text-blue-600',
  Apprentice:  'text-slate-600',
  Initiate:    'text-slate-400',
};

const POSITION_STYLES: Record<number, { badge: string; row: string }> = {
  1: { badge: 'bg-amber-100 text-amber-700 border-amber-300', row: 'border-amber-200 bg-amber-50' },
  2: { badge: 'bg-slate-100 text-slate-600 border-slate-300', row: 'border-slate-200 bg-slate-50' },
  3: { badge: 'bg-orange-100 text-orange-700 border-orange-200', row: 'border-orange-200 bg-orange-50' },
};

type Period = 'alltime' | 'week' | 'month';

const PERIOD_LABELS: Record<Period, string> = {
  alltime: 'All Time',
  week: 'This Week',
  month: 'This Month',
};

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('alltime');

  const { data: entries, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', period],
    queryFn: async () => (await apiClient.get<{ data: LeaderboardEntry[] }>(`/leaderboard?period=${period}`)).data.data,
  });

  const currentUser = entries?.find(e => e.isCurrentUser);
  const top3 = entries?.slice(0, 3) ?? [];

  return (
    <div className="min-h-full px-4 py-8 lg:px-10 lg:py-10 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <Trophy className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Guild Leaderboard</h1>
            <p className="text-sm text-slate-500">Top learners ranked by XP earned</p>
          </div>
        </div>
        {/* Period tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit shadow-sm">
          <Calendar className="ml-2 mr-1 h-3.5 w-3.5 text-slate-400 shrink-0" />
          {(['alltime', 'week', 'month'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                period === p
                  ? 'bg-amber-100 text-amber-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Current user position callout (if not in top 3) */}
      {currentUser && currentUser.position > 3 && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
            #{currentUser.position}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-violet-700">Your position</p>
            <p className="text-xs text-slate-500">{currentUser.xp.toLocaleString()} XP · {currentUser.guildRank}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">
              {entries && entries[currentUser.position - 2]
                ? `${(entries[currentUser.position - 2].xp - currentUser.xp).toLocaleString()} XP to pass #${currentUser.position - 1}`
                : ''}
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* Podium — top 3 */}
      {top3.length === 3 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[top3[1], top3[0], top3[2]].map((entry, displayIdx) => {
            const actualPos = entry.position;
            const height = actualPos === 1 ? 'pt-0' : actualPos === 2 ? 'pt-6' : 'pt-10';
            const medalColors = ['text-slate-500', 'text-amber-500', 'text-orange-500'];
            const medalIdx = [1, 0, 2][displayIdx];
            return (
              <div key={entry.userId} className={cn('flex flex-col items-center', height)}>
                <div className={cn(
                  'mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 text-xl font-bold text-white',
                  entry.isCurrentUser ? 'bg-violet-600 border-violet-400' : 'bg-slate-700 border-slate-500'
                )}>
                  {entry.displayName.charAt(0).toUpperCase()}
                </div>
                <p className="mb-0.5 text-center text-xs font-semibold text-slate-700 leading-tight">
                  {entry.displayName.split(' ')[0]}
                </p>
                <p className={cn('text-xs font-bold', medalColors[medalIdx])}>
                  #{actualPos}
                </p>
                <p className="mt-1 text-xs text-slate-400">{entry.xp.toLocaleString()} XP</p>
                {entry.completedCourses > 0 && (
                  <p className="text-[10px] text-slate-400">{entry.completedCourses} course{entry.completedCourses !== 1 ? 's' : ''}</p>
                )}
                <div className={cn(
                  'mt-2 w-full rounded-t-xl border-x border-t py-2 text-center',
                  POSITION_STYLES[actualPos]?.row ?? 'border-slate-200 bg-slate-50'
                )}>
                  <Medal className={cn('mx-auto h-4 w-4', medalColors[medalIdx])} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full ranking table */}
      <div className="space-y-1.5">
        {entries?.map(entry => {
          const styles = POSITION_STYLES[entry.position];
          return (
            <div
              key={entry.userId}
              className={cn(
                'flex items-center gap-4 rounded-xl border px-4 py-3 transition',
                entry.isCurrentUser
                  ? 'border-violet-300 bg-violet-50 ring-1 ring-violet-200'
                  : styles
                  ? cn(styles.row, 'hover:brightness-95')
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm',
              )}
            >
              <span className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold tabular-nums',
                entry.isCurrentUser
                  ? 'border-violet-300 bg-violet-100 text-violet-700'
                  : styles
                  ? styles.badge
                  : 'border-slate-200 bg-slate-100 text-slate-500',
              )}>
                {entry.position}
              </span>

              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                entry.isCurrentUser ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-700'
              )}>
                {entry.displayName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-semibold', entry.isCurrentUser ? 'text-violet-700' : 'text-slate-800')}>
                  {entry.displayName}
                  {entry.isCurrentUser && <span className="ml-2 text-[10px] font-normal text-violet-500">you</span>}
                </p>
                <p className={cn('text-xs font-medium', RANK_COLORS[entry.guildRank] ?? 'text-slate-500')}>
                  {entry.guildRank}
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1" title="Day streak">
                  <Flame className="h-3 w-3 text-orange-400" />
                  {entry.streak}d
                </span>
                {entry.completedCourses > 0 && (
                  <span className="flex items-center gap-1" title="Completed courses">
                    <BookOpen className="h-3 w-3 text-emerald-500" />
                    {entry.completedCourses}
                  </span>
                )}
                <span className="flex items-center gap-1 font-semibold text-violet-600" title="Total XP">
                  <Zap className="h-3 w-3 text-violet-500" />
                  {entry.xp.toLocaleString()}
                </span>
              </div>

              <span className="sm:hidden flex items-center gap-1 text-xs font-semibold text-violet-600">
                <Zap className="h-3 w-3" />
                {entry.xp.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Encouragement footer */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          {period === 'week'
            ? 'Weekly XP resets every Monday. Complete lessons now to climb this week\'s board.'
            : period === 'month'
            ? 'Monthly XP resets at the start of each month. Stay consistent to hold your position.'
            : 'Complete lessons, ace quizzes, and log in daily to earn XP and climb the ranks.'}
        </p>
        <Link
          to="/courses"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition"
        >
          Browse courses →
        </Link>
      </div>
    </div>
  );
}
