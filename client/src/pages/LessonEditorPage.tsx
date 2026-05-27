import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, ArrowUp, ArrowDown, CheckCircle, Eye, Columns2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { cn } from '../lib/utils';
import LessonRenderer from '../components/lesson/LessonRenderer';
import type { Lesson, LessonSection, LessonContent, TextSection, CalloutSection, CodeBlockSection, QuizSection, QuizQuestion } from '@study-guild/shared';

type EditableSection = TextSection | CalloutSection | CodeBlockSection | QuizSection;

const SECTION_LABELS: Record<string, string> = {
  text: 'Text (Markdown)',
  callout: 'Callout',
  codeBlock: 'Code Block',
  quiz: 'Quiz',
};

const CALLOUT_VARIANTS = ['info', 'tip', 'warning', 'danger'] as const;

export default function LessonEditorPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState(10);
  const [sections, setSections] = useState<EditableSection[]>([]);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [splitView, setSplitView] = useState(false);

  const { data: lesson } = useQuery<Lesson>({
    queryKey: ['lesson-edit', courseId, lessonId],
    queryFn: async () =>
      (await apiClient.get<{ data: Lesson }>(`/courses/${courseId}/lessons/${lessonId}`)).data.data,
  });

  useEffect(() => {
    if (!lesson) return;
    setTitle(lesson.title);
    setMinutes(lesson.estimatedMinutes);
    const editable = lesson.content.sections.filter(
      (s): s is EditableSection =>
        s.type === 'text' || s.type === 'callout' || s.type === 'codeBlock' || s.type === 'quiz'
    );
    setSections(editable);
    setDirty(false);
  }, [lesson]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.put(`/courses/${courseId}/lessons/${lessonId}`, {
        title,
        estimatedMinutes: minutes,
        order: lesson?.order ?? 0,
        content: {
          schemaVersion: '1',
          sections: [
            ...sections,
            // Preserve non-editable sections (flowDiagram, interactive) from the original
            ...(lesson?.content.sections.filter(
              s => s.type !== 'text' && s.type !== 'callout' && s.type !== 'codeBlock' && s.type !== 'quiz'
            ) ?? []),
          ] as LessonSection[],
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-edit', courseId, lessonId] });
      qc.invalidateQueries({ queryKey: ['lesson', courseId, lessonId] });
      qc.invalidateQueries({ queryKey: ['lessons', courseId] });
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  // Ctrl+S / Cmd+S to save
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (dirty && !saveMutation.isPending) saveMutation.mutate();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dirty, saveMutation]);

  function addSection(type: 'text' | 'callout' | 'codeBlock' | 'quiz') {
    const s: EditableSection =
      type === 'text' ? { type: 'text', content: '' }
      : type === 'callout' ? { type: 'callout', variant: 'info', content: '', title: '' }
      : type === 'quiz' ? {
          type: 'quiz',
          title: 'Knowledge Check',
          passingScore: 70,
          questions: [{
            id: `q-${Date.now()}`,
            question: '',
            options: ['', '', '', ''],
            correctIndex: 0,
            explanation: '',
          }],
        }
      : { type: 'codeBlock', language: 'javascript', code: '', caption: '' };
    setSections(prev => [...prev, s]);
    setDirty(true);
  }

  function removeSection(idx: number) {
    setSections(prev => prev.filter((_, i) => i !== idx));
    setDirty(true);
  }

  function moveSection(idx: number, dir: -1 | 1) {
    setSections(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setDirty(true);
  }

  function updateSection(idx: number, patch: Partial<EditableSection>) {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } as EditableSection : s));
    setDirty(true);
  }

  if (!lesson) return (
    <div className="p-10 text-slate-400 animate-pulse">Loading lesson…</div>
  );

  const previewContent: LessonContent = {
    schemaVersion: '1',
    sections: [
      ...sections,
      ...(lesson.content.sections.filter(s => s.type !== 'text' && s.type !== 'callout' && s.type !== 'codeBlock' && s.type !== 'quiz') as LessonSection[]),
    ],
  };

  return (
    <div className={cn('p-6 lg:p-10', splitView ? 'max-w-none' : 'max-w-3xl')}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          to={`/teach/courses/${courseId}/edit`}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition shrink-0"
        >
          <ChevronLeft className="h-4 w-4" /> Back to course
        </Link>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <button
            onClick={() => setSplitView(v => !v)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition',
              splitView
                ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                : 'border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            )}
            title="Toggle split preview"
          >
            <Columns2 className="h-3.5 w-3.5" /> {splitView ? 'Editor only' : 'Split view'}
          </button>
          <Link
            to={`/courses/${courseId}/lessons/${lessonId}`}
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700/60 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition"
          >
            <Eye className="h-3.5 w-3.5" /> Live
          </Link>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !dirty}
            title="Save (Ctrl+S)"
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save'}
            {!saveMutation.isPending && dirty && (
              <kbd className="ml-0.5 rounded bg-violet-500/50 px-1 py-0.5 font-mono text-[9px] text-violet-200">⌃S</kbd>
            )}
          </button>
        </div>
      </div>

      <div className={cn(splitView && 'lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start')}>
      <div>
      <h1 className="mb-6 text-xl font-bold text-white">Edit Lesson</h1>

      {/* Lesson metadata */}
      <div className="mb-6 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Title</label>
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setDirty(true); }}
            className="w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/60"
            placeholder="Lesson title"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Estimated minutes</label>
          <input
            type="number"
            min={1}
            max={120}
            value={minutes}
            onChange={e => { setMinutes(Number(e.target.value)); setDirty(true); }}
            className="w-32 rounded-xl border border-slate-700/60 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/60"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">Sections <span className="ml-1 text-slate-600">({sections.length})</span></h2>
      </div>

      <div className="space-y-3 mb-4">
        {sections.map((section, idx) => (
          <SectionEditor
            key={idx}
            section={section}
            idx={idx}
            total={sections.length}
            onChange={patch => updateSection(idx, patch)}
            onRemove={() => removeSection(idx)}
            onMove={dir => moveSection(idx, dir)}
          />
        ))}
        {sections.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-600">
            No sections yet. Add one below.
          </div>
        )}
      </div>

      {/* Add section buttons */}
      <div className="flex flex-wrap gap-2">
        {(['text', 'callout', 'codeBlock', 'quiz'] as const).map(type => (
          <button
            key={type}
            onClick={() => addSection(type)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700/50 bg-slate-900/40 px-3 py-2 text-xs text-slate-400 transition hover:border-violet-500/40 hover:text-violet-300"
          >
            <Plus className="h-3.5 w-3.5" />
            {SECTION_LABELS[type]}
          </button>
        ))}
      </div>
      </div>{/* end editor column */}

      {/* Preview panel */}
      {splitView && (
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-400">Preview</h2>
              {dirty && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">unsaved changes</span>}
            </div>
            <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <h1 className="mb-6 text-xl font-bold text-white">{title || 'Untitled lesson'}</h1>
              {previewContent.sections.length > 0 ? (
                <LessonRenderer
                  content={previewContent}
                  onComplete={() => {}}
                  alreadyComplete={false}
                />
              ) : (
                <p className="text-sm text-slate-600 italic">Add sections to see a preview…</p>
              )}
            </div>
          </div>
        </div>
      )}
      </div>{/* end split grid */}
    </div>
  );
}

