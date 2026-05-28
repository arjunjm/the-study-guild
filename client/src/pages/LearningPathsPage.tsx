import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Flag,
  Lock,
  Route,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { LEARNING_PATHS, type LearningPath, type LearningPathAccent, type LearningPathNode } from '../data/learningPaths';
import { cn } from '../lib/utils';
import { XP_REWARDS } from '../lib/xpUtils';
import type { Course, UserCourseProgress } from '@study-guild/shared';

const ACCENT_STYLES: Record<LearningPathAccent, {
  hero: string;
  text: string;
  border: string;
  bg: string;
  softBg: string;
  button: string;
  line: string;
}> = {
  violet: {
    hero: 'from-violet-600 via-fuchsia-500 to-amber-400',
    text: 'text-violet-600',
    border: 'border-violet-200',
    bg: 'bg-violet-600',
    softBg: 'bg-violet-50',
    button: 'bg-violet-600 hover:bg-violet-500 text-white',
    line: 'from-violet-500 via-fuchsia-400 to-amber-300',
  },
  cyan: {
    hero: 'from-cyan-500 via-sky-500 to-violet-500',
    text: 'text-cyan-600',
    border: 'border-cyan-200',
    bg: 'bg-cyan-600',
    softBg: 'bg-cyan-50',
    button: 'bg-cyan-600 hover:bg-cyan-500 text-white',
    line: 'from-cyan-400 via-sky-400 to-violet-400',
  },
  amber: {
    hero: 'from-amber-500 via-orange-500 to-violet-500',
    text: 'text-amber-600',
    border: 'border-amber-200',
    bg: 'bg-amber-500',
    softBg: 'bg-amber-50',
    button: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    line: 'from-amber-300 via-orange-400 to-violet-400',
  },
  emerald: {
    hero: 'from-emerald-500 via-teal-500 to-cyan-500',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    bg: 'bg-emerald-600',
    softBg: 'bg-emerald-50',
    button: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    line: 'from-emerald-400 via-teal-400 to-cyan-400',
  },
  rose: {
    hero: 'from-rose-500 via-pink-500 to-violet-500',
    text: 'text-rose-600',
    border: 'border-rose-200',
    bg: 'bg-rose-600',
    softBg: 'bg-rose-50',
    button: 'bg-rose-600 hover:bg-rose-500 text-white',
    line: 'from-rose-400 via-pink-400 to-violet-400',
  },
};

interface CourseCompletion {
  course: Course;
  completedLessons: number;
  totalLessons: number;
  pct: number;
}

