import type { GuildRank } from '@study-guild/shared';
import { RANK_XP_THRESHOLDS } from '@study-guild/shared';

export const XP_REWARDS = {
  lesson_completed: 10,
  quiz_passed: 20,
  quiz_perfect: 40,
  course_completed: 50,
} as const;

const RANK_ORDER = Object.keys(RANK_XP_THRESHOLDS) as GuildRank[];

export function computeRank(xp: number): GuildRank {
  let result: GuildRank = 'Initiate';
  for (const rank of RANK_ORDER) {
    if (xp >= RANK_XP_THRESHOLDS[rank]) result = rank;
    else break;
  }
  return result;
}

export function rankProgressInfo(xp: number) {
  const rank = computeRank(xp);
  const idx = RANK_ORDER.indexOf(rank);
  const nextRank: GuildRank | null = idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : null;
  const currThreshold = RANK_XP_THRESHOLDS[rank];
  const pct = nextRank
    ? Math.min(100, Math.round(((xp - currThreshold) / (RANK_XP_THRESHOLDS[nextRank] - currThreshold)) * 100))
    : 100;
  return { rank, nextRank, pct };
}
