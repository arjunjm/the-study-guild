import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getContainer, CONTAINERS } from '../config/cosmos';
import {
  UserCourseProgress, UserProfile, GuildRank, RANK_XP_THRESHOLDS,
  XPEvent, XPReason, Course, Lesson,
} from '@study-guild/shared';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const XP_REWARDS: Record<XPReason, number> = {
  lesson_completed: 10,
  course_completed: 50,
  quiz_passed: 20,
  quiz_perfect: 40,
  daily_login: 5,
  course_rated: 2,
  achievement_unlocked: 25,
};

function computeRank(xp: number): GuildRank {
  const ranks = Object.entries(RANK_XP_THRESHOLDS).sort((a, b) => b[1] - a[1]);
  for (const [rank, threshold] of ranks) {
    if (xp >= threshold) return rank as GuildRank;
  }
  return 'Initiate';
}

async function awardXP(internalUserId: string, reason: XPReason, referenceId?: string): Promise<XPEvent> {
  const amount = XP_REWARDS[reason];
  const xpContainer = await getContainer(CONTAINERS.XP_EVENTS);
  const usersContainer = await getContainer(CONTAINERS.USERS);

  const event: XPEvent = {
    id: uuidv4(),
    userId: internalUserId,
    amount,
    reason,
    referenceId,
    createdAt: new Date().toISOString(),
  };
  await xpContainer.items.create(event);

  const { resources } = await usersContainer.items
    .query<UserProfile & { id: string }>({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: internalUserId }],
    })
    .fetchAll();

  if (resources.length) {
    const user = resources[0];
    user.xp += amount;
    user.rank = computeRank(user.xp);
    await usersContainer.item(user.id, user.id).replace(user);
  }

  return event;
}

