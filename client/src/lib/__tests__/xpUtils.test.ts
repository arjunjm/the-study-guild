import { describe, it, expect } from 'vitest';
import { computeRank, rankProgressInfo, XP_REWARDS } from '../xpUtils';

describe('XP_REWARDS', () => {
  it('has all expected reward keys', () => {
    expect(XP_REWARDS.lesson_completed).toBe(10);
    expect(XP_REWARDS.quiz_passed).toBe(20);
    expect(XP_REWARDS.quiz_perfect).toBe(40);
    expect(XP_REWARDS.course_completed).toBe(50);
    expect(XP_REWARDS.daily_login).toBe(5);
    expect(XP_REWARDS.course_rated).toBe(2);
    expect(XP_REWARDS.achievement_unlocked).toBe(25);
  });
});

describe('computeRank', () => {
  it('returns Initiate at 0 XP', () => {
    expect(computeRank(0)).toBe('Initiate');
  });

  it('returns Initiate just below the Apprentice threshold', () => {
    expect(computeRank(99)).toBe('Initiate');
  });

  it('returns Apprentice at exactly 100 XP', () => {
    expect(computeRank(100)).toBe('Apprentice');
  });

  it('returns Scholar at 300 XP', () => {
    expect(computeRank(300)).toBe('Scholar');
  });

  it('returns Adept at 600 XP', () => {
    expect(computeRank(600)).toBe('Adept');
  });

  it('returns Expert at 1000 XP', () => {
    expect(computeRank(1000)).toBe('Expert');
  });

  it('returns Master at 2000 XP', () => {
    expect(computeRank(2000)).toBe('Master');
  });

  it('returns Grandmaster at 4000 XP', () => {
    expect(computeRank(4000)).toBe('Grandmaster');
  });

  it('returns Grandmaster well above the threshold', () => {
    expect(computeRank(99999)).toBe('Grandmaster');
  });
});

describe('rankProgressInfo', () => {
  it('returns 0% progress at the start of a rank', () => {
    const info = rankProgressInfo(100); // exactly Apprentice threshold
    expect(info.rank).toBe('Apprentice');
    expect(info.pct).toBe(0);
    expect(info.nextRank).toBe('Scholar');
  });

  it('returns 100% and no nextRank at Grandmaster', () => {
    const info = rankProgressInfo(4000);
    expect(info.rank).toBe('Grandmaster');
    expect(info.pct).toBe(100);
    expect(info.nextRank).toBeNull();
  });

  it('calculates progress percentage correctly mid-rank', () => {
    // Apprentice: 100–299. At 200 XP that is (200-100)/(300-100) = 50%
    const info = rankProgressInfo(200);
    expect(info.rank).toBe('Apprentice');
    expect(info.pct).toBe(50);
  });

  it('caps percentage at 100', () => {
    const info = rankProgressInfo(5000);
    expect(info.pct).toBe(100);
  });
});
