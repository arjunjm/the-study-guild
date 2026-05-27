import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, X, Save, CheckCircle, Globe, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { TAXONOMY } from '../data/taxonomy';
import type { Course, Lesson } from '@study-guild/shared';

export default function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [localLessons, setLocalLessons] = useState<Lesson[]>([]);

  const { data: course } = useQuery<Course>({
    queryKey: ['course-edit', courseId],
    queryFn: async () => (await apiClient.get<{ data: Course }>(`/courses/${courseId}`)).data.data,
  });

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ['lessons', courseId],
    queryFn: async () => (await apiClient.get<{ data: Lesson[] }>(`/courses/${courseId}/lessons`)).data.data,
  });

  useEffect(() => {
    if (lessons) setLocalLessons([...lessons].sort((a, b) => a.order - b.order));
  }, [lessons]);

  const updateCourseMutation = useMutation({
    mutationFn: (patch: Partial<Course>) => apiClient.patch(`/courses/${courseId}`, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-edit', courseId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const addLessonMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/courses/${courseId}/lessons`, {
        title: 'New Lesson',
        order: (lessons?.length ?? 0),
        estimatedMinutes: 10,
        content: {
          schemaVersion: '1',
          sections: [{ type: 'text', content: 'Start writing your lesson content here.' }],
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons', courseId] }),
  });

  const publishMutation = useMutation({
    mutationFn: () => apiClient.post(`/courses/${courseId}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course-edit', courseId] }),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId: string) => apiClient.delete(`/courses/${courseId}/lessons/${lessonId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons', courseId] }),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ lessonId, order }: { lessonId: string; order: number }) =>
      apiClient.put(`/courses/${courseId}/lessons/${lessonId}`, { order }),
  });

  function moveLesson(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= localLessons.length) return;
    const next = [...localLessons];
    [next[idx], next[target]] = [next[target], next[idx]];
    const reordered = next.map((l, i) => ({ ...l, order: i }));
    setLocalLessons(reordered);
    reorderMutation.mutate({ lessonId: reordered[idx].id, order: idx });
    reorderMutation.mutate({ lessonId: reordered[target].id, order: target });
  }

  if (!course) return <div className="p-10 text-slate-400 animate-pulse">Loading…</div>;

  const activeCategory = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link to="/teach" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition shrink-0">
          <ChevronLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          {!course.published && (
            <button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition"
            >
              <Globe className="h-3.5 w-3.5" />
              {publishMutation.isPending ? 'Publishing…' : 'Publish'}
            </button>
          )}
          {course.published && (
            <span className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle className="h-3 w-3" /> Published
            </span>
          )}
        </div>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">Edit course</h1>

      {/* Course metadata form */}
      <div className="mb-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Title</label>
          <input
            defaultValue={course.title}
            onBlur={e => updateCourseMutation.mutate({ title: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            placeholder="Course title"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
          <textarea
            defaultValue={course.description}
            rows={3}
            onBlur={e => updateCourseMutation.mutate({ description: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
            placeholder="What will learners gain from this course?"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
          <select
            value={course.taxonomy.l1}
            onChange={e => {
              const newL1 = e.target.value;
              const firstL2 = TAXONOMY.find(c => c.l1 === newL1)?.items[0]?.l2 ?? '';
              updateCourseMutation.mutate({ taxonomy: { l1: newL1, l2: firstL2 } });
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-violet-400 focus:outline-none"
          >
            {TAXONOMY.map(cat => (
              <option key={cat.l1} value={cat.l1}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Subcategory</label>
          <select
            value={course.taxonomy.l2}
            onChange={e => updateCourseMutation.mutate({ taxonomy: { ...course.taxonomy, l2: e.target.value } })}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-violet-400 focus:outline-none"
          >
            {activeCategory?.items.map(item => (
              <option key={item.l2} value={item.l2}>{item.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Difficulty</label>
            <select
              value={course.difficulty}
              onChange={e => updateCourseMutation.mutate({ difficulty: e.target.value as Course['difficulty'] })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-violet-400 focus:outline-none"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Est. minutes</label>
            <input
              type="number"
              defaultValue={course.estimatedMinutes}
              min={1}
              onBlur={e => {
                const v = parseInt(e.target.value, 10);
                if (v > 0) updateCourseMutation.mutate({ estimatedMinutes: v });
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-violet-400 focus:outline-none"
            />
          </div>
        </div>

        <TagsEditor
          tags={course.tags ?? []}
          onUpdate={tags => updateCourseMutation.mutate({ tags })}
        />

        <button
          onClick={() => updateCourseMutation.mutate({})}
          disabled={updateCourseMutation.isPending}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 transition"
        >
          <Save className="h-4 w-4" />
          {updateCourseMutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Lessons */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Lessons
          <span className="ml-2 text-sm font-normal text-slate-400">({lessons?.length ?? 0})</span>
        </h2>
        <button
          onClick={() => addLessonMutation.mutate()}
          disabled={addLessonMutation.isPending}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-violet-300 hover:text-violet-700 transition disabled:opacity-60 shadow-sm"
        >
          <Plus className="h-4 w-4" /> {addLessonMutation.isPending ? 'Adding…' : 'Add lesson'}
        </button>
      </div>

      <div className="space-y-2">
        {localLessons.map((lesson, i) => (
          <div
            key={lesson.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveLesson(i, -1)}
                disabled={i === 0}
                className="rounded p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition"
                title="Move up"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => moveLesson(i, 1)}
                disabled={i === localLessons.length - 1}
                className="rounded p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition"
                title="Move down"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500 font-medium">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-slate-800">{lesson.title}</p>
              <p className="text-xs text-slate-400">{lesson.estimatedMinutes} min · {lesson.content.sections.length} section{lesson.content.sections.length !== 1 ? 's' : ''}</p>
            </div>
            <Link
              to={`/teach/courses/${courseId}/lessons/${lesson.id}/edit`}
              className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 hover:border-violet-300 transition"
            >
              Edit
            </Link>
            <Link
              to={`/courses/${courseId}/lessons/${lesson.id}`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-700 transition"
            >
              Preview
            </Link>
            <button
              onClick={() => {
                if (confirm(`Delete "${lesson.title}"? This cannot be undone.`)) {
                  deleteLessonMutation.mutate(lesson.id);
                }
              }}
              disabled={deleteLessonMutation.isPending}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-red-200 hover:text-red-500 transition disabled:opacity-40"
              title="Delete lesson"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {!localLessons.length && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-400">No lessons yet. Add your first lesson to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TagsEditor({ tags, onUpdate }: { tags: string[]; onUpdate: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  function addTag() {
    const tag = input.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !tags.includes(tag)) {
      onUpdate([...tags, tag]);
    }
    setInput('');
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
          >
            #{tag}
            <button
              onClick={() => onUpdate(tags.filter(t => t !== tag))}
              className="ml-0.5 text-slate-400 hover:text-red-500 transition"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="Add a tag…"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
        <button
          onClick={addTag}
          disabled={!input.trim()}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:border-violet-300 hover:text-violet-700 disabled:opacity-40 transition"
        >
          Add
        </button>
      </div>
    </div>
  );
}
