import { describe, it, expect } from 'vitest';
import { resolveMock } from '../mockInterceptors';
import { MOCK_COURSES, MOCK_LESSONS } from '../mockData';

describe('resolveMock — users', () => {
  it('GET /users/me returns a user with id and xp', async () => {
    const res = await resolveMock('/users/me', 'get');
    expect(res.data.data).toMatchObject({ id: expect.any(String), xp: expect.any(Number) });
  });

  it('PATCH /users/me merges the patch', async () => {
    const res = await resolveMock('/users/me', 'patch', JSON.stringify({ displayName: 'Tester' }));
    expect(res.data.data).toMatchObject({ displayName: 'Tester' });
  });

  it('GET /users/me/courses returns courses for the teacher author', async () => {
    const res = await resolveMock('/users/me/courses', 'get');
    const courses = res.data.data as { authorId: string }[];
    expect(Array.isArray(courses)).toBe(true);
    courses.forEach(c => expect(c.authorId).toBe('teacher-001'));
  });
});

describe('resolveMock — courses', () => {
  it('GET /courses returns all courses by default', async () => {
    const res = await resolveMock('/courses', 'get');
    expect(Array.isArray(res.data.data)).toBe(true);
    expect((res.data.data as unknown[]).length).toBeGreaterThan(0);
  });

  it('GET /courses?l1=Security filters by category', async () => {
    const res = await resolveMock('/courses?l1=Security', 'get');
    const courses = res.data.data as { taxonomy: { l1: string } }[];
    courses.forEach(c => expect(c.taxonomy.l1).toBe('Security'));
  });

  it('GET /courses?difficulty=beginner filters by difficulty', async () => {
    const res = await resolveMock('/courses?difficulty=beginner', 'get');
    const courses = res.data.data as { difficulty: string }[];
    courses.forEach(c => expect(c.difficulty).toBe('beginner'));
  });

  it('GET /courses?search=oauth returns relevant results', async () => {
    const res = await resolveMock('/courses?search=oauth', 'get');
    const courses = res.data.data as { title: string; description: string; tags: string[] }[];
    expect(courses.length).toBeGreaterThan(0);
    courses.forEach(c => {
      const text = [c.title, c.description, ...c.tags].join(' ').toLowerCase();
      expect(text).toContain('oauth');
    });
  });

  it('GET /courses/:id returns the correct course', async () => {
    const id = MOCK_COURSES[0].id;
    const res = await resolveMock(`/courses/${id}`, 'get');
    expect((res.data.data as { id: string }).id).toBe(id);
  });

  it('GET /courses/:id 404s for unknown id', async () => {
    await expect(resolveMock('/courses/does-not-exist', 'get')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it('POST /courses creates a new course with generated id', async () => {
    const res = await resolveMock('/courses', 'post', JSON.stringify({ title: 'New', description: 'Desc', taxonomy: { l1: 'Security', l2: 'Auth' }, difficulty: 'beginner', tags: [] }));
    const course = res.data.data as { id: string; published: boolean };
    expect(course.id).toMatch(/^course-new-/);
    expect(course.published).toBe(false);
  });

  it('POST /courses/:id/publish marks as published', async () => {
    const id = MOCK_COURSES[0].id;
    const res = await resolveMock(`/courses/${id}/publish`, 'post');
    expect((res.data.data as { published: boolean }).published).toBe(true);
  });
});

describe('resolveMock — lessons', () => {
  it('GET /courses/:id/lessons returns lessons for that course', async () => {
    const courseId = MOCK_LESSONS[0].courseId;
    const res = await resolveMock(`/courses/${courseId}/lessons`, 'get');
    const lessons = res.data.data as { courseId: string }[];
    expect(lessons.length).toBeGreaterThan(0);
    lessons.forEach(l => expect(l.courseId).toBe(courseId));
  });

  it('GET /courses/:cid/lessons/:lid returns a single lesson', async () => {
    const { id, courseId } = MOCK_LESSONS[0];
    const res = await resolveMock(`/courses/${courseId}/lessons/${id}`, 'get');
    expect((res.data.data as { id: string }).id).toBe(id);
  });

  it('GET /courses/:cid/lessons/:lid 404s for unknown lesson', async () => {
    await expect(resolveMock('/courses/course-001/lessons/no-such-lesson', 'get')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});

describe('resolveMock — leaderboard', () => {
  it('returns an array of entries with required fields', async () => {
    const res = await resolveMock('/leaderboard?period=alltime', 'get');
    const entries = res.data.data as { position: number; xp: number; displayName: string }[];
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].position).toBe(1);
    entries.forEach(e => {
      expect(typeof e.xp).toBe('number');
      expect(typeof e.displayName).toBe('string');
    });
  });

  it('leaderboard entries are sorted by position', async () => {
    const res = await resolveMock('/leaderboard?period=alltime', 'get');
    const positions = (res.data.data as { position: number }[]).map(e => e.position);
    const sorted = [...positions].sort((a, b) => a - b);
    expect(positions).toEqual(sorted);
  });
});

describe('resolveMock — progress', () => {
  it('POST /progress/daily-login returns xpAwarded', async () => {
    const res = await resolveMock('/progress/daily-login', 'post');
    expect((res.data.data as { xpAwarded: number }).xpAwarded).toBe(5);
  });

  it('POST /progress/lesson-complete returns updated progress', async () => {
    const lesson = MOCK_LESSONS[0];
    const res = await resolveMock('/progress/lesson-complete', 'post', JSON.stringify({
      lessonId: lesson.id,
      courseId: lesson.courseId,
    }));
    expect(res.data.data).toMatchObject({ progress: expect.anything() });
  });
});
