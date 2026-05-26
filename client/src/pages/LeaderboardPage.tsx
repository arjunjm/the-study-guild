import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy, Zap, Flame, Medal } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { cn } from '../lib/utils';
import type { LeaderboardEntry } from '../lib/mockData';

const RANK_COLORS: Record<string, string> = {
  Grandmaster: 'text-amber-300',
  Master:      'text-violet-300',
  Expert:      'text-cyan-300',
  Adept:       'text-emerald-300',
  Scholar:     'text-blue-300',
  Apprentice:  'text-slate-300',
  Initiate:    'text-slate-400',
};

const POSITION_STYLES: Record<number, { badge: string; row: string }> = {
  1: { badge: 'bg-amber-400/20 text-amber-300 border-amber-400/40', row: 'border-amber-500/20 bg-amber-500/5' },
  2: { badge: 'bg-slate-400/20 text-slate-300 border-slate-400/40', row: 'border-slate-600/30 bg-slate-800/20' },
  3: { badge: 'bg-orange-400/20 text-orange-300 border-orange-400/40', row: 'border-orange-500/20 bg-orange-500/5' },
};

export default function LeaderboardPage() {
  const { data: entries, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => (await apiClient.get<{ data: LeaderboardEntry[] }>('/leaderboard')).data.data,
  });

  const currentUser = entries?.find(e => e.isCurrentUser);
  const top3 = entries?.slice(0, 3) ?? [];
  const rest = entries?.slice(3) ?? [];

  return (
    <div className="min-h-full px-4 py-8 lg:px-10 lg:py-10 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Guild Leaderboard</h1>
            <p className="text-sm text-slate-400">Top learners ranked by XP earned</p>
          </div>
        </div>
      </div>

      {/* Current user position callout (if not in top 3) */}
      {currentUser && currentUser.position > 3 && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-violet-500/25 bg-violet-500/8 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-300">
            #{currentUser.position}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-violet-200">Your position</p>
            <p className="text-xs text-slate-500">{currentUser.xp.toLocaleString()} XP · {currentUser.guildRank}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500">
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
            <div key={i} className="h-16 rounded-2xl bg-slate-900/50 border border-slate-800/60 animate-pulse" />
          ))}
        </div>
      )}

      {/* Podium — top 3 */}
      {top3.length === 3 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[top3[1], top3[0], top3[2]].map((entry, displayIdx) => {
            const actualPos = entry.position;
            const height = actualPos === 1 ? 'pt-0' : actualPos === 2 ? 'pt-6' : 'pt-10';
            const medalColors = ['text-slate-400', 'text-amber-400', 'text-orange-400'];
            const medalIdx = [1, 0, 2][displayIdx];
            return (
              <div key={entry.userId} className={cn('flex flex-col items-center', height)}>
                <div className={cn(
                  'mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 text-xl font-bold',
                  entry.isCurrentUser ? 'bg-violet-600 border-violet-400' : 'bg-slate-800 border-slate-700'
                )}>
                  {entry.displayName.charAt(0).toUpperCase()}
                </div>
                <p className="mb-0.5 text-center text-xs font-semibold text-slate-200 leading-tight">
                  {entry.displayName.split(' ')[0]}
                </p>
                <p className={cn('text-xs font-bold', medalColors[medalIdx])}>
                  #{actualPos}
                </p>
                <p className="mt-1 text-xs text-slate-500">{entry.xp.toLocaleString()} XP</p>
                <div className={cn(
                  'mt-2 w-full rounded-t-xl border-x border-t py-2 text-center',
                  POSITION_STYLES[actualPos]?.row ?? 'border-slate-800/60 bg-slate-900/40'
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
                  ? 'border-violet-500/30 bg-violet-500/8 ring-1 ring-violet-500/20'
                  : styles
                  ? cn(styles.row, 'hover:brightness-110')
                  : 'border-slate-800/60 bg-slate-900/40 hover:border-slate-700/60',
              )}
            >
              {/* Position */}
              <span className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold tabular-nums',
                entry.isCurrentUser
                  ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
                  : styles
                  ? styles.badge
                  : 'border-slate-700/60 bg-slate-800/60 text-slate-400',
              )}>
                {entry.position}
              </span>

              {/* Avatar */}
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                entry.isCurrentUser ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'
              )}>
                {entry.displayName.charAt(0).toUpperCase()}
              </div>

              {/* Name + rank */}
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-semibold', entry.isCurrentUser ? 'text-violet-200' : 'text-slate-200')}>
                  {entry.displayName}
                  {entry.isCurrentUser && <span className="ml-2 text-[10px] font-normal text-violet-400">you</span>}
                </p>
                <p className={cn('text-xs font-medium', RANK_COLORS[entry.guildRank] ?? 'text-slate-400')}>
                  {entry.guildRank}
                </p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-400/70" />
                  {entry.streak}d
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-violet-400/70" />
                  {entry.xp.toLocaleString()}
                </span>
              </div>

              {/* XP on mobile */}
              <span className="sm:hidden flex items-center gap-1 text-xs font-semibold text-violet-300">
                <Zap className="h-3 w-3" />
                {entry.xp.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Encouragement footer */}
      <div className="mt-8 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 text-center">
        <p className="text-sm text-slate-400">
          Complete lessons, ace quizzes, and log in daily to earn XP and climb the ranks.
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
