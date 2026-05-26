import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Trophy, Star, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { rankProgressInfo } from '../lib/xpUtils';
import type { GuildRank } from '@study-guild/shared';

interface XPBreakdownItem {
  label: string;
  amount: number;
}

const ACHIEVEMENT_LABELS: Record<string, { label: string; icon: string }> = {
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
};

interface Props {
  xpGained: number;
  breakdown: XPBreakdownItem[];
  newXP: number;
  courseComplete?: boolean;
  rankUp?: { from: GuildRank; to: GuildRank };
  newAchievements?: string[];
  onDismiss: () => void;
}

const AUTO_DISMISS_SECONDS = 6;

export default function XPRewardOverlay({ xpGained, breakdown, newXP, courseComplete, rankUp, newAchievements, onDismiss }: Props) {
  const [displayXP, setDisplayXP] = useState(0);
  const [xpPopped, setXpPopped] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_DISMISS_SECONDS);

  // Animate XP counter
  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayXP(Math.round(eased * xpGained));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setXpPopped(true);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [xpGained]);

  // Countdown + auto-dismiss
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { onDismiss(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDismiss]);

  // Escape key dismiss
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onDismiss();
  }, [onDismiss]);
  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const { rank, nextRank, pct } = rankProgressInfo(newXP);
  const isRankUp = !!rankUp;
  const isCourseComplete = courseComplete && !isRankUp;

  const theme = isRankUp
    ? { border: 'border-amber-500/40', bg: 'from-amber-900/30 to-slate-900', shadow: 'shadow-amber-500/20', iconBg: 'bg-amber-500/15 animate-rank-glow', iconColor: 'text-amber-400', accentText: 'text-amber-400', xpBorder: 'border-amber-500/20', xpBg: 'bg-amber-500/8' }
    : isCourseComplete
    ? { border: 'border-emerald-500/30', bg: 'from-emerald-900/20 to-slate-900', shadow: 'shadow-emerald-500/15', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', accentText: 'text-emerald-400', xpBorder: 'border-emerald-500/20', xpBg: 'bg-emerald-500/8' }
    : { border: 'border-violet-500/30', bg: 'from-violet-900/20 to-slate-900', shadow: 'shadow-violet-500/15', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400', accentText: 'text-violet-400', xpBorder: 'border-violet-500/20', xpBg: 'bg-violet-500/8' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={e => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      <div className={cn(
        'animate-scale-in relative w-full max-w-sm rounded-3xl border bg-gradient-to-b p-8 text-center shadow-2xl',
        theme.border, theme.bg, theme.shadow
      )}>
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-600 transition hover:text-slate-400"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Ambient particles for rank-up */}
        {isRankUp && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full bg-amber-400/40 animate-float"
                style={{
                  left: `${15 + i * 14}%`,
                  top: `${10 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: `${3 + i * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Icon */}
        <div className={cn('mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full', theme.iconBg)}>
          {isRankUp
            ? <Trophy className={cn('h-9 w-9', theme.iconColor)} />
            : isCourseComplete
            ? <Star className={cn('h-9 w-9 fill-current', theme.iconColor)} />
            : <CheckCircle className={cn('h-9 w-9', theme.iconColor)} />}
        </div>

        {/* Title */}
        {isRankUp ? (
          <>
            <p className={cn('mb-1 text-[10px] font-bold uppercase tracking-[0.2em]', theme.accentText)}>Rank Up!</p>
            <h2 className="mb-1 font-display text-4xl font-bold text-gradient-gold leading-none">{rankUp.to}</h2>
            <p className="mb-5 text-sm text-slate-400">You've risen from <span className="text-slate-300">{rankUp.from}</span></p>
          </>
        ) : isCourseComplete ? (
          <>
            <p className={cn('mb-1 text-[10px] font-bold uppercase tracking-[0.2em]', theme.accentText)}>Course Complete!</p>
            <h2 className="mb-5 font-display text-2xl font-bold text-white">Outstanding work</h2>
          </>
        ) : (
          <>
            <p className={cn('mb-1 text-[10px] font-bold uppercase tracking-[0.2em]', theme.accentText)}>Lesson Complete</p>
            <h2 className="mb-5 font-display text-2xl font-bold text-white">Well done</h2>
          </>
        )}

        {/* XP gained */}
        {xpGained > 0 && (
          <div className={cn('mb-4 rounded-2xl border py-4', theme.xpBorder, theme.xpBg)}>
            <p className={cn(
              'font-display text-5xl font-bold text-gradient leading-none transition-transform',
              xpPopped && 'animate-xp-pop'
            )}>
              +{displayXP}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">XP earned</p>
          </div>
        )}

        {/* Breakdown */}
        {breakdown.length > 1 && (
          <div className="mb-4 space-y-1.5 rounded-xl bg-slate-900/60 px-4 py-3 text-xs">
            {breakdown.map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-slate-400">{item.label}</span>
                <span className="font-medium text-slate-300">+{item.amount} XP</span>
              </div>
            ))}
          </div>
        )}

        {/* New achievements */}
        {newAchievements && newAchievements.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Achievement{newAchievements.length > 1 ? 's' : ''} Unlocked</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {newAchievements.map(id => {
                const cfg = ACHIEVEMENT_LABELS[id] ?? { label: id, icon: '🏅' };
                return (
                  <div key={id} className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5">
                    <span className="text-base leading-none">{cfg.icon}</span>
                    <span className="text-xs font-medium text-amber-200">{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rank progress bar */}
        <div className="mb-6">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-amber-400/90">{rank}</span>
            {nextRank
              ? <span className="text-slate-500">{pct}% → {nextRank}</span>
              : <span className="text-amber-400/70">Max rank!</span>}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-amber-400 transition-all duration-1000 shimmer-bar"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Continue button with countdown */}
        <button
          onClick={onDismiss}
          className={cn(
            'w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-all',
            isRankUp
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 shadow-amber-500/20 hover:from-amber-500 hover:to-amber-400'
              : 'bg-gradient-to-r from-violet-600 to-violet-500 shadow-violet-500/20 hover:from-violet-500 hover:to-violet-400'
          )}
        >
          Continue
          <span className="ml-2 text-xs opacity-60">({countdown}s)</span>
        </button>
      </div>
    </div>
  );
}
