import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, X, Save, CheckCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { TAXONOMY } from '../data/taxonomy';
import type { Course, Lesson } from '@study-guild/shared';

export default function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: course } = useQuery<Course>({
    queryKey: ['course-edit', courseId],
    queryFn: async () => (await apiClient.get<{ data: Course }>(`/courses/${courseId}`)).data.data,
  });

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ['lessons', courseId],
    queryFn: async () => (await apiClient.get<{ data: Lesson[] }>(`/courses/${courseId}/lessons`)).data.data,
  });

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

  if (!course) return <div className="p-10 text-slate-400">Loading…</div>;

  const activeCategory = TAXONOMY.find(c => c.l1 === course.taxonomy.l1);

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/teach" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition">
          <ChevronLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>

      <h1 className="mb-6 text-2xl font-bold text-white">Edit course</h1>

      {/* Course metadata form */}
      <div className="mb-8 space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Title</label>
          <input
            defaultValue={course.title}
            onBlur={e => updateCourseMutation.mutate({ title: e.target.value })}
            className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-white placeholder-slate-600 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            placeholder="Course title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
          <textarea
            defaultValue={course.description}
            rows={3}
            onBlur={e => updateCourseMutation.mutate({ description: e.target.value })}
            className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-white placeholder-slate-600 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/30 resize-none"
            placeholder="What will learners gain from this course?"
          />
        </div>

        {/* Taxonomy — Category */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
          <select
            value={course.taxonomy.l1}
            onChange={e => {
              const newL1 = e.target.value;
              const firstL2 = TAXONOMY.find(c => c.l1 === newL1)?.items[0]?.l2 ?? '';
              updateCourseMutation.mutate({ taxonomy: { l1: newL1, l2: firstL2 } });
            }}
            className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-white focus:border-violet-500/60 focus:outline-none"
          >
            {TAXONOMY.map(cat => (
              <option key={cat.l1} value={cat.l1}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Taxonomy — Subcategory */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Subcategory</label>
          <select
            value={course.taxonomy.l2}
            onChange={e => updateCourseMutation.mutate({ taxonomy: { ...course.taxonomy, l2: e.target.value } })}
            className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-white focus:border-violet-500/60 focus:outline-none"
          >
            {activeCategory?.items.map(item => (
              <option key={item.l2} value={item.l2}>{item.label}</option>
            ))}
          </select>
        </div>

        {/* Difficulty + Estimated minutes */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Difficulty</label>
            <select
              value={course.difficulty}
              onChange={e => updateCourseMutation.mutate({ difficulty: e.target.value as Course['difficulty'] })}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-white focus:border-violet-500/60 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2.5 text-white focus:border-violet-500/60 focus:outline-none"
            />
          </div>
        </div>

        {/* Tags */}
        <TagsEditor
          tags={course.tags ?? []}
          onUpdate={tags => updateCourseMutation.mutate({ tags })}
        />

        {/* Save button */}
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
        <h2 className="text-lg font-semibold text-white">Lessons
          <span className="ml-2 text-sm font-normal text-slate-500">({lessons?.length ?? 0})</span>
        </h2>
        <button
          onClick={() => addLessonMutation.mutate()}
          disabled={addLessonMutation.isPending}
          className="flex items-center gap-2 rounded-xl border border-slate-700/60 px-4 py-2 text-sm text-slate-300 hover:border-violet-500/50 hover:text-white transition disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> {addLessonMutation.isPending ? 'Adding…' : 'Add lesson'}
        </button>
      </div>

      <div className="space-y-2">
        {lessons?.map((lesson, i) => (
          <div
            key={lesson.id}
            className="flex items-center gap-4 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-500">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-slate-200">{lesson.title}</p>
              <p className="text-xs text-slate-600">{lesson.estimatedMinutes} min · {lesson.content.sections.length} section{lesson.content.sections.length !== 1 ? 's' : ''}</p>
            </div>
            <Link
              to={`/courses/${courseId}/lessons/${lesson.id}`}
              className="rounded-lg border border-slate-700/40 px-3 py-1.5 text-xs text-slate-400 hover:border-violet-500/40 hover:text-violet-300 transition"
            >
              Preview
            </Link>
          </div>
        ))}

        {!lessons?.length && (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
            <p className="text-sm text-slate-500">No lessons yet. Add your first lesson to get started.</p>
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
            className="flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300"
          >
            #{tag}
            <button
              onClick={() => onUpdate(tags.filter(t => t !== tag))}
              className="ml-0.5 text-slate-600 hover:text-red-400 transition"
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
          className="flex-1 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-violet-500/60 focus:outline-none"
        />
        <button
          onClick={addTag}
          disabled={!input.trim()}
          className="rounded-xl border border-slate-700/60 px-4 py-2 text-sm text-slate-400 hover:border-violet-500/40 hover:text-violet-300 disabled:opacity-40 transition"
        >
          Add
        </button>
      </div>
    </div>
  );
}