// POST /api/progress/lesson-complete
router.post('/lesson-complete', authenticate, async (req: AuthenticatedRequest, res) => {
  const { courseId, lessonId, quizScore } = z.object({
    courseId: z.string(),
    lessonId: z.string(),
    quizScore: z.number().int().min(0).max(100).optional(),
  }).parse(req.body);

  // Look up internal user record via Azure OID
  const usersContainer = await getContainer(CONTAINERS.USERS);
  const { resources: userResources } = await usersContainer.items
    .query<UserProfile & { id: string }>({
      query: 'SELECT * FROM c WHERE c.azureOid = @oid',
      parameters: [{ name: '@oid', value: req.user!.oid }],
    })
    .fetchAll();

  if (!userResources.length) {
    res.status(404).json({ error: 'NotFound', message: 'User not found', statusCode: 404 });
    return;
  }

  const user = userResources[0];
  const prevRank = user.rank;

  const progressContainer = await getContainer(CONTAINERS.PROGRESS);
  const progressId = `${req.user!.oid}#${courseId}`;

  let progress: UserCourseProgress;
  try {
    const { resource } = await progressContainer.item(progressId, progressId).read<UserCourseProgress>();
    progress = resource ?? {
      id: progressId,
      userId: req.user!.oid,
      courseId,
      completedLessonIds: [],
      lastAccessedAt: new Date().toISOString(),
      quizScores: {},
    };
  } catch {
    progress = {
      id: progressId,
      userId: req.user!.oid,
      courseId,
      completedLessonIds: [],
      lastAccessedAt: new Date().toISOString(),
      quizScores: {},
    };
  }

  const alreadyCompleted = progress.completedLessonIds.includes(lessonId);
  let xpGained = 0;
  const breakdown: { label: string; amount: number }[] = [];

  if (!alreadyCompleted) {
    progress.completedLessonIds.push(lessonId);
    await awardXP(user.id, 'lesson_completed', lessonId);
    xpGained += XP_REWARDS.lesson_completed;
    breakdown.push({ label: 'Lesson complete', amount: XP_REWARDS.lesson_completed });
  }

  // Handle quiz score
  if (quizScore !== undefined) {
    let passingScore = 70;
    try {
      const lessonsContainer = await getContainer(CONTAINERS.LESSONS);
      const { resource: lesson } = await lessonsContainer.item(lessonId, lessonId).read<Lesson>();
      if (lesson) {
        const quizSection = lesson.content.sections.find(s => s.type === 'quiz');
        if (quizSection?.type === 'quiz') passingScore = quizSection.passingScore;
      }
    } catch { /* use default passing score */ }

    const wasAlreadyPassed = (progress.quizScores[lessonId] ?? 0) >= passingScore;
    progress.quizScores[lessonId] = quizScore;

    if (!wasAlreadyPassed && quizScore >= passingScore) {
      const quizReason: XPReason = quizScore === 100 ? 'quiz_perfect' : 'quiz_passed';
      await awardXP(user.id, quizReason, lessonId);
      const quizXP = XP_REWARDS[quizReason];
      xpGained += quizXP;
      breakdown.push({ label: quizScore === 100 ? 'Perfect quiz!' : 'Quiz passed', amount: quizXP });
    }
  }

  // Award course completion bonus if all lessons done
  if (!alreadyCompleted) {
    try {
      const coursesContainer = await getContainer(CONTAINERS.COURSES);
      const { resource: course } = await coursesContainer.item(courseId, courseId).read<Course>();
      if (course && progress.completedLessonIds.length >= course.totalLessons) {
        await awardXP(user.id, 'course_completed', courseId);
        xpGained += XP_REWARDS.course_completed;
        breakdown.push({ label: 'Course complete!', amount: XP_REWARDS.course_completed });
        progress.completedAt = new Date().toISOString();
      }
    } catch { /* skip if course not found */ }
  }

  progress.lastAccessedAt = new Date().toISOString();
  await progressContainer.items.upsert(progress);

  // Fetch updated user (rank + achievements) after all XP awards
  const { resources: updatedArr } = await usersContainer.items
    .query<UserProfile & { id: string; azureOid: string; achievements: string[] }>({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: user.id }],
    })
    .fetchAll();
  const updatedUser = updatedArr[0];
  const newRank = updatedUser?.rank ?? prevRank;

  // Achievement evaluation — evaluate after XP updates so rank is current
  const newAchievements: string[] = [];
  if (updatedUser && !alreadyCompleted) {
    const earned = new Set(updatedUser.achievements ?? []);

    // Count total completed lessons across all progress records for this user
    const { resources: allUserProgress } = await progressContainer.items
      .query<UserCourseProgress>({
        query: 'SELECT * FROM c WHERE c.userId = @uid',
        parameters: [{ name: '@uid', value: req.user!.oid }],
      })
      .fetchAll();

    const totalLessonsCompleted = allUserProgress.reduce((sum, p) => sum + p.completedLessonIds.length, 0);
    const totalCoursesCompleted = allUserProgress.filter(p => !!p.completedAt).length;
    const totalPerfectQuizzes = Object.values(Object.assign({}, ...allUserProgress.map(p => p.quizScores))).filter((s) => s === 100).length;

    const ACHIEVEMENTS: Array<{ id: string; label: string; check: () => boolean }> = [
      { id: 'first-lesson',   label: 'First Step',      check: () => totalLessonsCompleted >= 1 },
      { id: 'ten-lessons',    label: 'Dedicated Learner', check: () => totalLessonsCompleted >= 10 },
      { id: 'fifty-lessons',  label: 'Knowledge Seeker', check: () => totalLessonsCompleted >= 50 },
      { id: 'first-course',   label: 'Course Complete',  check: () => totalCoursesCompleted >= 1 },
      { id: 'five-courses',   label: 'Guild Scholar',    check: () => totalCoursesCompleted >= 5 },
      { id: 'quiz-perfect',   label: 'Perfect Score',    check: () => totalPerfectQuizzes >= 1 },
      { id: 'quiz-master',    label: 'Quiz Master',      check: () => totalPerfectQuizzes >= 5 },
      { id: 'rank-apprentice',label: 'Apprentice',       check: () => ['Apprentice','Scholar','Adept','Expert','Master','Grandmaster'].includes(newRank) },
      { id: 'rank-scholar',   label: 'Scholar',          check: () => ['Scholar','Adept','Expert','Master','Grandmaster'].includes(newRank) },
      { id: 'rank-expert',    label: 'Expert',           check: () => ['Expert','Master','Grandmaster'].includes(newRank) },
    ];

    for (const ach of ACHIEVEMENTS) {
      if (!earned.has(ach.id) && ach.check()) {
        earned.add(ach.id);
        newAchievements.push(ach.id);
        await awardXP(user.id, 'achievement_unlocked', ach.id);
        xpGained += XP_REWARDS.achievement_unlocked;
        breakdown.push({ label: `Achievement: ${ach.label}`, amount: XP_REWARDS.achievement_unlocked });
      }
    }

    if (newAchievements.length > 0) {
      updatedUser.achievements = [...earned];
      await usersContainer.item(user.id, user.id).replace(updatedUser);
    }
  }

  res.json({
    data: {
      progress,
      xpGained,
      breakdown,
      rankChanged: newRank !== prevRank,
      prevRank,
      newRank,
      alreadyCompleted,
      newAchievements,
    },
  });
});