function SectionEditor({
  section, idx, total, onChange, onRemove, onMove,
}: {
  section: EditableSection;
  idx: number;
  total: number;
  onChange: (patch: Partial<EditableSection>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const variantColors = {
    info: 'text-violet-400 border-violet-500/30 bg-violet-500/8',
    tip: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/8',
    warning: 'text-amber-400 border-amber-500/30 bg-amber-500/8',
    danger: 'text-red-400 border-red-500/30 bg-red-500/8',
  };

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40">
      {/* Section toolbar */}
      <div className="flex items-center gap-2 border-b border-slate-800/60 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{SECTION_LABELS[section.type]}</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => onMove(-1)} disabled={idx === 0} className="rounded p-1 text-slate-600 hover:text-slate-300 disabled:opacity-30 transition">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onMove(1)} disabled={idx === total - 1} className="rounded p-1 text-slate-600 hover:text-slate-300 disabled:opacity-30 transition">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={onRemove} className="rounded p-1 text-slate-600 hover:text-red-400 transition">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {section.type === 'text' && (
          <textarea
            value={section.content}
            onChange={e => onChange({ content: e.target.value } as Partial<TextSection>)}
            rows={6}
            placeholder="Write markdown content…"
            className="w-full resize-y rounded-lg border border-slate-700/40 bg-slate-800/50 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-violet-500/40 placeholder-slate-600"
          />
        )}

        {section.type === 'callout' && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 shrink-0">Variant:</label>
              <div className="flex gap-1.5">
                {CALLOUT_VARIANTS.map(v => (
                  <button
                    key={v}
                    onClick={() => onChange({ variant: v } as Partial<CalloutSection>)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1 text-[11px] font-medium capitalize transition',
                      section.variant === v
                        ? variantColors[v]
                        : 'border-slate-700/40 text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <input
              value={(section as CalloutSection).title ?? ''}
              onChange={e => onChange({ title: e.target.value } as Partial<CalloutSection>)}
              placeholder="Title (optional)"
              className="w-full rounded-lg border border-slate-700/40 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-500/40 placeholder-slate-600"
            />
            <textarea
              value={section.content}
              onChange={e => onChange({ content: e.target.value } as Partial<CalloutSection>)}
              rows={3}
              placeholder="Callout content (markdown)…"
              className="w-full resize-y rounded-lg border border-slate-700/40 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-500/40 placeholder-slate-600"
            />
          </>
        )}

        {section.type === 'codeBlock' && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 shrink-0">Language:</label>
              <input
                value={(section as CodeBlockSection).language}
                onChange={e => onChange({ language: e.target.value } as Partial<CodeBlockSection>)}
                placeholder="javascript"
                className="w-32 rounded-lg border border-slate-700/40 bg-slate-800/50 px-2 py-1 text-xs text-slate-200 outline-none focus:border-violet-500/40"
              />
              <label className="text-xs text-slate-500 shrink-0 ml-2">Caption:</label>
              <input
                value={(section as CodeBlockSection).caption ?? ''}
                onChange={e => onChange({ caption: e.target.value } as Partial<CodeBlockSection>)}
                placeholder="Optional caption"
                className="flex-1 rounded-lg border border-slate-700/40 bg-slate-800/50 px-2 py-1 text-xs text-slate-200 outline-none focus:border-violet-500/40 placeholder-slate-600"
              />
            </div>
            <textarea
              value={(section as CodeBlockSection).code}
              onChange={e => onChange({ code: e.target.value } as Partial<CodeBlockSection>)}
              rows={8}
              placeholder="// Your code here"
              className="w-full resize-y rounded-lg border border-slate-700/40 bg-slate-800/50 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-violet-500/40 placeholder-slate-600"
              spellCheck={false}
            />
          </>
        )}

        {section.type === 'quiz' && (
          <QuizSectionEditor
            section={section as QuizSection}
            onChange={patch => onChange(patch as Partial<QuizSection>)}
          />
        )}
      </div>
    </div>
  );
}

function QuizSectionEditor({ section, onChange }: { section: QuizSection; onChange: (patch: Partial<QuizSection>) => void }) {
  function updateQuestion(qi: number, patch: Partial<QuizQuestion>) {
    const questions = section.questions.map((q, i) => i === qi ? { ...q, ...patch } : q);
    onChange({ questions });
  }

  function addQuestion() {
    onChange({
      questions: [...section.questions, {
        id: `q-${Date.now()}`,
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        explanation: '',
      }],
    });
  }

  function removeQuestion(qi: number) {
    onChange({ questions: section.questions.filter((_, i) => i !== qi) });
  }

  function updateOption(qi: number, oi: number, value: string) {
    const options = section.questions[qi].options.map((o, i) => i === oi ? value : o);
    updateQuestion(qi, { options });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-600">Quiz title</label>
          <input
            value={section.title ?? ''}
            onChange={e => onChange({ title: e.target.value })}
            placeholder="Knowledge Check"
            className="w-full rounded-lg border border-slate-700/40 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-500/40 placeholder-slate-600"
          />
        </div>
        <div className="w-28">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-600">Pass % (0-100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={section.passingScore}
            onChange={e => onChange({ passingScore: Math.min(100, Math.max(0, Number(e.target.value))) })}
            className="w-full rounded-lg border border-slate-700/40 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-500/40"
          />
        </div>
      </div>

      {section.questions.map((q, qi) => (
        <div key={q.id} className="rounded-lg border border-slate-700/30 bg-slate-800/30 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Q{qi + 1}</span>
            {section.questions.length > 1 && (
              <button onClick={() => removeQuestion(qi)} className="rounded p-0.5 text-slate-600 hover:text-red-400 transition">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
          <textarea
            value={q.question}
            onChange={e => updateQuestion(qi, { question: e.target.value })}
            rows={2}
            placeholder="Question text…"
            className="w-full resize-y rounded-lg border border-slate-700/40 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-500/40 placeholder-slate-600"
          />
          <div className="space-y-1.5">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <button
                  onClick={() => updateQuestion(qi, { correctIndex: oi })}
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition',
                    q.correctIndex === oi
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
                      : 'border-slate-600 text-slate-600 hover:border-slate-500 hover:text-slate-400'
                  )}
                  title="Mark as correct"
                >
                  {String.fromCharCode(65 + oi)}
                </button>
                <input
                  value={opt}
                  onChange={e => updateOption(qi, oi, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                  className="flex-1 rounded-lg border border-slate-700/40 bg-slate-800/50 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500/40 placeholder-slate-600"
                />
              </div>
            ))}
          </div>
          <input
            value={q.explanation ?? ''}
            onChange={e => updateQuestion(qi, { explanation: e.target.value })}
            placeholder="Explanation (shown after answering, optional)"
            className="w-full rounded-lg border border-slate-700/40 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-violet-500/40 placeholder-slate-600"
          />
        </div>
      ))}

      <button
        onClick={addQuestion}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-700/50 px-3 py-2 text-xs text-slate-500 transition hover:border-violet-500/30 hover:text-violet-400"
      >
        <Plus className="h-3 w-3" /> Add question
      </button>
    </div>
  );
}
