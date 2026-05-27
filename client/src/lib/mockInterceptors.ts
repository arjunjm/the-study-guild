import type { AxiosInstance } from 'axios';
import {
  getMockUser, getMockProgress, getAllMockProgress, completeMockLesson, getMockCourseProgress, getMockLeaderboard,
  patchMockUser, getMockLesson, putMockLesson, MOCK_COURSES, MOCK_LESSONS, MOCK_TAXONOMIES,
} from './mockData';

export function installMockInterceptors(client: AxiosInstance) {
  // Replace the HTTP adapter entirely — no request ever hits the real server in dev mode.
  client.interceptors.request.use((config) => {
    const url = config.url ?? '';
    const method = (config.method ?? 'get').toLowerCase();
    const rawData = config.data;
    config.adapter = async (cfg) => {
      const body = typeof rawData === 'string' ? rawData : (rawData ? JSON.stringify(rawData) : undefined);
      const result = await resolveMock(url, method, body);
      return { ...result, config: cfg } as any;
    };
    return config;
  });
}

function ok(data: unknown) {
  return Promise.resolve({ data: { data }, status: 200, statusText: 'OK', headers: {}, config: {} });
}

export function resolveMock(url: string, method: string, body?: string) {
  const parsed = (() => { try { return JSON.parse(body ?? '{}'); } catch { return {}; } })();

  // Users
  if (url.endsWith('/users/me/progress') && method === 'get') return ok(getMockCourseProgress());
  if (url.endsWith('/users/me/courses') && method === 'get') return ok(MOCK_COURSES.filter(c => c.authorId === 'teacher-001'));
  if (url.endsWith('/users/me') && method === 'get') return ok(getMockUser());
  if (url.endsWith('/users/me') && method === 'patch') return ok(patchMockUser(parsed));
  if (url.match(/\/users\/.+\/profile/)) return ok(getMockUser());

  // Courses
  if (url.endsWith('/courses/taxonomies')) return ok(MOCK_TAXONOMIES);
  if (url.match(/\/courses\/[^/]+\/lessons\/[^/]+$/) && method === 'get') {
    const lessonId = url.split('/').pop()!;
    const lesson = getMockLesson(lessonId);
    return lesson ? ok(lesson) : Promise.reject({ response: { status: 404 } });
  }
  if (url.match(/\/courses\/[^/]+\/lessons\/[^/]+$/) && method === 'put') {
    const lessonId = url.split('/').pop()!;
    const lesson = putMockLesson(lessonId, parsed);
    return lesson ? ok(lesson) : Promise.reject({ response: { status: 404 } });
  }
  if (url.match(/\/courses\/[^/]+\/lessons\/[^/]+$/) && method === 'delete') {
    return ok({ deleted: true });
  }
  if (url.match(/\/courses\/[^/]+\/lessons/) && method === 'get') {
    const courseId = url.split('/courses/')[1].split('/')[0];
    return ok(MOCK_LESSONS.filter(l => l.courseId === courseId).map(l => getMockLesson(l.id)!));
  }
  if (url.match(/\/courses\/[^/]+\/lessons/) && method === 'post') {
    return ok({ ...parsed, id: `lesson-new-${Date.now()}`, courseId: url.split('/courses/')[1].split('/')[0] });
  }
  if (url.match(/\/courses\/[^/]+\/publish/) && method === 'post') {
    const courseId = url.split('/courses/')[1].split('/')[0];
    const course = MOCK_COURSES.find(c => c.id === courseId);
    return ok({ ...course, published: true });
  }
  if (url.match(/\/courses\/[^/]+\/rate/) && method === 'post') {
    return ok({ rating: parsed.rating });
  }
  if (url.match(/\/courses\/[^/]+$/) && method === 'get') {
    const courseId = url.split('/courses/')[1];
    const course = MOCK_COURSES.find(c => c.id === courseId);
    return course ? ok(course) : Promise.reject({ response: { status: 404 } });
  }
  if (url.match(/\/courses\/[^/]+$/) && (method === 'patch' || method === 'put')) {
    const courseId = url.split('/courses/')[1];
    const course = MOCK_COURSES.find(c => c.id === courseId) ?? MOCK_COURSES[0];
    return ok({ ...course, ...parsed });
  }
  if (url.includes('/courses') && method === 'get') {
    const qs = url.includes('?') ? url.split('?')[1] : '';
    const params = new URLSearchParams(qs);
    const l1 = params.get('l1');
    const l2 = params.get('l2');
    const difficulty = params.get('difficulty');
    const search = params.get('search')?.toLowerCase();
    let courses = MOCK_COURSES;
    if (l1) courses = courses.filter(c => c.taxonomy.l1 === l1);
    if (l2) courses = courses.filter(c => c.taxonomy.l2 === l2);
    if (difficulty) courses = courses.filter(c => c.difficulty === difficulty);
    if (search) courses = courses.filter(c =>
      c.title.toLowerCase().includes(search) ||
      c.description.toLowerCase().includes(search) ||
      c.tags.some(t => t.toLowerCase().includes(search))
    );
    return ok(courses);
  }
  if (url.includes('/courses') && method === 'post') {
    return ok({ ...parsed, id: `course-new-${Date.now()}`, authorId: 'dev-user-001', authorName: 'Dev Guildmate', published: false, lessonIds: [], totalLessons: 0, estimatedMinutes: 0, ratingAverage: 0, ratingCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  // Leaderboard
  if (url.includes('/leaderboard') && method === 'get') {
    const qs = url.includes('?') ? url.split('?')[1] : '';
    const period = (new URLSearchParams(qs).get('period') ?? 'alltime') as 'alltime' | 'week' | 'month';
    return ok(getMockLeaderboard(period));
  }

  // Progress
  if (url.includes('/progress/daily-login') && method === 'post') {
    return ok({ alreadyClaimed: false, xpAwarded: 5, streak: getMockUser().streak });
  }
  if (url.includes('/progress/lesson-complete') && method === 'post') {
    const { lessonId, courseId, quizScore } = parsed;
    let passingScore = 60;
    if (quizScore !== undefined) {
      const lesson = MOCK_LESSONS.find(l => l.id === lessonId);
      const quizSection = lesson?.content.sections.find(s => s.type === 'quiz');
      if (quizSection?.type === 'quiz') passingScore = quizSection.passingScore;
    }
    const result = completeMockLesson(lessonId, quizScore, passingScore);
    const progress = getMockProgress(courseId);
    return ok({ progress, ...result });
  }
  if (url.endsWith('/progress') && method === 'get') return ok(getAllMockProgress());
  if (url.match(/\/progress\/.+/) && method === 'get') {
    const courseId = url.split('/progress/')[1];
    return ok(getMockProgress(courseId));
  }

  return ok({});
}
