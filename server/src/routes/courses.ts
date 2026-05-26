import { Router, Request } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getContainer, CONTAINERS } from '../config/cosmos';
import { Course, CourseRating } from '@study-guild/shared';

type IdParams = { id: string };

const router = Router();

const CourseCreateSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(1000),
  taxonomy: z.object({ l1: z.string(), l2: z.string() }),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  tags: z.array(z.string()).default([]),
  thumbnailUrl: z.string().url().optional(),
});

// GET /api/courses — list published courses with optional filtering
router.get('/', async (req, res) => {
  const container = await getContainer(CONTAINERS.COURSES);
  const { l1, l2, difficulty, search } = req.query as Record<string, string>;

  let queryStr = 'SELECT * FROM c WHERE c.published = true';
  const parameters: { name: string; value: string }[] = [];

  if (l1) { queryStr += ' AND c.taxonomy.l1 = @l1'; parameters.push({ name: '@l1', value: l1 }); }
  if (l2) { queryStr += ' AND c.taxonomy.l2 = @l2'; parameters.push({ name: '@l2', value: l2 }); }
  if (difficulty) { queryStr += ' AND c.difficulty = @difficulty'; parameters.push({ name: '@difficulty', value: difficulty }); }

  const { resources } = await container.items.query<Course>({ query: queryStr, parameters }).fetchAll();

  const results = search
    ? resources.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      )
    : resources;

  res.json({ data: results, total: results.length });
});

// GET /api/courses/taxonomies — distinct L1/L2 values
router.get('/taxonomies', async (_req, res) => {
  const container = await getContainer(CONTAINERS.COURSES);
  const { resources } = await container.items
    .query<Course>('SELECT c.taxonomy FROM c WHERE c.published = true')
    .fetchAll();

  const map = new Map<string, Set<string>>();
  for (const { taxonomy } of resources) {
    if (!map.has(taxonomy.l1)) map.set(taxonomy.l1, new Set());
    map.get(taxonomy.l1)!.add(taxonomy.l2);
  }

  const taxonomies = Array.from(map.entries()).map(([l1, l2Set]) => ({
    l1,
    l2: Array.from(l2Set),
  }));

  res.json({ data: taxonomies });
});

// GET /api/courses/:id
router.get('/:id', async (req: Request<IdParams>, res) => {
  const id = req.params.id;
  const container = await getContainer(CONTAINERS.COURSES);
  const { resource } = await container.item(id, id).read<Course>();
  if (!resource || !resource.published) {
    res.status(404).json({ error: 'NotFound', message: 'Course not found', statusCode: 404 });
    return;
  }
  res.json({ data: resource });
});

// POST /api/courses — teacher creates a course
router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
  const body = CourseCreateSchema.parse(req.body);
  const container = await getContainer(CONTAINERS.COURSES);

  const course: Course = {
    id: uuidv4(),
    ...body,
    authorId: req.user!.oid,
    authorName: req.user!.name,
    published: false,
    lessonIds: [],
    totalLessons: 0,
    estimatedMinutes: 0,
    ratingAverage: 0,
    ratingCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { resource } = await container.items.create(course);
  res.status(201).json({ data: resource });
});

// PATCH /api/courses/:id — update course (author only)
router.patch('/:id', authenticate, async (req: AuthenticatedRequest<IdParams>, res) => {
  const id = req.params.id;
  const container = await getContainer(CONTAINERS.COURSES);
  const { resource } = await container.item(id, id).read<Course>();

  if (!resource) {
    res.status(404).json({ error: 'NotFound', message: 'Course not found', statusCode: 404 });
    return;
  }
  if (resource.authorId !== req.user!.oid) {
    res.status(403).json({ error: 'Forbidden', message: 'Only the author can edit this course', statusCode: 403 });
    return;
  }

  const allowed = ['title', 'description', 'taxonomy', 'difficulty', 'tags', 'thumbnailUrl'] as const;
  for (const key of allowed) {
    if (req.body[key] !== undefined) (resource as unknown as Record<string, unknown>)[key] = req.body[key];
  }
  resource.updatedAt = new Date().toISOString();

  const { resource: updated } = await container.item(resource.id, resource.id).replace(resource);
  res.json({ data: updated });
});

// POST /api/courses/:id/publish — teacher publishes their course
router.post('/:id/publish', authenticate, async (req: AuthenticatedRequest<IdParams>, res) => {
  const id = req.params.id;
  const container = await getContainer(CONTAINERS.COURSES);
  const { resource } = await container.item(id, id).read<Course>();

  if (!resource) {
    res.status(404).json({ error: 'NotFound', message: 'Course not found', statusCode: 404 });
    return;
  }
  if (resource.authorId !== req.user!.oid) {
    res.status(403).json({ error: 'Forbidden', message: 'Only the author can publish this course', statusCode: 403 });
    return;
  }
  if (resource.totalLessons === 0) {
    res.status(400).json({ error: 'BadRequest', message: 'Cannot publish a course with no lessons', statusCode: 400 });
    return;
  }

  resource.published = true;
  resource.publishedAt = new Date().toISOString();
  resource.updatedAt = new Date().toISOString();

  const { resource: updated } = await container.item(resource.id, resource.id).replace(resource);
  res.json({ data: updated });
});

// POST /api/courses/:id/rate
router.post('/:id/rate', authenticate, async (req: AuthenticatedRequest<IdParams>, res) => {
  const id = req.params.id;
  const { rating, review } = z.object({
    rating: z.number().int().min(1).max(5),
    review: z.string().max(500).optional(),
  }).parse(req.body);

  const ratingsContainer = await getContainer(CONTAINERS.RATINGS);
  const coursesContainer = await getContainer(CONTAINERS.COURSES);

  const ratingId = `${req.user!.oid}#${id}`;
  const newRating: CourseRating = {
    id: ratingId,
    userId: req.user!.oid,
    courseId: id,
    rating,
    review,
    createdAt: new Date().toISOString(),
  };

  await ratingsContainer.items.upsert(newRating);

  // Recompute average
  const { resources: allRatings } = await ratingsContainer.items
    .query<CourseRating>({
      query: 'SELECT c.rating FROM c WHERE c.courseId = @cid',
      parameters: [{ name: '@cid', value: id }],
    })
    .fetchAll();

  const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

  const { resource: course } = await coursesContainer.item(id, id).read<Course>();
  if (course) {
    course.ratingAverage = Math.round(avg * 10) / 10;
    course.ratingCount = allRatings.length;
    await coursesContainer.item(course.id, course.id).replace(course);
  }

  res.json({ data: newRating });
});

export default router;
