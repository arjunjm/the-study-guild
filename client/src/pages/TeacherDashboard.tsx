import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, BookOpen, GraduationCap, FileText, BarChart2, Star, ExternalLink, WandSparkles, ArrowRight } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { Course } from '@study-guild/shared';

export default function TeacherDashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: me, isError: meError, refetch: refetchMe } = useQuery<{ id: string; role: string }>({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get<{ data: { id: string; role: string } }>('/users/me')).data.data,
  });

  const switchRoleMutation = useMutation({
    mutationFn: () => apiClient.patch('/users/me', { role: 'teacher' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ data: Course }>('/courses', {
        title: 'New Course',
        description: 'Course description',
        taxonomy: { l1: 'Security', l2: 'Authentication' },
        difficulty: 'beginner',
        tags: [],
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['my-courses'] });
      navigate(`/teach/courses/${res.data.data.id}/edit`);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (courseId: string) => apiClient.post(`/courses/${courseId}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-courses'] }),
  });

  if (meError) {
    return (
      <PageError
        title="Teacher tools could not load"
        message="Your sign-in succeeded, but the API could not load your profile. Refresh the page or sign in again."
        onRetry={() => refetchMe()}
      />
    );
  }

  if (!me) {
    return (
      <div className="flex min-h-full items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-violet-500" />
      </div>
    );
  }

  function PageError({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
    return (
      <div className="flex min-h-full items-center justify-center p-6 text-center">
        <div className="max-w-sm rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">{title}</p>
          <p className="mt-2 text-sm leading-6 text-red-700">{message}</p>
          <button
            onClick={onRetry}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (me.role === 'learner') {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
          <GraduationCap className="h-10 w-10 text-violet-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Become a Teacher</h1>
        <p className="mb-6 max-w-sm text-slate-500">Share your expertise with the Guild. Create interactive lessons with quizzes, flow diagrams, and code examples.</p>
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {['Earn XP for every published lesson', 'Interactive quizzes & diagrams', 'Track learner engagement'].map(b => (
            <span key={b} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{b}</span>
          ))}
        </div>
        <button
          onClick={() => switchRoleMutation.mutate()}
          disabled={switchRoleMutation.isPending}
          className="rounded-lg bg-violet-600 px-6 py-2.5 font-semibold text-white hover:bg-violet-500 disabled:opacity-60 transition"
        >
          {switchRoleMutation.isPending ? 'Switching…' : 'Switch to Teacher mode'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      <MyCoursesDashboard
        onPublish={id => publishMutation.mutate(id)}
        onCreate={() => createMutation.mutate()}
        creating={createMutation.isPending}
      />
    </div>
  );
}

function MyCoursesDashboard({
  onPublish,
  onCreate,
  creating,
}: {
  onPublish: (id: string) => void;
  onCreate: () => void;
  creating: boolean;
}) {
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['my-courses'],
    queryFn: async () => (await apiClient.get<{ data: Course[] }>('/users/me/courses')).data.data,
  });

  const published = courses?.filter(c => c.published) ?? [];
  const drafts = courses?.filter(c => !c.published) ?? [];
  const totalLessons = courses?.reduce((sum, c) => sum + c.totalLessons, 0) ?? 0;

  return (
    <>
      {courses && courses.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total courses', value: courses.length, Icon: BookOpen, cls: 'text-violet-600' },
            { label: 'Published', value: published.length, Icon: Eye, cls: 'text-emerald-600' },
            { label: 'Drafts', value: drafts.length, Icon: FileText, cls: 'text-slate-500' },
            { label: 'Total lessons', value: totalLessons, Icon: BarChart2, cls: 'text-amber-600' },
          ].map(({ label, value, Icon, cls }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <Icon className={`mb-2 h-4 w-4 ${cls}`} />
              <p className="text-xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">My Courses</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/teach/assistant"
            className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
          >
            <WandSparkles className="h-4 w-4" /> Plan with assistant
          </Link>
          <button
            onClick={onCreate}
            disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 transition"
          >
            <Plus className="h-4 w-4" /> {creating ? 'Creating…' : 'New course'}
          </button>
        </div>
      </div>

      {isLoading && <p className="text-slate-400">Loading courses…</p>}

      {!isLoading && !courses?.length && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="mb-1 font-medium text-slate-600">No courses yet</p>
          <p className="mb-6 text-sm text-slate-400">Create your first course and start sharing your knowledge with the Guild.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/teach/assistant"
              className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-5 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              Plan with assistant
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={onCreate}
              className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition"
            >
              Create blank course
            </button>
          </div>
        </div>
      )}

      {courses && courses.length > 0 && (
        <div className="space-y-3">
          {courses.map(course => (
            <div
              key={course.id}
              className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="truncate font-semibold text-slate-900">{course.title}</h2>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${course.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {course.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  {course.description && (
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{course.description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>{course.totalLessons} lesson{course.totalLessons !== 1 ? 's' : ''}</span>
                    <span>{course.taxonomy.l1} / {course.taxonomy.l2}</span>
                    <span className="capitalize">{course.difficulty}</span>
                    {course.published && course.ratingCount > 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        {course.ratingAverage.toFixed(1)}
                        <span className="text-slate-400">({course.ratingCount})</span>
                      </span>
                    )}
                    {course.published && course.publishedAt && (
                      <span className="text-slate-400">
                        Published {new Date(course.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {course.published && (
                    <Link
                      to={`/courses/${course.id}`}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-violet-600 transition"
                      title="Preview as learner"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                  <Link
                    to={`/teach/courses/${course.id}/edit`}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  {!course.published && (
                    <button
                      onClick={() => onPublish(course.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition"
                      title="Publish"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
