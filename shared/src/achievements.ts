import type { Achievement, GuildRank } from './types/user';

export type AchievementCategory = 'learning' | 'course' | 'quiz' | 'streak' | 'rank' | 'community';

export interface AchievementDefinition extends Achievement {
  icon: string;
  category: AchievementCategory;
}

export interface AchievementEvaluationContext {
  lessonsCompleted: number;
  coursesCompleted: number;
  quizScores: number[];
  perfectQuizzes: number;
  streakDays: number;
  rank: GuildRank;
  coursesRated: number;
}

const RANK_ORDER: GuildRank[] = ['Initiate', 'Apprentice', 'Scholar', 'Adept', 'Expert', 'Master', 'Grandmaster'];

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first-lesson',
    name: 'First Step',
    description: 'Complete your first lesson.',
    icon: '📚',
    category: 'learning',
    xpReward: 25,
    criteria: { type: 'lessons_completed', count: 1 },
  },
  {
    id: 'ten-lessons',
    name: 'Dedicated Learner',
    description: 'Complete 10 lessons.',
    icon: '📖',
    category: 'learning',
    xpReward: 25,
    criteria: { type: 'lessons_completed', count: 10 },
  },
  {
    id: 'fifty-lessons',
    name: 'Knowledge Seeker',
    description: 'Complete 50 lessons.',
    icon: '🎯',
    category: 'learning',
    xpReward: 25,
    criteria: { type: 'lessons_completed', count: 50 },
  },
  {
    id: 'first-course',
    name: 'Course Complete',
    description: 'Complete your first course.',
    icon: '🎓',
    category: 'course',
    xpReward: 25,
    criteria: { type: 'courses_completed', count: 1 },
  },
  {
    id: 'five-courses',
    name: 'Guild Scholar',
    description: 'Complete five courses.',
    icon: '🏫',
    category: 'course',
    xpReward: 25,
    criteria: { type: 'courses_completed', count: 5 },
  },
  {
    id: 'quiz-perfect',
    name: 'Perfect Score',
    description: 'Earn 100% on a quiz.',
    icon: '⭐',
    category: 'quiz',
    xpReward: 25,
    criteria: { type: 'quiz_score', minScore: 100 },
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Earn five perfect quiz scores.',
    icon: '🧠',
    category: 'quiz',
    xpReward: 25,
    criteria: { type: 'perfect_quizzes', count: 5 },
  },
  {
    id: 'streak-3',
    name: '3-Day Streak',
    description: 'Check in for three days in a row.',
    icon: '🔥',
    category: 'streak',
    xpReward: 25,
    criteria: { type: 'streak_days', days: 3 },
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Check in for seven days in a row.',
    icon: '🔥',
    category: 'streak',
    xpReward: 25,
    criteria: { type: 'streak_days', days: 7 },
  },
  {
    id: 'streak-30',
    name: 'Monthly Champion',
    description: 'Check in for 30 days in a row.',
    icon: '👑',
    category: 'streak',
    xpReward: 25,
    criteria: { type: 'streak_days', days: 30 },
  },
  {
    id: 'rank-apprentice',
    name: 'Apprentice',
    description: 'Reach Apprentice rank.',
    icon: '🟢',
    category: 'rank',
    xpReward: 25,
    criteria: { type: 'rank_reached', rank: 'Apprentice' },
  },
  {
    id: 'rank-scholar',
    name: 'Scholar',
    description: 'Reach Scholar rank.',
    icon: '🔵',
    category: 'rank',
    xpReward: 25,
    criteria: { type: 'rank_reached', rank: 'Scholar' },
  },
  {
    id: 'rank-expert',
    name: 'Expert',
    description: 'Reach Expert rank.',
    icon: '🟡',
    category: 'rank',
    xpReward: 25,
    criteria: { type: 'rank_reached', rank: 'Expert' },
  },
  {
    id: 'course-rater',
    name: 'Helpful Reviewer',
    description: 'Rate your first course.',
    icon: '💬',
    category: 'community',
    xpReward: 25,
    criteria: { type: 'courses_rated', count: 1 },
  },
];

export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
  if (id === 'seven-day-streak') return ACHIEVEMENT_DEFINITIONS.find(achievement => achievement.id === 'streak-7');
  if (id === 'course-complete') return ACHIEVEMENT_DEFINITIONS.find(achievement => achievement.id === 'first-course');
  return ACHIEVEMENT_DEFINITIONS.find(achievement => achievement.id === id);
}

export function evaluateAchievementIds(
  context: AchievementEvaluationContext,
  alreadyEarned: Iterable<string> = [],
): string[] {
  const earned = new Set(alreadyEarned);
  return ACHIEVEMENT_DEFINITIONS
    .filter(achievement => !earned.has(achievement.id) && meetsAchievementCriteria(achievement, context))
    .map(achievement => achievement.id);
}

function meetsAchievementCriteria(achievement: AchievementDefinition, context: AchievementEvaluationContext): boolean {
  const criteria = achievement.criteria;
  switch (criteria.type) {
    case 'lessons_completed':
      return context.lessonsCompleted >= criteria.count;
    case 'courses_completed':
      return context.coursesCompleted >= criteria.count;
    case 'quiz_score':
      return context.quizScores.some(score => score >= criteria.minScore);
    case 'perfect_quizzes':
      return context.perfectQuizzes >= criteria.count;
    case 'streak_days':
      return context.streakDays >= criteria.days;
    case 'rank_reached':
      return RANK_ORDER.indexOf(context.rank) >= RANK_ORDER.indexOf(criteria.rank);
    case 'courses_rated':
      return context.coursesRated >= criteria.count;
  }
}
