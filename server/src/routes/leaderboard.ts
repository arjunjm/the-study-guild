import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getContainer, CONTAINERS } from '../config/cosmos';
import { UserProfile, UserCourseProgress } from '@study-guild/shared';

const router = Router();

// GET /api/leaderboard — top learners sorted by XP
router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  const usersContainer = await getContainer(CONTAINERS.USERS);
  const progressContainer = await getContainer(CONTAINERS.PROGRESS);

  // Fetch top 50 users by XP
  const { resources: users } = await usersContainer.items
    .query<UserProfile & { id: string; azureOid: string }>({
      query: 'SELECT TOP 50 * FROM c ORDER BY c.xp DESC',
    })
    .fetchAll();

  if (!users.length) {
    res.json({ data: [] });
    return;
  }

  // Get completed course counts for each user
  const userIds = users.map(u => u.id);
  const placeholders = userIds.map((_, i) => `@uid${i}`).join(', ');
  const { resources: progressRecords } = await progressContainer.items
    .query<UserCourseProgress & { completedAt?: string }>({
      query: `SELECT * FROM c WHERE c.userId IN (${placeholders})`,
      parameters: userIds.map((id, i) => ({ name: `@uid${i}`, value: id })),
    })
    .fetchAll();

  const completedCoursesMap = new Map<string, number>();
  for (const p of progressRecords) {
    if (p.completedAt) {
      completedCoursesMap.set(p.userId, (completedCoursesMap.get(p.userId) ?? 0) + 1);
    }
  }

  const currentUserOid = req.user!.oid;

  const entries = users.map((user, i) => ({
    position: i + 1,
    userId: user.id,
    displayName: user.displayName,
    xp: user.xp,
    guildRank: user.rank,
    streak: user.streak,
    completedCourses: completedCoursesMap.get(user.id) ?? 0,
    isCurrentUser: user.azureOid === currentUserOid,
  }));

  res.json({ data: entries });
});

export default router;
