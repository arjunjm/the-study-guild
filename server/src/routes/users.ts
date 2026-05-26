import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getContainer, CONTAINERS } from '../config/cosmos';
import { UserProfile, Course, UserCourseProgress } from '@study-guild/shared';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/users/me — get or create current user profile
router.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  const container = await getContainer(CONTAINERS.USERS);
  const { oid, email, name } = req.user!;

  const query = {
    query: 'SELECT * FROM c WHERE c.azureOid = @oid',
    parameters: [{ name: '@oid', value: oid }],
  };
  const { resources } = await container.items.query<UserProfile & { azureOid: string }>(query).fetchAll();

  if (resources.length > 0) {
    res.json({ data: resources[0] });
    return;
  }

  // First login — provision a new user
  const newUser: UserProfile & { azureOid: string } = {
    id: uuidv4(),
    azureOid: oid,
    email,
    displayName: name,
    role: 'learner',
    xp: 0,
    rank: 'Initiate',
    streak: 0,
    lastLoginDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    achievements: [],
  };
  const { resource } = await container.items.create(newUser);
  res.status(201).json({ data: resource });
});

// PATCH /api/users/me — update display name or role (learner <-> teacher)
router.patch('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  const container = await getContainer(CONTAINERS.USERS);
  const { oid } = req.user!;

  const query = {
    query: 'SELECT * FROM c WHERE c.azureOid = @oid',
    parameters: [{ name: '@oid', value: oid }],
  };
  const { resources } = await container.items.query<UserProfile & { azureOid: string; id: string }>(query).fetchAll();
  if (!resources.length) {
    res.status(404).json({ error: 'NotFound', message: 'User not found', statusCode: 404 });
    return;
  }

  const user = resources[0];
  const allowed = ['displayName', 'role', 'avatarUrl', 'bio'] as const;
  for (const key of allowed) {
    if (req.body[key] !== undefined) (user as unknown as Record<string, unknown>)[key] = req.body[key];
  }

  const { resource } = await container.item(user.id, user.id).replace(user);
  res.json({ data: resource });
});

// GET /api/users/me/courses — all courses authored by the current user
router.get('/me/courses', authenticate, async (req: AuthenticatedRequest, res) => {
  const container = await getContainer(CONTAINERS.COURSES);
  const { resources } = await container.items
    .query<Course>({
      query: 'SELECT * FROM c WHERE c.authorId = @oid',
      parameters: [{ name: '@oid', value: req.user!.oid }],
    })
    .fetchAll();
  res.json({ data: resources });
});

// GET /api/users/me/progress — courses with completion data for the current user
router.get('/me/progress', authenticate, async (req: AuthenticatedRequest, res) => {
  const progressContainer = await getContainer(CONTAINERS.PROGRESS);
  const coursesContainer = await getContainer(CONTAINERS.COURSES);

  // Fetch all progress records for this user
  const { resources: progressRecords } = await progressContainer.items
    .query<UserCourseProgress>({
      query: 'SELECT * FROM c WHERE c.userId = @uid',
      parameters: [{ name: '@uid', value: req.user!.oid }],
    })
    .fetchAll();

  if (!progressRecords.length) {
    res.json({ data: [] });
    return;
  }

  // Fetch corresponding courses
  const courseIds = progressRecords.map(p => p.courseId);
  const placeholders = courseIds.map((_, i) => `@id${i}`).join(', ');
  const { resources: courses } = await coursesContainer.items
    .query<Course>({
      query: `SELECT * FROM c WHERE c.id IN (${placeholders})`,
      parameters: courseIds.map((id, i) => ({ name: `@id${i}`, value: id })),
    })
    .fetchAll();

  const courseMap = new Map(courses.map(c => [c.id, c]));
  const result = progressRecords
    .map(p => {
      const course = courseMap.get(p.courseId);
      if (!course) return null;
      return {
        course,
        completedCount: p.completedLessonIds.length,
        totalLessons: course.totalLessons,
      };
    })
    .filter(Boolean);

  res.json({ data: result });
});

// GET /api/users/:id/profile — public profile
router.get('/:id/profile', async (req, res) => {
  const container = await getContainer(CONTAINERS.USERS);
  const { resource } = await container.item(req.params.id, req.params.id).read<UserProfile>();
  if (!resource) {
    res.status(404).json({ error: 'NotFound', message: 'User not found', statusCode: 404 });
    return;
  }
  // Only expose public fields
  const { id, displayName, avatarUrl, rank, xp, achievements, createdAt } = resource;
  res.json({ data: { id, displayName, avatarUrl, rank, xp, achievements, createdAt } });
});

export default router;
