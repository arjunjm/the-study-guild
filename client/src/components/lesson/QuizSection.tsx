import { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import type { QuizSection as QuizSectionType } from '@study-guild/shared';

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
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-900/80 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-violet-400">Knowledge Check</p>
        {section.title && <p className="mt-0.5 text-sm font-semibold text-white">{section.title}</p>}
      </div>

      <div className="p-5 space-y-7">
        {section.questions.map((q, qi) => (
          <div key={q.id}>
            <p className="mb-3 text-sm font-medium text-slate-200">
              <span className="mr-2 text-xs text-slate-600">{String(qi + 1).padStart(2, '0')}.</span>
              {q.question}
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
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        : isWrong
                        ? 'border-red-500/40 bg-red-500/10 text-red-300'
                        : selected
                        ? 'border-violet-500/40 bg-violet-500/10 text-violet-200'
                        : 'border-slate-700/60 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{opt}</span>
                      {isCorrect && <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />}
                      {isWrong && <XCircle className="h-4 w-4 shrink-0 text-red-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <div className="mt-2 rounded-lg bg-slate-800/60 px-3 py-2 text-xs text-slate-400 leading-relaxed">
                💡 {q.explanation}
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
              className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/15 transition hover:from-violet-500 hover:to-violet-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit answers
            </button>
            {attempts > 0 && (
              <span className="text-xs text-slate-600">Attempt {attempts + 1}</span>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`flex items-center gap-3 rounded-xl border p-4 ${passed ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-red-500/30 bg-red-500/8'}`}>
              {passed
                ? <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                : <XCircle className="h-5 w-5 shrink-0 text-red-400" />}
              <div className="flex-1">
                <p className={`text-sm font-semibold ${passed ? 'text-emerald-300' : 'text-red-300'}`}>
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
                className="flex items-center gap-2 rounded-xl border border-slate-700/60 px-4 py-2 text-sm text-slate-400 hover:border-violet-500/40 hover:text-violet-300 transition"
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
