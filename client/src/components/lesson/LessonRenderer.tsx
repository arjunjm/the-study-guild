import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CheckCircle, Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { LessonContent, LessonSection } from '@study-guild/shared';
import FlowDiagramSection from './FlowDiagramSection';
import QuizSection from './QuizSection';

// Match the oneDark background so the header blends in
const CODE_BG = '#282c34';

interface Props {
  content: LessonContent;
  onComplete: (quizScore?: number) => void;
  completing?: boolean;
  alreadyComplete?: boolean;
}

export default function LessonRenderer({ content, onComplete, completing = false, alreadyComplete = false }: Props) {
  const [quizScore, setQuizScore] = useState<number | undefined>(undefined);

  return (
    <div className="space-y-8">
      {content.sections.map((section, i) => (
        <div key={i} id={`lesson-section-${i}`}>
          <SectionRenderer section={section} onQuizDone={setQuizScore} />
        </div>
      ))}

      <div className="pt-4 border-t border-slate-200 space-y-3">
        {alreadyComplete ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Lesson already complete — use the navigation below to continue
          </div>
        ) : (
          <button
            onClick={() => !completing && onComplete(quizScore)}
            disabled={completing}
            className={cn(
              'group flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200',
              completing
                ? 'bg-violet-400 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-violet-200'
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
        <div className="prose prose-slate prose-sm max-w-none
          prose-headings:text-slate-900 prose-headings:font-semibold
          prose-p:text-slate-600 prose-p:leading-relaxed
          prose-strong:text-slate-800
          prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline
          prose-ul:text-slate-600 prose-ol:text-slate-600
          prose-blockquote:border-l-violet-300 prose-blockquote:text-slate-500">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children }) {
                const match = /language-(\w+)/.exec(className ?? '');
                if (match) {
                  return (
                    <SyntaxHighlighter
                      language={match[1]}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        borderRadius: '12px',
                        fontSize: '13px',
                        lineHeight: '1.65',
                        border: '1px solid rgba(100,116,139,0.25)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                      }}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  );
                }
                return (
                  <code className="text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-md text-xs border border-violet-100 before:content-none after:content-none">
                    {children}
                  </code>
                );
              },
              pre({ children }) {
                // SyntaxHighlighter already wraps in a div; just pass children through
                return <>{children}</>;
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 not-prose">
                    <table className="w-full border-collapse text-sm">{children}</table>
                  </div>
                );
              },
              thead({ children }) {
                return <thead className="bg-slate-50 border-b border-slate-200">{children}</thead>;
              },
              th({ children }) {
                return (
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {children}
                  </th>
                );
              },
              tr({ children }) {
                return <tr className="border-b border-slate-100 last:border-0">{children}</tr>;
              },
              td({ children }) {
                return <td className="px-4 py-2.5 text-sm text-slate-600">{children}</td>;
              },
            }}
          >
            {section.content}
          </ReactMarkdown>
        </div>
      );

    case 'callout': {
      const styles = {
        info:    { border: 'border-blue-200',    bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'text-blue-600',    dot: 'bg-blue-500' },
        warning: { border: 'border-amber-200',   bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'text-amber-600',   dot: 'bg-amber-500' },
        tip:     { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'text-emerald-600', dot: 'bg-emerald-500' },
        danger:  { border: 'border-red-200',     bg: 'bg-red-50',     text: 'text-red-700',     label: 'text-red-600',     dot: 'bg-red-500' },
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
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-xs font-medium text-violet-700">Interactive component: <code className="text-violet-800 bg-violet-100 px-1.5 py-0.5 rounded">{section.component}</code></p>
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
    <div className="overflow-hidden rounded-xl border border-slate-700/30 shadow-sm" style={{ background: CODE_BG }}>
      {/* Header bar */}
      <div
        className="flex items-center justify-between border-b border-slate-700/40 px-4 py-2.5"
        style={{ background: CODE_BG }}
      >
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-700/50 px-2 py-0.5 text-[11px] font-mono text-slate-400">
            {section.language}
          </span>
          {section.caption && (
            <span className="text-xs text-slate-500">{section.caption}</span>
          )}
        </div>
        <button
          onClick={copy}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-all duration-150',
            copied
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Highlighted code */}
      <SyntaxHighlighter
        language={section.language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '13px',
          lineHeight: '1.65',
          background: CODE_BG,
          padding: '1rem',
        }}
        PreTag="div"
        showLineNumbers={section.code.split('\n').length > 6}
        lineNumberStyle={{ color: '#4b5563', fontSize: '11px', minWidth: '2.5em' }}
      >
        {section.code}
      </SyntaxHighlighter>
    </div>
  );
}
