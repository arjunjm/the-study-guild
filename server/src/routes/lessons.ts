import { Router, Request } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getContainer, CONTAINERS } from '../config/cosmos';
import { Lesson, LessonContent, Course } from '@study-guild/shared';

type LessonParams = { courseId: string; lessonId?: string };

const router = Router({ mergeParams: true }); // mergeParams to access :courseId

const LessonContentSchema: z.ZodType<LessonContent> = z.object({
  schemaVersion: z.literal('1'),
  sections: z.array(z.discriminatedUnion('type', [
    z.object({ type: z.literal('text'), content: z.string() }),
    z.object({ type: z.literal('callout'), variant: z.enum(['info', 'warning', 'tip', 'danger']), title: z.string().optional(), content: z.string() }),
    z.object({ type: z.literal('codeBlock'), language: z.string(), code: z.string(), caption: z.string().optional() }),
    z.object({
      type: z.literal('flowDiagram'),
      title: z.string().optional(),
      nodes: z.array(z.object({ id: z.string(), label: z.string(), type: z.enum(['default', 'input', 'output', 'decision']).optional(), position: z.object({ x: z.number(), y: z.number() }) })),
      edges: z.array(z.object({ id: z.string(), source: z.string(), target: z.string(), label: z.string().optional(), animated: z.boolean().optional() })),
    }),
    z.object({
      type: z.literal('quiz'),
      title: z.string().optional(),
      questions: z.array(z.object({
        id: z.string(),
        question: z.string(),
        options: z.array(z.string()).min(2).max(6),
        correctIndex: z.number().int().min(0),
        explanation: z.string().optional(),
      })),
      passingScore: z.number().int().min(0).max(100),
    }),
    z.object({ type: z.literal('interactive'), component: z.string(), props: z.record(z.unknown()).optional() }),
  ])),
});

const LessonCreateSchema = z.object({
  title: z.string().min(3).max(120),
  order: z.number().int().min(0),
  estimatedMinutes: z.number().int().min(1),
  content: LessonContentSchema,
});

// GET /api/courses/:courseId/lessons
router.get('/', async (req: Request<LessonParams>, res) => {
  const { courseId } = req.params;
  const container = await getContainer(CONTAINERS.LESSONS);
  const { resources } = await container.items
    .query<Lesson>({
      query: 'SELECT * FROM c WHERE c.courseId = @cid',
      parameters: [{ name: '@cid', value: courseId }],
    })
    .fetchAll();
  res.json({ data: resources.sort((a, b) => a.order - b.order) });
});

// GET /api/courses/:courseId/lessons/:lessonId
router.get('/:lessonId', async (req: Request<Required<LessonParams>>, res) => {
  const { courseId, lessonId } = req.params;
  const container = await getContainer(CONTAINERS.LESSONS);
  const { resource } = await container.item(lessonId, lessonId).read<Lesson>();
  if (!resource || resource.courseId !== courseId) {
    res.status(404).json({ error: 'NotFound', message: 'Lesson not found', statusCode: 404 });
    return;
  }
  res.json({ data: resource });
});

// POST /api/courses/:courseId/lessons — teacher adds a lesson
router.post('/', authenticate, async (req: AuthenticatedRequest<LessonParams>, res) => {
  const { courseId } = req.params;
  const body = LessonCreateSchema.parse(req.body);

  const coursesContainer = await getContainer(CONTAINERS.COURSES);
  const { resource: course } = await coursesContainer.item(courseId, courseId).read<Course>();

  if (!course) {
    res.status(404).json({ error: 'NotFound', message: 'Course not found', statusCode: 404 });
    return;
  }
  if (course.authorId !== req.user!.oid) {
    res.status(403).json({ error: 'Forbidden', message: 'Only the course author can add lessons', statusCode: 403 });
    return;
  }

  const lessonsContainer = await getContainer(CONTAINERS.LESSONS);
  const lesson: Lesson = {
    id: uuidv4(),
    courseId,
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { resource: created } = await lessonsContainer.items.create(lesson);

  // Update course totals
  course.lessonIds = [...course.lessonIds, lesson.id];
  course.totalLessons = course.lessonIds.length;
  course.estimatedMinutes = course.estimatedMinutes + lesson.estimatedMinutes;
  course.updatedAt = new Date().toISOString();
  await coursesContainer.item(course.id, course.id).replace(course);

  res.status(201).json({ data: created });
});

// PUT /api/courses/:courseId/lessons/:lessonId — replace lesson content
router.put('/:lessonId', authenticate, async (req: AuthenticatedRequest<Required<LessonParams>>, res) => {
  const { courseId, lessonId } = req.params;
  const body = LessonCreateSchema.parse(req.body);

  const lessonsContainer = await getContainer(CONTAINERS.LESSONS);
  const { resource: lesson } = await lessonsContainer.item(lessonId, lessonId).read<Lesson>();

  if (!lesson || lesson.courseId !== courseId) {
    res.status(404).json({ error: 'NotFound', message: 'Lesson not found', statusCode: 404 });
    return;
  }

  const coursesContainer = await getContainer(CONTAINERS.COURSES);
  const { resource: course } = await coursesContainer.item(courseId, courseId).read<Course>();
  if (!course || course.authorId !== req.user!.oid) {
    res.status(403).json({ error: 'Forbidden', message: 'Only the course author can edit lessons', statusCode: 403 });
    return;
  }

  const updated: Lesson = { ...lesson, ...body, updatedAt: new Date().toISOString() };
  const { resource } = await lessonsContainer.item(updated.id, updated.id).replace(updated);
  res.json({ data: resource });
});

export default router;
