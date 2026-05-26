import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Eye, Edit, BookOpen, GraduationCap, FileText, BarChart2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { Course } from '@study-guild/shared';

export default function TeacherDashboard() {
  const qc = useQueryClient();

  const { data: me } = useQuery<{ id: string; role: string }>({
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
        taxonomy: { l1: 'General', l2: 'Miscellaneous' },
        difficulty: 'beginner',
        tags: [],
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-courses'] }),
  });

  const publishMutation = useMutation({
    mutationFn: (courseId: string) => apiClient.post(`/courses/${courseId}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-courses'] }),
  });

  if (me?.role === 'learner') {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-900/40">
          <GraduationCap className="h-10 w-10 text-violet-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">Become a Teacher</h1>
        <p className="mb-6 max-w-sm text-slate-400">Share your expertise with the Guild. Create interactive lessons with quizzes, flow diagrams, and code examples.</p>
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {['Earn XP for every published lesson', 'Interactive quizzes & diagrams', 'Track learner engagement'].map(b => (
            <span key={b} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">{b}</span>
          ))}
        </div>
        <button
          onClick={() => switchRoleMutation.mutate()}
          disabled={switchRoleMutation.isPending}
          className="rounded-lg bg-violet-600 px-6 py-2.5 font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
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
      {/* Stats bar — only shown when there are courses */}
      {courses && courses.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total courses', value: courses.length, Icon: BookOpen, cls: 'text-violet-400' },
            { label: 'Published', value: published.length, Icon: Eye, cls: 'text-emerald-400' },
            { label: 'Drafts', value: drafts.length, Icon: FileText, cls: 'text-slate-400' },
            { label: 'Total lessons', value: totalLessons, Icon: BarChart2, cls: 'text-amber-400' },
          ].map(({ label, value, Icon, cls }) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <Icon className={`mb-2 h-4 w-4 ${cls}`} />
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">My Courses</h1>
        <button
          onClick={onCreate}
          disabled={creating}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> {creating ? 'Creating…' : 'New course'}
        </button>
      </div>

      {isLoading && <p className="text-slate-400">Loading courses…</p>}

      {!isLoading && !courses?.length && (
        <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="mb-1 font-medium text-slate-300">No courses yet</p>
          <p className="mb-6 text-sm text-slate-500">Create your first course and start sharing your knowledge with the Guild.</p>
          <button
            onClick={onCreate}
            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Create first course
          </button>
        </div>
      )}

      {courses && courses.length > 0 && (
        <div className="space-y-3">
          {courses.map(course => (
            <div
              key={course.id}
              className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-700"
            >
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-white">{course.title}</h2>
                <p className="text-xs text-slate-400">
                  {course.totalLessons} lesson{course.totalLessons !== 1 ? 's' : ''} · {course.taxonomy.l1} / {course.taxonomy.l2} · {course.difficulty}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${course.published ? 'bg-emerald-900/40 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                  {course.published ? 'Published' : 'Draft'}
                </span>
                <Link
                  to={`/teach/courses/${course.id}/edit`}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                {!course.published && (
                  <button
                    onClick={() => onPublish(course.id)}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition"
                    title="Publish"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