// GET /api/progress (all progress for current user)
router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  const container = await getContainer(CONTAINERS.PROGRESS);
  const { resources } = await container.items
    .query<UserCourseProgress>({
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: req.user!.oid }],
    })
    .fetchAll();
  res.json({ data: resources });
});

// GET /api/progress/:courseId
router.get('/:courseId', authenticate, async (req: AuthenticatedRequest, res) => {
  const container = await getContainer(CONTAINERS.PROGRESS);
  const progressId = `${req.user!.oid}#${req.params.courseId}`;
  try {
    const { resource } = await container.item(progressId, progressId).read<UserCourseProgress>();
    res.json({ data: resource ?? null });
  } catch {
    res.json({ data: null });
  }
});

// POST /api/progress/daily-login
router.post('/daily-login', authenticate, async (req: AuthenticatedRequest, res) => {
  const usersContainer = await getContainer(CONTAINERS.USERS);
  const { resources } = await usersContainer.items
    .query<UserProfile & { id: string; azureOid: string }>({
      query: 'SELECT * FROM c WHERE c.azureOid = @oid',
      parameters: [{ name: '@oid', value: req.user!.oid }],
    })
    .fetchAll();

  if (!resources.length) {
    res.status(404).json({ error: 'NotFound', message: 'User not found', statusCode: 404 });
    return;
  }

  const user = resources[0];
  const today = new Date().toISOString().split('T')[0];

  if (user.lastLoginDate === today) {
    res.json({ data: { alreadyClaimed: true, xpAwarded: 0, streak: user.streak } });
    return;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  user.streak = user.lastLoginDate === yesterday ? user.streak + 1 : 1;
  user.lastLoginDate = today;

  // Streak achievements
  const earned = new Set(user.achievements ?? []);
  const streakAchs = [
    { id: 'streak-3',  days: 3,  label: '3-Day Streak' },
    { id: 'streak-7',  days: 7,  label: 'Week Warrior' },
    { id: 'streak-30', days: 30, label: 'Monthly Champion' },
  ];
  let bonusXP = 0;
  for (const s of streakAchs) {
    if (!earned.has(s.id) && user.streak >= s.days) {
      earned.add(s.id);
      await awardXP(user.id, 'achievement_unlocked', s.id);
      bonusXP += XP_REWARDS.achievement_unlocked;
    }
  }
  user.achievements = [...earned];
  await usersContainer.item(user.id, user.id).replace(user);

  const event = await awardXP(user.id, 'daily_login');
  res.json({ data: { alreadyClaimed: false, xpAwarded: event.amount + bonusXP, streak: user.streak } });
});

export default router;
