import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Clipboard,
  GraduationCap,
  Layers3,
  ListChecks,
  Loader2,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { TAXONOMY } from '../data/taxonomy';
import { useToast } from '../contexts/ToastContext';
import type { Course, DifficultyLevel, LessonContent } from '@study-guild/shared';

type Audience = 'newcomers' | 'working-developers' | 'technical-leaders';

interface AssistantForm {
  topic: string;
  audience: Audience;
  difficulty: DifficultyLevel;
  l1: string;
  l2: string;
  lessonCount: number;
  goals: string;
}

interface LessonBlueprint {
  title: string;
  estimatedMinutes: number;
  objective: string;
  content: LessonContent;
}

interface CourseBlueprint {
  title: string;
  description: string;
  tags: string[];
  taxonomy: { l1: string; l2: string };
  difficulty: DifficultyLevel;
  lessons: LessonBlueprint[];
}

const AUDIENCE_LABELS: Record<Audience, string> = {
  newcomers: 'Newcomers',
  'working-developers': 'Working developers',
  'technical-leaders': 'Technical leaders',
};

const DEFAULT_FORM: AssistantForm = {
  topic: 'Retrieval-Augmented Generation',
  audience: 'working-developers',
  difficulty: 'intermediate',
  l1: 'AI & ML',
  l2: 'RAG',
  lessonCount: 4,
  goals: 'Explain the mental model\nShow a practical implementation workflow\nInclude evaluation and production pitfalls',
};