export default function LearningPathsPage() {
  const [selectedPathId, setSelectedPathId] = useState(LEARNING_PATHS[0]?.id ?? '');

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['courses', '', '', '', ''],
    queryFn: async () => (await apiClient.get<{ data: Course[] }>('/courses')).data.data,
  });

  const { data: progress } = useQuery<UserCourseProgress[]>({
    queryKey: ['all-progress'],
    queryFn: async () => (await apiClient.get<{ data: UserCourseProgress[] }>('/progress')).data.data,
  });

  const courseById = useMemo(() => new Map((courses ?? []).map(course => [course.id, course])), [courses]);
  const progressByCourseId = useMemo(() => new Map((progress ?? []).map(item => [item.courseId, item])), [progress]);
  const selectedPath = LEARNING_PATHS.find(path => path.id === selectedPathId) ?? LEARNING_PATHS[0];
  const pathStats = getPathStats(selectedPath, courseById, progressByCourseId);

  return (
    <div className="min-h-full bg-slate-50">
      <section className="relative overflow-hidden border-b border-slate-900 bg-slate-950 px-4 py-10 text-white lg:px-10 lg:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.38),transparent_32%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.24),transparent_30%),linear-gradient(135deg,#020617_0%,#111827_54%,#1e1b4b_100%)]" />
        <div className="absolute inset-0 opacity-25 dot-pattern" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-violet-100 backdrop-blur">
              <Route className="h-3.5 w-3.5 text-amber-300" />
              Learning Paths
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white lg:text-6xl">
              Follow a skill tree,
              <span className="block text-gradient-gold">not a random catalog.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Curated guild paths stitch courses into career-ready routes with prerequisites, unlocked next steps, progress, and estimated XP.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <HeroMetric icon={Compass} label="Paths" value={LEARNING_PATHS.length} />
            <HeroMetric icon={BookOpen} label="Courses mapped" value={new Set(LEARNING_PATHS.flatMap(path => path.nodes.map(node => node.courseId))).size} />
            <HeroMetric icon={Trophy} label="Completed" value={pathStats.completedNodes} />
            <HeroMetric icon={Zap} label="Path XP" value={`+${pathStats.baseXp}`} />
          </div>
        </div>
      </section>

      <div className="px-4 py-8 lg:px-10 lg:py-10">
        <div className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {LEARNING_PATHS.map(path => {
            const styles = ACCENT_STYLES[path.accent];
            const stats = getPathStats(path, courseById, progressByCourseId);
            const active = path.id === selectedPath.id;

            return (
              <button
                key={path.id}
                onClick={() => setSelectedPathId(path.id)}
                className={cn(
                  'group rounded-3xl border bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
                  active ? cn(styles.border, 'ring-2 ring-offset-2 ring-violet-200') : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div className={cn('mb-4 h-1.5 rounded-full bg-gradient-to-r', styles.hero)} />
                <p className={cn('mb-1 text-[10px] font-bold uppercase tracking-[0.2em]', styles.text)}>{path.subtitle}</p>
                <h2 className="text-lg font-bold text-slate-950">{path.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{path.description}</p>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                    <span>{stats.completedNodes}/{stats.availableNodes} courses</span>
                    <span>{stats.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn('h-full rounded-full bg-gradient-to-r transition-all', styles.line)} style={{ width: `${stats.pct}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedPath && (
          <PathDetail
            path={selectedPath}
            courseById={courseById}
            progressByCourseId={progressByCourseId}
          />
        )}
      </div>
    </div>
  );
}

function PathDetail({ path, courseById, progressByCourseId }: {
  path: LearningPath;
  courseById: Map<string, Course>;
  progressByCourseId: Map<string, UserCourseProgress>;
}) {
  const styles = ACCENT_STYLES[path.accent];
  const nodeStates = path.nodes.map(node => getNodeState(node, courseById, progressByCourseId));
  const nextNode = nodeStates.find(node => node.unlocked && node.completion.pct < 100) ?? nodeStates.find(node => node.completion.pct < 100);
  const stats = getPathStats(path, courseById, progressByCourseId);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className={cn('h-2 bg-gradient-to-r', styles.hero)} />
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={cn('mb-2 text-[11px] font-bold uppercase tracking-[0.2em]', styles.text)}>{path.subtitle}</p>
              <h2 className="font-display text-3xl font-bold text-slate-950">{path.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{path.description}</p>
            </div>
            <div className={cn('rounded-2xl border px-4 py-3 text-right', styles.border, styles.softBg)}>
              <p className="text-2xl font-bold text-slate-950">{stats.pct}%</p>
              <p className="text-xs text-slate-500">complete</p>
            </div>
          </div>
        </div>

        <div className="relative p-5 sm:p-6">
          <div className={cn('absolute bottom-12 left-10 top-12 w-px bg-gradient-to-b', styles.line)} />
          <div className="space-y-4">
            {nodeStates.map((state, index) => (
              <PathNodeCard
                key={state.node.id}
                index={index}
                state={state}
                styles={styles}
              />
            ))}
          </div>
        </div>
      </main>

      <aside className="space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500">Recommended next</p>
          {nextNode?.course ? (
            <>
              <h3 className="text-lg font-bold text-slate-950">{nextNode.course.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{nextNode.node.summary}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <MiniStat icon={Clock} label="Time" value={`${nextNode.course.estimatedMinutes}m`} />
                <MiniStat icon={Zap} label="Base XP" value={`+${nextNode.course.totalLessons * XP_REWARDS.lesson_completed}`} />
              </div>
              <Link
                to={`/courses/${nextNode.course.id}`}
                className={cn('mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition', styles.button)}
              >
                Open course
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Path complete. The guild has no further required quests on this route.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-500">Outcome</p>
          <p className="text-sm leading-6 text-slate-600">{path.outcome}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniStat icon={Flag} label="Weeks" value={path.estimatedWeeks} />
            <MiniStat icon={Target} label="Skills" value={path.nodes.reduce((sum, node) => sum + node.skills.length, 0)} />
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-400">
            XP shown is an estimate from included lesson completions. Courses still award XP through normal lesson completion.
          </p>
        </section>
      </aside>
    </div>
  );
}

function PathNodeCard({ index, state, styles }: {
  index: number;
  state: ReturnType<typeof getNodeState>;
  styles: (typeof ACCENT_STYLES)[LearningPathAccent];
}) {
  const { node, course, completion, unlocked, missingPrereqs } = state;
  const complete = completion.pct >= 100;
  const active = unlocked && !complete && completion.pct > 0;
  const available = unlocked && !complete;

  return (
    <div className={cn(
      'relative flex gap-4 rounded-3xl border p-4 transition-all',
      complete
        ? 'border-emerald-200 bg-emerald-50'
        : available
        ? cn(styles.border, styles.softBg)
        : 'border-slate-200 bg-slate-50'
    )}>
      <div className={cn(
        'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold',
        complete
          ? 'border-emerald-300 bg-emerald-500 text-white'
          : available
          ? cn('border-transparent text-white', styles.bg, active && 'animate-rank-glow')
          : 'border-slate-200 bg-white text-slate-400'
      )}>
        {complete ? <CheckCircle2 className="h-5 w-5" /> : available ? <Sparkles className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step {String(index + 1).padStart(2, '0')}</span>
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
            complete ? 'bg-emerald-100 text-emerald-700' : available ? 'bg-white/70 text-slate-700' : 'bg-slate-100 text-slate-500'
          )}>
            {complete ? 'Complete' : available ? 'Unlocked' : 'Locked'}
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-950">{node.label}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{node.summary}</p>

        {course ? (
          <>
            <Link to={`/courses/${course.id}`} className={cn('mt-3 inline-flex items-center gap-1 text-sm font-semibold transition', styles.text)}>
              {course.title}
              <ChevronRight className="h-4 w-4" />
            </Link>
            <div className="mt-3">
              <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                <span>{completion.completedLessons}/{completion.totalLessons} lessons</span>
                <span>{completion.pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div className={cn('h-full rounded-full bg-gradient-to-r', complete ? 'from-emerald-500 to-emerald-400' : styles.line)} style={{ width: `${completion.pct}%` }} />
              </div>
            </div>
          </>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            Course coming soon: {node.courseId}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {node.skills.map(skill => (
            <span key={skill} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
              {skill}
            </span>
          ))}
        </div>

        {!unlocked && missingPrereqs.length > 0 && (
          <p className="mt-3 text-xs text-slate-400">
            Unlock by completing {missingPrereqs.join(', ')}.
          </p>
        )}
      </div>
    </div>
  );
}

function HeroMetric({ icon: Icon, label, value }: { icon: typeof Compass; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-lg shadow-slate-950/10 backdrop-blur">
      <Icon className="mb-4 h-5 w-5 text-amber-200" />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <Icon className="mb-2 h-4 w-4 text-slate-400" />
      <p className="text-sm font-bold text-slate-900">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}

function getPathStats(
  path: LearningPath,
  courseById: Map<string, Course>,
  progressByCourseId: Map<string, UserCourseProgress>,
) {
  const states = path.nodes.map(node => getNodeState(node, courseById, progressByCourseId));
  const availableNodes = states.filter(state => !!state.course).length;
  const completedNodes = states.filter(state => state.completion.pct >= 100).length;
  const totalLessons = states.reduce((sum, state) => sum + state.completion.totalLessons, 0);
  const completedLessons = states.reduce((sum, state) => sum + state.completion.completedLessons, 0);
  const baseXp = totalLessons * XP_REWARDS.lesson_completed;
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  return { availableNodes, completedNodes, totalLessons, completedLessons, baseXp, pct };
}

function getNodeState(
  node: LearningPathNode,
  courseById: Map<string, Course>,
  progressByCourseId: Map<string, UserCourseProgress>,
) {
  const course = courseById.get(node.courseId);
  const completion = course
    ? getCourseCompletion(course, progressByCourseId.get(course.id))
    : { course: undefined as unknown as Course, completedLessons: 0, totalLessons: 0, pct: 0 };
  const missingPrereqs = node.prereqCourseIds.filter(courseId => {
    const prereq = courseById.get(courseId);
    if (!prereq) return true;
    return getCourseCompletion(prereq, progressByCourseId.get(courseId)).pct < 100;
  });
  return {
    node,
    course,
    completion,
    unlocked: missingPrereqs.length === 0,
    missingPrereqs,
  };
}

function getCourseCompletion(course: Course, progress?: UserCourseProgress): CourseCompletion {
  const completedIds = new Set(progress?.completedLessonIds ?? []);
  const completedLessons = course.lessonIds.filter(id => completedIds.has(id)).length;
  const totalLessons = course.totalLessons > 0 ? course.totalLessons : course.lessonIds.length;
  const pct = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
  return { course, completedLessons, totalLessons, pct };
}
