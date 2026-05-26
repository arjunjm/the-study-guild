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

  // Fetch updated rank after all XP awards
  const { resources: updatedArr } = await usersContainer.items
    .query<UserProfile>({
      query: 'SELECT c.rank FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: user.id }],
    })
    .fetchAll();
  const newRank = updatedArr[0]?.rank ?? prevRank;

  res.json({
    data: {
      progress,
      xpGained,
      breakdown,
      rankChanged: newRank !== prevRank,
      prevRank,
      newRank,
      alreadyCompleted,
    },
  });
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
  await usersContainer.item(user.id, user.id).replace(user);

  const event = await awardXP(user.id, 'daily_login');
  res.json({ data: { alreadyClaimed: false, xpAwarded: event.amount, streak: user.streak } });
});

export default router;
