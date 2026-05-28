export type UserRole = 'learner' | 'teacher' | 'admin';

export type GuildRank =
  | 'Initiate'
  | 'Apprentice'
  | 'Scholar'
  | 'Adept'
  | 'Expert'
  | 'Master'
  | 'Grandmaster';

export const RANK_XP_THRESHOLDS: Record<GuildRank, number> = {
  Initiate: 0,
  Apprentice: 100,
  Scholar: 300,
  Adept: 600,
  Expert: 1000,
  Master: 2000,
  Grandmaster: 4000,
};

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  xp: number;
  rank: GuildRank;
  streak: number;
  lastLoginDate: string; // ISO date string
  createdAt: string;
  achievements: string[]; // achievement IDs
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  xpReward: number;
  criteria: AchievementCriteria;
}

export type AchievementCriteria =
  | { type: 'lessons_completed'; count: number }
  | { type: 'courses_completed'; count: number }
  | { type: 'quiz_score'; minScore: number }
  | { type: 'perfect_quizzes'; count: number }
  | { type: 'streak_days'; days: number }
  | { type: 'rank_reached'; rank: GuildRank }
  | { type: 'courses_rated'; count: number };

export interface XPEvent {
  id: string;
  userId: string;
  amount: number;
  reason: XPReason;
  referenceId?: string; // courseId, lessonId, etc.
  createdAt: string;
}

export type XPReason =
  | 'lesson_completed'
  | 'course_completed'
  | 'quiz_passed'
  | 'quiz_perfect'
  | 'daily_login'
  | 'course_rated'
  | 'achievement_unlocked';

export interface LeaderboardEntry {
  position: number;
  userId: string;
  displayName: string;
  xp: number;
  guildRank: GuildRank;
  streak: number;
  completedCourses: number;
  isCurrentUser: boolean;
}