export default function AuthoringAssistantPage() {
  const [form, setForm] = useState<AssistantForm>(DEFAULT_FORM);
  const toast = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const activeCategory = TAXONOMY.find(cat => cat.l1 === form.l1) ?? TAXONOMY[0];
  const blueprint = useMemo(() => buildBlueprint(form), [form]);

  const createCourseMutation = useMutation({
    mutationFn: async () => {
      const created = await apiClient.post<{ data: Course }>('/courses', {
        title: blueprint.title,
        description: blueprint.description,
        taxonomy: blueprint.taxonomy,
        difficulty: blueprint.difficulty,
        tags: blueprint.tags,
      });
      const course = created.data.data;
      for (const [index, lesson] of blueprint.lessons.entries()) {
        await apiClient.post(`/courses/${course.id}/lessons`, {
          title: lesson.title,
          order: index,
          estimatedMinutes: lesson.estimatedMinutes,
          content: lesson.content,
        });
      }
      return course;
    },
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: ['my-courses'] });
      qc.invalidateQueries({ queryKey: ['lessons', course.id] });
      toast.success('Draft course created', `${blueprint.lessons.length} lessons generated`);
      navigate(`/teach/courses/${course.id}/edit`);
    },
  });

  function update<K extends keyof AssistantForm>(key: K, value: AssistantForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function updateCategory(l1: string) {
    const firstL2 = TAXONOMY.find(cat => cat.l1 === l1)?.items[0]?.l2 ?? '';
    setForm(prev => ({ ...prev, l1, l2: firstL2 }));
  }

  async function copyBlueprint() {
    await navigator.clipboard.writeText(formatBlueprint(blueprint));
    toast.success('Blueprint copied', 'Paste it into a planning doc or review thread');
  }

  return (
    <div className="min-h-full bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-900 bg-slate-950 px-4 py-10 text-white lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.38),transparent_32%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.24),transparent_30%),linear-gradient(135deg,#020617_0%,#111827_58%,#1e1b4b_100%)]" />
        <div className="absolute inset-0 opacity-25 dot-pattern" />
        <div className="relative">
          <Link to="/teach" className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-300 transition hover:text-white">
            <ChevronLeft className="h-4 w-4" />
            Back to teacher dashboard
          </Link>
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-violet-100 backdrop-blur">
              <WandSparkles className="h-3.5 w-3.5 text-amber-300" />
              Authoring assistant
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
              Turn an idea into a structured lesson plan.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              This deterministic assistant creates a draft course outline with lesson objectives, callouts, quizzes, and starter lesson content. No external AI dependency required.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 px-4 py-8 lg:grid-cols-[420px_minmax(0,1fr)] lg:px-10 lg:py-10">
        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500">Inputs</p>
            <div className="space-y-4">
              <Field label="Topic">
                <input
                  value={form.topic}
                  onChange={e => update('topic', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  placeholder="e.g. RAG, Kubernetes, OAuth2"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Audience">
                  <select
                    value={form.audience}
                    onChange={e => update('audience', e.target.value as Audience)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400"
                  >
                    {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Difficulty">
                  <select
                    value={form.difficulty}
                    onChange={e => update('difficulty', e.target.value as DifficultyLevel)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm capitalize outline-none transition focus:border-violet-400"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <select
                    value={form.l1}
                    onChange={e => updateCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400"
                  >
                    {TAXONOMY.map(cat => (
                      <option key={cat.l1} value={cat.l1}>{cat.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Subcategory">
                  <select
                    value={form.l2}
                    onChange={e => update('l2', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400"
                  >
                    {activeCategory.items.map(item => (
                      <option key={item.l2} value={item.l2}>{item.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Lesson count">
                <input
                  type="range"
                  min={3}
                  max={6}
                  value={form.lessonCount}
                  onChange={e => update('lessonCount', Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
                <p className="mt-1 text-xs text-slate-500">{form.lessonCount} lessons</p>
              </Field>

              <Field label="Learning goals">
                <textarea
                  value={form.goals}
                  onChange={e => update('goals', e.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  placeholder="One goal per line"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
            <div className="mb-3 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <h2 className="font-bold text-slate-950">What this creates</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Course metadata and tags</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Lesson objectives and estimated minutes</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Text sections, callouts, and quizzes</li>
            </ul>
          </section>
        </aside>

        <main className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500">Generated blueprint</p>
                  <h2 className="text-2xl font-bold text-slate-950">{blueprint.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{blueprint.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={copyBlueprint}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <Clipboard className="h-4 w-4" />
                    Copy
                  </button>
                  <button
                    onClick={() => createCourseMutation.mutate()}
                    disabled={createCourseMutation.isPending || !form.topic.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
                  >
                    {createCourseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
                    Create draft
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {blueprint.tags.map(tag => (
                  <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500">#{tag}</span>
                ))}
              </div>
            </div>

            <div className="p-6">
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <SummaryCard icon={Layers3} label="Lessons" value={blueprint.lessons.length} />
                <SummaryCard icon={BookOpen} label="Est. time" value={`${blueprint.lessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0)}m`} />
                <SummaryCard icon={ListChecks} label="Quizzes" value={blueprint.lessons.length} />
              </div>

              <div className="space-y-3">
                {blueprint.lessons.map((lesson, index) => (
                  <article key={lesson.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-950">{lesson.title}</h3>
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">{lesson.estimatedMinutes} min</span>
                        </div>
                        <p className="text-sm leading-6 text-slate-600">{lesson.objective}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {lesson.content.sections.map(section => (
                            <span key={`${lesson.title}-${section.type}`} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              {section.type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof Layers3; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <Icon className="mb-3 h-5 w-5 text-violet-600" />
      <p className="text-xl font-bold text-slate-950">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function buildBlueprint(form: AssistantForm): CourseBlueprint {
  const topic = form.topic.trim() || 'Untitled Topic';
  const goals = parseGoals(form.goals);
  const lessonTemplates = buildLessonTemplates(topic, goals, form.audience, form.lessonCount);
  const tags = buildTags(topic, form.l1, form.l2);

  return {
    title: `${topic} ${form.difficulty === 'beginner' ? 'Foundations' : form.difficulty === 'advanced' ? 'Masterclass' : 'in Practice'}`,
    description: `${AUDIENCE_LABELS[form.audience]} learn ${topic} through mental models, practical workflows, common pitfalls, and knowledge checks.`,
    taxonomy: { l1: form.l1, l2: form.l2 },
    difficulty: form.difficulty,
    tags,
    lessons: lessonTemplates.map((template, index) => ({
      title: template.title,
      estimatedMinutes: form.difficulty === 'beginner' ? 10 + index * 2 : form.difficulty === 'advanced' ? 16 + index * 2 : 13 + index * 2,
      objective: template.objective,
      content: buildLessonContent(topic, template, index),
    })),
  };
}

function buildLessonTemplates(topic: string, goals: string[], audience: Audience, count: number) {
  const audienceContext = AUDIENCE_LABELS[audience].toLowerCase();
  const base = [
    {
      title: `What ${topic} is and when to use it`,
      objective: `Give ${audienceContext} a practical mental model and decision criteria for ${topic}.`,
      focus: goals[0] ?? `Understand the core problem ${topic} solves.`,
    },
    {
      title: `The core architecture of ${topic}`,
      objective: `Break ${topic} into its main components, data flow, and trade-offs.`,
      focus: goals[1] ?? `Map the moving parts and responsibilities.`,
    },
    {
      title: `Build a ${topic} workflow`,
      objective: `Walk through a hands-on implementation plan with checkpoints and debugging guidance.`,
      focus: goals[2] ?? `Create a reliable first implementation.`,
    },
    {
      title: `Evaluate and harden ${topic}`,
      objective: `Identify failure modes, tests, operational signals, and production guardrails.`,
      focus: goals[3] ?? `Ship safely and improve over time.`,
    },
    {
      title: `${topic} capstone design review`,
      objective: `Design a full solution, defend trade-offs, and plan iteration.`,
      focus: goals[4] ?? `Synthesize the course into an implementation plan.`,
    },
    {
      title: `Advanced ${topic} patterns`,
      objective: `Explore scale, edge cases, and patterns that matter after the first release.`,
      focus: goals[5] ?? `Go deeper on advanced usage and scaling.`,
    },
  ];
  return base.slice(0, count);
}

function buildLessonContent(topic: string, template: ReturnType<typeof buildLessonTemplates>[number], index: number): LessonContent {
  return {
    schemaVersion: '1',
    sections: [
      {
        type: 'text',
        content: `## ${template.title}\n\n${template.objective}\n\n### Focus\n\n${template.focus}\n\nBy the end of this lesson, learners should be able to explain the concept, recognize where it applies, and describe one practical next step.`,
      },
      {
        type: 'callout',
        variant: index === 0 ? 'tip' : index % 2 === 0 ? 'warning' : 'info',
        title: index === 0 ? 'Teacher note' : 'Design checkpoint',
        content: index === 0
          ? `Start with the learner's existing mental model before introducing ${topic}. Anchor the lesson in a realistic problem.`
          : `Ask learners to name the trade-off they are making. Good ${topic} decisions usually balance quality, cost, latency, complexity, and safety.`,
      },
      {
        type: 'quiz',
        title: 'Knowledge check',
        passingScore: 70,
        questions: [
          {
            id: `q-${index + 1}-1`,
            question: `What is the main goal of this ${topic} lesson?`,
            options: [
              template.objective,
              `Memorize every vendor tool related to ${topic}`,
              `Avoid discussing trade-offs`,
              `Skip evaluation until production`,
            ],
            correctIndex: 0,
            explanation: 'The lesson objective is the north star for the generated draft. Teachers should refine this question for the final course.',
          },
        ],
      },
    ],
  };
}

function parseGoals(raw: string) {
  return raw
    .split(/\n|,/)
    .map(goal => goal.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function buildTags(topic: string, l1: string, l2: string) {
  return Array.from(new Set([
    ...topic.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),
    l1.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    l2.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  ])).slice(0, 8);
}

function formatBlueprint(blueprint: CourseBlueprint) {
  return [
    `# ${blueprint.title}`,
    '',
    blueprint.description,
    '',
    `Category: ${blueprint.taxonomy.l1} / ${blueprint.taxonomy.l2}`,
    `Difficulty: ${blueprint.difficulty}`,
    `Tags: ${blueprint.tags.map(tag => `#${tag}`).join(' ')}`,
    '',
    '## Lessons',
    ...blueprint.lessons.flatMap((lesson, index) => [
      '',
      `${index + 1}. ${lesson.title} (${lesson.estimatedMinutes} min)`,
      `   - Objective: ${lesson.objective}`,
      `   - Sections: ${lesson.content.sections.map(section => section.type).join(', ')}`,
    ]),
  ].join('\n');
}
