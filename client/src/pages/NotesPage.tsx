import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PenLine, BookOpen, ChevronRight, Trash2 } from 'lucide-react';

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

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteEntry[]>([]);

  useEffect(() => {
    const entries: NoteEntry[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('lesson-notes-')) continue;
      const lessonId = key.replace('lesson-notes-', '');
      const content = localStorage.getItem(key) ?? '';
      if (!content.trim()) continue;
      const metaRaw = localStorage.getItem(`lesson-note-meta-${lessonId}`);
      const meta = metaRaw ? (JSON.parse(metaRaw) as NoteMeta) : undefined;
      entries.push({ lessonId, content, meta });
    }
    entries.sort((a, b) => {
      if (a.meta?.savedAt && b.meta?.savedAt) {
        return new Date(b.meta.savedAt).getTime() - new Date(a.meta.savedAt).getTime();
      }
      return 0;
    });
    setNotes(entries);
  }, []);

  const byCourse = notes.reduce<Record<string, { title: string; courseId: string; notes: NoteEntry[] }>>((acc, note) => {
    const courseId = note.meta?.courseId ?? 'unknown';
    if (!acc[courseId]) acc[courseId] = { title: note.meta?.courseTitle ?? 'Unknown course', courseId, notes: [] };
    acc[courseId].notes.push(note);
    return acc;
  }, {});

  function deleteNote(lessonId: string) {
    localStorage.removeItem(`lesson-notes-${lessonId}`);
    localStorage.removeItem(`lesson-note-meta-${lessonId}`);
    setNotes(prev => prev.filter(n => n.lessonId !== lessonId));
  }

  if (notes.length === 0) {
    return (
      <div className="px-4 py-8 lg:px-10 lg:py-10 max-w-3xl">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold text-slate-900 lg:text-3xl">My Notes</h1>
          <p className="text-sm text-slate-500">Notes you take during lessons are saved here.</p>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <PenLine className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-medium text-slate-600">No notes yet</p>
          <p className="mt-1 text-sm text-slate-400">Open a lesson and jot something down — it'll appear here.</p>
          <Link
            to="/courses"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition"
          >
            <BookOpen className="h-4 w-4" />
            Browse courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:px-10 lg:py-10 max-w-3xl">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-slate-900 lg:text-3xl">My Notes</h1>
        <p className="text-sm text-slate-500">
          {notes.length} note{notes.length !== 1 ? 's' : ''} across{' '}
          {Object.keys(byCourse).length} course{Object.keys(byCourse).length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-10">
        {Object.entries(byCourse).map(([courseId, { title, notes: courseNotes }]) => (
          <div key={courseId}>
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0 text-violet-500" />
              <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
              {courseId !== 'unknown' && (
                <Link
                  to={`/courses/${courseId}`}
                  className="ml-auto text-xs text-violet-600 hover:text-violet-700 transition"
                >
                  View course →
                </Link>
              )}
            </div>
            <div className="space-y-3">
              {courseNotes.map(note => (
                <div key={note.lessonId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {note.meta?.lessonTitle ?? `Lesson ${note.lessonId}`}
                      </p>
                      {note.meta?.savedAt && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(note.meta.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {courseId !== 'unknown' && (
                        <Link
                          to={`/courses/${courseId}/lessons/${note.lessonId}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition"
                          title="Go to lesson"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => deleteNote(note.lessonId)}
                        className="rounded-lg p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                        title="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
