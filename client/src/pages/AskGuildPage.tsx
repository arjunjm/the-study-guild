import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Clock,
  MessageCircleQuestion,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tags,
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { TAXONOMY } from '../data/taxonomy';
import { cn } from '../lib/utils';
import type { Course } from '@study-guild/shared';

interface ScoredCourse {
  course: Course;
  score: number;
  reasons: string[];
}

const EXAMPLE_PROMPTS = [
  'How do I learn RAG and evaluate hallucinations?',
  'What should I study to become a backend engineer?',
  'I want to understand OAuth, JWTs, and authorization',
  'Which courses help me ship apps on cloud infrastructure?',
];

export default function AskGuildPage() {
  const [question, setQuestion] = useState('');
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['courses', '', '', '', ''],
    queryFn: async () => (await apiClient.get<{ data: Course[] }>('/courses')).data.data,
  });

  const matches = useMemo(() => rankCourses(question, courses ?? []), [question, courses]);
  const top = matches[0];
  const hasQuestion = question.trim().length > 0;

  return (
    <div className="min-h-full bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-900 bg-slate-950 px-4 py-10 text-white lg:px-10 lg:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.38),transparent_32%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.20),transparent_30%),linear-gradient(135deg,#020617_0%,#111827_54%,#1e1b4b_100%)]" />
        <div className="absolute inset-0 opacity-25 dot-pattern" />
        <div className="relative max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-violet-100 backdrop-blur">
            <MessageCircleQuestion className="h-3.5 w-3.5 text-amber-300" />
            Ask the Guild
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight lg:text-6xl">
            Ask a learning question.
            <span className="block text-gradient-gold">Get cited course leads.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            A local catalog assistant ranks courses by topic, tags, title, and description so you can find the best place to start without leaving the app.
          </p>
        </div>
      </section>

      <div className="px-4 py-8 lg:px-10 lg:py-10">
        <section className="-mt-16 mb-8 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask: What should I learn for RAG, backend systems, security, cloud...?"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
          </div>
          {!hasQuestion && (
            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => setQuestion(prompt)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </section>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-400 shadow-sm">Searching the guild catalog...</div>
        ) : !hasQuestion ? (
          <EmptyState />
        ) : top ? (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <main className="space-y-4">
              <AnswerPanel question={question} matches={matches} />
              <div className="grid gap-4 md:grid-cols-2">
                {matches.slice(0, 6).map(match => (
                  <CourseResult key={match.course.id} match={match} />
                ))}
              </div>
            </main>
            <aside className="space-y-4">
              <BestMatch match={top} />
              <HowItWorks />
            </aside>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Brain className="mx-auto mb-3 h-9 w-9 text-slate-300" />
            <p className="font-semibold text-slate-700">No strong matches yet</p>
            <p className="mt-1 text-sm text-slate-500">Try naming a topic, technology, role, or goal.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AnswerPanel({ question, matches }: { question: string; matches: ScoredCourse[] }) {
  const top = matches[0];
  return (
    <section className="rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600">Guild answer</p>
          <p className="text-sm text-slate-500">Based on {matches.length} cited course match{matches.length !== 1 ? 'es' : ''}</p>
        </div>
      </div>
      <p className="text-sm leading-7 text-slate-700">
        For <span className="font-semibold text-slate-950">"{question.trim()}"</span>, start with{' '}
        <Link to={`/courses/${top.course.id}`} className="font-semibold text-violet-700 hover:text-violet-800">
          {top.course.title}
        </Link>
        . It matched because of {top.reasons.slice(0, 3).join(', ')}. Use the cited results below as the learning trail.
      </p>
    </section>
  );
}

function BestMatch({ match }: { match: ScoredCourse }) {
  const course = match.course;
  return (
    <section className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-500">Best first quest</p>
      <h2 className="text-lg font-bold text-slate-950">{course.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{course.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniStat icon={BookOpen} label="Lessons" value={course.totalLessons} />
        <MiniStat icon={Clock} label="Time" value={`${course.estimatedMinutes}m`} />
      </div>
      <Link to={`/courses/${course.id}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700">
        Open course
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function CourseResult({ match }: { match: ScoredCourse }) {
  const { course, reasons, score } = match;
  const cat = TAXONOMY.find(item => item.l1 === course.taxonomy.l1);
  return (
    <Link to={`/courses/${course.id}`} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Score {score}</p>
          <h3 className="text-lg font-bold leading-snug text-slate-950 group-hover:text-violet-700">{course.title}</h3>
        </div>
        {cat && (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', cat.bgColor)}>
            <cat.icon className={cn('h-5 w-5', cat.color)} />
          </span>
        )}
      </div>
      <p className="line-clamp-3 text-sm leading-6 text-slate-500">{course.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {reasons.slice(0, 4).map(reason => (
          <span key={reason} className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-medium text-violet-700">
            {reason}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {course.totalLessons}</span>
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.estimatedMinutes}m</span>
        {course.ratingCount > 0 && (
          <span className="ml-auto flex items-center gap-1 font-semibold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {course.ratingAverage.toFixed(1)}
          </span>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { icon: Tags, title: 'Search by topic', body: 'Ask for RAG, OAuth, SQL, Kubernetes, React, or any tag in the catalog.' },
        { icon: ShieldCheck, title: 'Search by goal', body: 'Try role-oriented questions like backend engineer, AI engineer, or cloud developer.' },
        { icon: MessageCircleQuestion, title: 'Get citations', body: 'Results cite specific courses so you can inspect the learning path immediately.' },
      ].map(({ icon: Icon, title, body }) => (
        <div key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <Icon className="mb-4 h-6 w-6 text-violet-600" />
          <h2 className="font-bold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
        </div>
      ))}
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">How ranking works</p>
      <p className="text-sm leading-6 text-slate-500">
        This first version runs locally over course metadata. Title matches weigh most, then tags, taxonomy, and descriptions. It does not call an external model or send your query anywhere.
      </p>
    </section>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <Icon className="mb-2 h-4 w-4 text-slate-400" />
      <p className="text-sm font-bold text-slate-900">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}

function rankCourses(question: string, courses: Course[]): ScoredCourse[] {
  const tokens = tokenize(question);
  if (tokens.length === 0) return [];

  return courses
    .map(course => scoreCourse(course, tokens))
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score || b.course.ratingAverage - a.course.ratingAverage || a.course.title.localeCompare(b.course.title));
}

function scoreCourse(course: Course, tokens: string[]): ScoredCourse {
  const title = course.title.toLowerCase();
  const description = course.description.toLowerCase();
  const taxonomy = `${course.taxonomy.l1} ${course.taxonomy.l2}`.toLowerCase();
  const tags = (course.tags ?? []).map(tag => tag.toLowerCase());
  let score = 0;
  const reasons = new Set<string>();

  for (const token of tokens) {
    if (title.includes(token)) {
      score += 6;
      reasons.add('title');
    }
    if (tags.some(tag => tag.includes(token) || token.includes(tag))) {
      score += 5;
      reasons.add('tags');
    }
    if (taxonomy.includes(token)) {
      score += 4;
      reasons.add('topic');
    }
    if (description.includes(token)) {
      score += 2;
      reasons.add('description');
    }
  }

  if (course.ratingAverage >= 4.7) score += 1;
  return { course, score, reasons: [...reasons] };
}

function tokenize(input: string) {
  const stop = new Set(['the', 'and', 'for', 'with', 'what', 'how', 'should', 'learn', 'course', 'courses', 'me', 'to', 'i', 'a', 'an', 'of', 'in']);
  return input
    .toLowerCase()
    .split(/[^a-z0-9+#.-]+/)
    .map(token => token.trim())
    .filter(token => token.length >= 2 && !stop.has(token));
}
