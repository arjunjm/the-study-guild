import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle, Crown, Sparkles, Star, Trophy, X, Zap } from 'lucide-react';
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
  onViewCertificate?: () => void;
}

const AUTO_DISMISS_SECONDS = 6;

export default function XPRewardOverlay({ xpGained, breakdown, newXP, courseComplete, rankUp, newAchievements, onDismiss, onViewCertificate }: Props) {
  const [displayXP, setDisplayXP] = useState(0);
  const [xpPopped, setXpPopped] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_DISMISS_SECONDS);

  useEffect(() => {
    const timers: number[] = [];
    if (courseComplete) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#7c3aed', '#8b5cf6', '#a78bfa', '#34d399', '#6ee7b7'] });
    } else if (rankUp) {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.55 }, colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#7c3aed', '#ffffff'] });
      timers.push(window.setTimeout(() => confetti({ particleCount: 50, spread: 60, origin: { y: 0.4 }, angle: 60, colors: ['#f59e0b', '#fbbf24'] }), 300));
      timers.push(window.setTimeout(() => confetti({ particleCount: 50, spread: 60, origin: { y: 0.4 }, angle: 120, colors: ['#f59e0b', '#fbbf24'] }), 300));
    } else if (xpGained > 0) {
      confetti({ particleCount: 72, spread: 62, origin: { y: 0.58 }, colors: ['#7c3aed', '#a78bfa', '#f59e0b', '#34d399'] });
    }
    return () => timers.forEach(timer => window.clearTimeout(timer));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    ? { border: 'border-amber-500/40', bg: 'from-amber-900/35 via-slate-950 to-slate-900', shadow: 'shadow-amber-500/20', iconBg: 'bg-amber-500/15 animate-rank-glow', iconColor: 'text-amber-400', accentText: 'text-amber-400', xpBorder: 'border-amber-500/25', xpBg: 'bg-amber-500/10', particle: 'bg-amber-300/50', ribbon: 'bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500', cta: 'from-amber-600 to-amber-500 shadow-amber-500/20 hover:from-amber-500 hover:to-amber-400' }
    : isCourseComplete
    ? { border: 'border-emerald-500/30', bg: 'from-emerald-900/25 via-slate-950 to-slate-900', shadow: 'shadow-emerald-500/15', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', accentText: 'text-emerald-400', xpBorder: 'border-emerald-500/25', xpBg: 'bg-emerald-500/10', particle: 'bg-emerald-300/45', ribbon: 'bg-gradient-to-r from-emerald-500 via-cyan-300 to-violet-500', cta: 'from-emerald-600 to-violet-600 shadow-emerald-500/20 hover:from-emerald-500 hover:to-violet-500' }
    : { border: 'border-violet-500/30', bg: 'from-violet-900/25 via-slate-950 to-slate-900', shadow: 'shadow-violet-500/15', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400', accentText: 'text-violet-400', xpBorder: 'border-violet-500/25', xpBg: 'bg-violet-500/10', particle: 'bg-violet-300/45', ribbon: 'bg-gradient-to-r from-violet-600 via-fuchsia-400 to-amber-400', cta: 'from-violet-600 to-violet-500 shadow-violet-500/20 hover:from-violet-500 hover:to-violet-400' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={e => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      <div className={cn(
        'animate-scale-in relative w-full max-w-md overflow-hidden rounded-3xl border bg-gradient-to-b p-7 text-center shadow-2xl sm:p-8',
        theme.border, theme.bg, theme.shadow
      )}>
        <div className={cn('absolute left-1/2 top-0 h-1.5 w-32 -translate-x-1/2 rounded-b-full', theme.ribbon)} />

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-600 transition hover:text-slate-400"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          {Array.from({ length: isRankUp ? 10 : 7 }).map((_, i) => (
            <div
              key={i}
              className={cn('absolute h-1.5 w-1.5 rounded-full animate-float', theme.particle)}
              style={{
                left: `${10 + i * 10}%`,
                top: `${9 + (i % 4) * 20}%`,
                animationDelay: `${i * 0.35}s`,
                animationDuration: `${3 + i * 0.35}s`,
              }}
            />
          ))}
        </div>

        {/* Icon */}
        <div className={cn('relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ring-1 ring-white/10', theme.iconBg)}>
          {isRankUp
            ? <Crown className={cn('h-9 w-9', theme.iconColor)} />
            : isCourseComplete
            ? <Star className={cn('h-9 w-9 fill-current', theme.iconColor)} />
            : <CheckCircle className={cn('h-9 w-9', theme.iconColor)} />}
          <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-amber-300" />
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

        <div className="mb-4 grid grid-cols-3 gap-2 text-left">
          <RewardPill icon={Zap} label="Earned" value={xpGained > 0 ? `+${xpGained}` : '0'} />
          <RewardPill icon={Award} label="Rank" value={rank} />
          <RewardPill icon={Trophy} label={nextRank ? 'Next' : 'Standing'} value={nextRank ?? 'Max'} />
        </div>
 
        {/* XP gained */}
        {xpGained > 0 ? (
          <div className={cn('mb-4 rounded-2xl border py-4', theme.xpBorder, theme.xpBg)}>
            <p className={cn(
              'font-display text-5xl font-bold text-gradient leading-none transition-transform',
              xpPopped && 'animate-xp-pop'
            )}>
              +{displayXP}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">XP earned</p>
          </div>
        ) : (
          <div className={cn('mb-4 rounded-2xl border px-4 py-3 text-sm', theme.xpBorder, theme.xpBg)}>
            <p className="font-semibold text-slate-300">Reward already claimed</p>
            <p className="mt-1 text-xs text-slate-500">Replay the lesson any time to review the material.</p>
          </div>
        )}
 
        {/* Breakdown */}
        {breakdown.length > 0 && (
          <div className="mb-4 space-y-1.5 rounded-2xl border border-white/5 bg-slate-950/55 px-4 py-3 text-xs">
            <p className="mb-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Reward ledger</p>
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
          <div className="mb-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-400/80">Guild seal{newAchievements.length > 1 ? 's' : ''} unlocked</p>
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
        <div className="mb-6 rounded-2xl border border-white/5 bg-slate-950/45 p-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-amber-400/90">Total XP: {newXP.toLocaleString()}</span>
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

        {/* Certificate button for course completion */}
        {isCourseComplete && onViewCertificate && (
          <button
            onClick={() => { onDismiss(); setTimeout(onViewCertificate, 50); }}
            className="mb-3 w-full rounded-xl border border-amber-300/50 bg-amber-500/10 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
          >
            View Certificate
          </button>
        )}

        {/* Continue button with countdown */}
        <button
          onClick={onDismiss}
          className={cn(
            'w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-all',
            'bg-gradient-to-r',
            theme.cta
          )}
        >
          Continue quest
          <span className="ml-2 text-xs opacity-60">({countdown}s)</span>
        </button>
      </div>
    </div>
  );
}

function RewardPill({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-950/45 px-3 py-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="truncate text-sm font-semibold text-slate-200" title={value}>{value}</p>
    </div>
  );
}
