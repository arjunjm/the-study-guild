import { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import type { QuizSection as QuizSectionType } from '@study-guild/shared';

function InlineCode({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`')
          ? <code key={i} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] text-slate-700">{part.slice(1, -1)}</code>
          : part
      )}
    </>
  );
}

interface Props {
  section: QuizSectionType;
  onDone: (score: number) => void;
}

export default function QuizSection({ section, onDone }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  function submit() {
    const correct = section.questions.filter(q => answers[q.id] === q.correctIndex).length;
    const pct = Math.round((correct / section.questions.length) * 100);
    setScore(pct);
    setSubmitted(true);
    setAttempts(a => a + 1);
    onDone(pct);
  }

  function retry() {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
  }

  const allAnswered = section.questions.every(q => answers[q.id] !== undefined);
  const passed = (score ?? 0) >= section.passingScore;

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-violet-200 bg-white px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-violet-600">Knowledge Check</p>
        {section.title && <p className="mt-0.5 text-sm font-semibold text-slate-900">{section.title}</p>}
      </div>

      <div className="p-5 space-y-7">
        {!submitted && section.questions.length > 1 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {section.questions.map(q => (
                <div
                  key={q.id}
                  className={`h-1.5 w-4 rounded-full transition-colors ${answers[q.id] !== undefined ? 'bg-violet-500' : 'bg-slate-200'}`}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-400">
              {Object.keys(answers).length}/{section.questions.length} answered
            </span>
          </div>
        )}
        {section.questions.map((q, qi) => (
          <div key={q.id}>
            <p className="mb-3 text-sm font-medium text-slate-800">
              <span className="mr-2 text-xs text-slate-400">{String(qi + 1).padStart(2, '0')}.</span>
              <InlineCode text={q.question} />
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === oi;
                const isCorrect = submitted && oi === q.correctIndex;
                const isWrong = submitted && selected && oi !== q.correctIndex;

                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all duration-150
                      ${isCorrect
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : isWrong
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : selected
                        ? 'border-violet-300 bg-violet-100 text-violet-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-white hover:text-slate-800'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <InlineCode text={opt} />
                      {isCorrect && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />}
                      {isWrong && <XCircle className="h-4 w-4 shrink-0 text-red-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <div className="mt-2 rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs text-slate-500 leading-relaxed">
                💡 <InlineCode text={q.explanation} />
              </div>
            )}
          </div>
        ))}

        {/* Submit / result */}
        {!submitted ? (
          <div className="flex items-center gap-3">
            <button
              onClick={submit}
              disabled={!allAnswered}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-violet-500 hover:to-violet-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit answers
            </button>
            {attempts > 0 && (
              <span className="text-xs text-slate-400">Attempt {attempts + 1}</span>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`flex items-center gap-3 rounded-xl border p-4 ${passed ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
              {passed
                ? <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                : <XCircle className="h-5 w-5 shrink-0 text-red-600" />}
              <div className="flex-1">
                <p className={`text-sm font-semibold ${passed ? 'text-emerald-700' : 'text-red-700'}`}>
                  {passed ? `Passed! Score: ${score}%` : `Score: ${score}% — need ${section.passingScore}% to pass`}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {passed
                    ? 'Great work — mark the lesson as complete below.'
                    : `Attempt ${attempts} — review the answers above and try again.`}
                </p>
              </div>
            </div>
            {!passed && (
              <button
                onClick={retry}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 hover:border-violet-300 hover:text-violet-700 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
