import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle, Zap, Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { LessonContent, LessonSection } from '@study-guild/shared';
import FlowDiagramSection from './FlowDiagramSection';
import QuizSection from './QuizSection';

interface Props {
  content: LessonContent;
  onComplete: (quizScore?: number) => void;
  completing?: boolean;
  alreadyComplete?: boolean;
}

export default function LessonRenderer({ content, onComplete, completing = false, alreadyComplete = false }: Props) {
  const [quizScore, setQuizScore] = useState<number | undefined>(undefined);
  const hasQuiz = content.sections.some(s => s.type === 'quiz');

  // Quiz is optional — the button is always enabled
  const quizDone = quizScore !== undefined;
  const quizBonusHint = hasQuiz && !quizDone;

  return (
    <div className="space-y-8">
      {content.sections.map((section, i) => (
        <SectionRenderer key={i} section={section} onQuizDone={setQuizScore} />
      ))}

      <div className="pt-4 border-t border-slate-800/60 space-y-3">
        {quizBonusHint && !alreadyComplete && (
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Zap className="h-3.5 w-3.5 text-violet-400" />
            Complete the quiz above for up to <span className="text-violet-400 font-medium">+40 bonus XP</span>
          </p>
        )}
        {alreadyComplete ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-5 py-3 text-sm font-medium text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Lesson already complete — use the navigation below to continue
          </div>
        ) : (
          <button
            onClick={() => !completing && onComplete(quizScore)}
            disabled={completing}
            className={cn(
              'group flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200',
              completing
                ? 'bg-violet-600/50 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-violet-600 to-violet-500 shadow-violet-500/20 hover:from-violet-500 hover:to-violet-400'
            )}
          >
            <CheckCircle className="h-4 w-4 shrink-0" />
            {completing ? 'Saving…' : 'Mark lesson complete'}
          </button>
        )}
      </div>
    </div>
  );
}

function SectionRenderer({ section, onQuizDone }: { section: LessonSection; onQuizDone: (score: number) => void }) {
  switch (section.type) {
    case 'text':
      return (
        <div className="prose prose-invert prose-slate prose-sm max-w-none
          prose-headings:text-white prose-headings:font-semibold
          prose-p:text-slate-300 prose-p:leading-relaxed
          prose-strong:text-slate-200
          prose-code:text-violet-300 prose-code:bg-slate-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
          prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
          prose-table:text-sm prose-th:text-slate-300 prose-td:text-slate-400
          prose-tr:border-slate-800">
          <ReactMarkdown>{section.content}</ReactMarkdown>
        </div>
      );

    case 'callout': {
      const styles = {
        info:    { border: 'border-blue-500/30',    bg: 'bg-blue-500/8',    text: 'text-blue-200',    label: 'text-blue-400',    dot: 'bg-blue-400' },
        warning: { border: 'border-amber-500/30',   bg: 'bg-amber-500/8',   text: 'text-amber-200',   label: 'text-amber-400',   dot: 'bg-amber-400' },
        tip:     { border: 'border-emerald-500/30', bg: 'bg-emerald-500/8', text: 'text-emerald-200', label: 'text-emerald-400', dot: 'bg-emerald-400' },
        danger:  { border: 'border-red-500/30',     bg: 'bg-red-500/8',     text: 'text-red-200',     label: 'text-red-400',     dot: 'bg-red-400' },
      }[section.variant];
      return (
        <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4`}>
          {section.title && (
            <div className="mb-1.5 flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
              <p className={`text-xs font-semibold uppercase tracking-wide ${styles.label}`}>{section.title}</p>
            </div>
          )}
          <p className={`text-sm leading-relaxed ${styles.text}`}>{section.content}</p>
        </div>
      );
    }

    case 'codeBlock':
      return <CodeBlock section={section} />;

    case 'flowDiagram':
      return <FlowDiagramSection section={section} />;

    case 'quiz':
      return <QuizSection section={section} onDone={onQuizDone} />;

    case 'interactive':
      return (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <p className="text-xs font-medium text-violet-400">Interactive component: <code className="text-violet-300">{section.component}</code></p>
          <p className="mt-1 text-xs text-slate-500">This component will be rendered when implemented.</p>
        </div>
      );

    default:
      return null;
  }
}

function CodeBlock({ section }: { section: Extract<LessonSection, { type: 'codeBlock' }> }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(section.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-700/60 px-2 py-0.5 text-xs font-mono text-slate-400">{section.language}</span>
          {section.caption && <span className="text-xs text-slate-500">{section.caption}</span>}
        </div>
        <button
          onClick={copy}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-all duration-150',
            copied
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-200">
        <code className="font-mono">{section.code}</code>
      </pre>
    </div>
  );
}
