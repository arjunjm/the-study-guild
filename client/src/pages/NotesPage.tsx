import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarClock,
  ChevronRight,
  Clipboard,
  Filter,
  PenLine,
  Pin,
  Search,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface NoteMeta {
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  savedAt: string;
}

interface NoteEntry {
  lessonId: string;
  content: string;
  meta?: NoteMeta;
}

const REVIEW_LATER_KEY = 'sg-review-later-lessons';

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteEntry[]>(() => loadNotes());
  const [reviewLaterIds, setReviewLaterIds] = useState<Set<string>>(() => loadReviewLaterIds());
  const [query, setQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [reviewOnly, setReviewOnly] = useState(false);

  const courses = useMemo(() => {
    const courseMap = new Map<string, string>();
    for (const note of notes) {
      const courseId = note.meta?.courseId ?? 'unknown';
      courseMap.set(courseId, note.meta?.courseTitle ?? 'Unknown course');
    }
    return [...courseMap.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [notes]);

  const filteredNotes = notes.filter(note => {
    const haystack = `${note.content} ${note.meta?.lessonTitle ?? ''} ${note.meta?.courseTitle ?? ''}`.toLowerCase();
    const matchesQuery = !query.trim() || haystack.includes(query.toLowerCase().trim());
    const matchesCourse = courseFilter === 'all' || (note.meta?.courseId ?? 'unknown') === courseFilter;
    const matchesReview = !reviewOnly || reviewLaterIds.has(note.lessonId);
    return matchesQuery && matchesCourse && matchesReview;
  });

  const byCourse = filteredNotes.reduce<Record<string, { title: string; courseId: string; notes: NoteEntry[] }>>((acc, note) => {
    const courseId = note.meta?.courseId ?? 'unknown';
    if (!acc[courseId]) acc[courseId] = { title: note.meta?.courseTitle ?? 'Unknown course', courseId, notes: [] };
    acc[courseId].notes.push(note);
    return acc;
  }, {});

  const totalWords = notes.reduce((sum, note) => sum + note.content.trim().split(/\s+/).filter(Boolean).length, 0);

  function deleteNote(lessonId: string) {
    localStorage.removeItem(`lesson-notes-${lessonId}`);
    localStorage.removeItem(`lesson-note-meta-${lessonId}`);
    setNotes(prev => prev.filter(n => n.lessonId !== lessonId));
    setReviewLaterIds(prev => {
      const next = new Set(prev);
      next.delete(lessonId);
      saveReviewLaterIds(next);
      return next;
    });
  }

  function updateNote(lessonId: string, content: string) {
    setNotes(prev => prev.map(note => note.lessonId === lessonId ? { ...note, content } : note));
    if (content.trim()) localStorage.setItem(`lesson-notes-${lessonId}`, content);
    else deleteNote(lessonId);
  }

  function toggleReviewLater(lessonId: string) {
    setReviewLaterIds(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      saveReviewLaterIds(next);
      return next;
    });
  }

  async function copyNote(note: NoteEntry) {
    await navigator.clipboard.writeText(note.content);
  }

  if (notes.length === 0) {
    return (
      <div className="min-h-full bg-slate-50 px-4 py-8 lg:px-10 lg:py-10">
        <NotebookHeader noteCount={0} courseCount={0} reviewCount={0} wordCount={0} />
        <div className="mx-auto max-w-3xl rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <PenLine className="mx-auto mb-3 h-9 w-9 text-slate-300" />
          <p className="font-medium text-slate-600">No notes yet</p>
          <p className="mt-1 text-sm text-slate-400">Open a lesson and jot something down. It will appear here as a searchable study card.</p>
          <Link
            to="/courses"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <BookOpen className="h-4 w-4" />
            Browse courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 px-4 py-8 lg:px-10 lg:py-10">
      <NotebookHeader
        noteCount={notes.length}
        courseCount={courses.length}
        reviewCount={reviewLaterIds.size}
        wordCount={totalWords}
      />

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search notes, lessons, courses, or #tags..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white"
            >
              <option value="all">All courses</option>
              {courses.map(([courseId, title]) => (
                <option key={courseId} value={courseId}>{title}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setReviewOnly(v => !v)}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition',
              reviewOnly
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
            )}
          >
            <Pin className={cn('h-4 w-4', reviewOnly && 'fill-amber-400')} />
            Review later
          </button>
        </div>
      </section>

      {filteredNotes.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Search className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-medium text-slate-600">No matching notes</p>
          <p className="mt-1 text-sm text-slate-400">Try a different search, course filter, or review-later toggle.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byCourse).map(([courseId, { title, notes: courseNotes }]) => (
            <section key={courseId}>
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 shrink-0 text-violet-500" />
                <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{courseNotes.length}</span>
                {courseId !== 'unknown' && (
                  <Link to={`/courses/${courseId}`} className="ml-auto text-xs text-violet-600 transition hover:text-violet-700">
                    View course →
                  </Link>
                )}
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                {courseNotes.map(note => (
                  <NoteCard
                    key={note.lessonId}
                    note={note}
                    courseId={courseId}
                    reviewLater={reviewLaterIds.has(note.lessonId)}
                    onToggleReview={() => toggleReviewLater(note.lessonId)}
                    onDelete={() => deleteNote(note.lessonId)}
                    onCopy={() => copyNote(note)}
                    onChange={content => updateNote(note.lessonId, content)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function NotebookHeader({ noteCount, courseCount, reviewCount, wordCount }: {
  noteCount: number;
  courseCount: number;
  reviewCount: number;
  wordCount: number;
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-slate-900 bg-slate-950 text-white shadow-sm">
      <div className="relative p-6 lg:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.20),transparent_30%)]" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-100">
            <StickyNote className="h-3.5 w-3.5 text-amber-300" />
            Study notebook
          </div>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div>
              <h1 className="font-display text-3xl font-bold lg:text-4xl">Your personal knowledge vault</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Search, revise, pin, and return to the notes you capture while learning.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <NotebookMetric label="Notes" value={noteCount} />
              <NotebookMetric label="Courses" value={courseCount} />
              <NotebookMetric label="Review" value={reviewCount} />
              <NotebookMetric label="Words" value={wordCount} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NotebookMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
      <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}

function NoteCard({ note, courseId, reviewLater, onToggleReview, onDelete, onCopy, onChange }: {
  note: NoteEntry;
  courseId: string;
  reviewLater: boolean;
  onToggleReview: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onChange: (content: string) => void;
}) {
  const tags = extractTags(note.content);
  return (
    <article className={cn('rounded-3xl border bg-white p-4 shadow-sm', reviewLater ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200')}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{note.meta?.lessonTitle ?? `Lesson ${note.lessonId}`}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            {note.meta?.savedAt && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {new Date(note.meta.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {reviewLater && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">review later</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {courseId !== 'unknown' && (
            <Link
              to={`/courses/${courseId}/lessons/${note.lessonId}`}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600"
              title="Go to lesson"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          <button onClick={onToggleReview} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600" title="Toggle review later">
            <Pin className={cn('h-3.5 w-3.5', reviewLater && 'fill-amber-400 text-amber-600')} />
          </button>
          <button onClick={onCopy} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" title="Copy note">
            <Clipboard className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500" title="Delete note">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <textarea
        value={note.content}
        onChange={e => onChange(e.target.value)}
        rows={Math.min(10, Math.max(4, note.content.split('\n').length + 1))}
        className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
      />

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span key={tag} className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-medium text-violet-700">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function loadNotes(): NoteEntry[] {
  const entries: NoteEntry[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('lesson-notes-')) continue;
    const lessonId = key.replace('lesson-notes-', '');
    const content = localStorage.getItem(key) ?? '';
    if (!content.trim()) continue;
    const metaRaw = localStorage.getItem(`lesson-note-meta-${lessonId}`);
    let meta: NoteMeta | undefined;
    try {
      meta = metaRaw ? (JSON.parse(metaRaw) as NoteMeta) : undefined;
    } catch {
      meta = undefined;
    }
    entries.push({ lessonId, content, meta });
  }
  return entries.sort((a, b) => {
    if (a.meta?.savedAt && b.meta?.savedAt) return new Date(b.meta.savedAt).getTime() - new Date(a.meta.savedAt).getTime();
    return 0;
  });
}

function loadReviewLaterIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(REVIEW_LATER_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function saveReviewLaterIds(ids: Set<string>) {
  localStorage.setItem(REVIEW_LATER_KEY, JSON.stringify([...ids]));
}

function extractTags(content: string) {
  return Array.from(new Set([...content.matchAll(/#([a-zA-Z0-9][\w-]*)/g)].map(match => match[1].toLowerCase()))).slice(0, 8);
}
