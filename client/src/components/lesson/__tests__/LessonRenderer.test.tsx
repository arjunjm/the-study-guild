import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LessonRenderer from '../LessonRenderer';
import type { LessonContent } from '@study-guild/shared';

// Swap out heavy rendering deps that don't add test value
vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, language }: { children: string; language: string }) => (
    <pre data-testid="syntax-highlighter" data-language={language}>
      <code>{children}</code>
    </pre>
  ),
}));

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
}));

vi.mock('../FlowDiagramSection', () => ({
  default: () => <div data-testid="flow-diagram" />,
}));

vi.mock('../QuizSection', () => ({
  default: ({ onDone }: { onDone: (score: number) => void }) => (
    <div data-testid="quiz-section">
      <button onClick={() => onDone(100)}>Complete quiz</button>
    </div>
  ),
}));

const textContent: LessonContent = {
  schemaVersion: '1',
  sections: [
    { type: 'text', content: '## Hello World\n\nThis is **bold** text with `inline code`.' },
  ],
};

const calloutContent: LessonContent = {
  schemaVersion: '1',
  sections: [
    { type: 'callout', variant: 'info', title: 'Note', content: 'This is an info callout.' },
    { type: 'callout', variant: 'warning', content: 'No title warning.' },
    { type: 'callout', variant: 'tip', title: 'Pro Tip', content: 'Here is a tip.' },
    { type: 'callout', variant: 'danger', title: 'Danger', content: 'Watch out.' },
  ],
};

const codeContent: LessonContent = {
  schemaVersion: '1',
  sections: [
    { type: 'codeBlock', language: 'typescript', code: 'const x: number = 42;', caption: 'Example' },
  ],
};

const mixedContent: LessonContent = {
  schemaVersion: '1',
  sections: [
    { type: 'text', content: 'Intro text.' },
    { type: 'flowDiagram', title: 'Flow', nodes: [], edges: [] },
    {
      type: 'quiz',
      title: 'Check',
      passingScore: 60,
      questions: [{ id: 'q1', question: 'Q?', options: ['A', 'B'], correctIndex: 0 }],
    },
  ],
};

describe('LessonRenderer — text sections', () => {
  it('renders heading from markdown', () => {
    render(<LessonRenderer content={textContent} onComplete={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Hello World' })).toBeInTheDocument();
  });

  it('renders the mark-lesson-complete button', () => {
    render(<LessonRenderer content={textContent} onComplete={() => {}} />);
    expect(screen.getByText('Mark lesson complete')).toBeInTheDocument();
  });

  it('shows already-complete banner when alreadyComplete=true', () => {
    render(<LessonRenderer content={textContent} onComplete={() => {}} alreadyComplete />);
    expect(screen.getByText(/Lesson already complete/)).toBeInTheDocument();
    expect(screen.queryByText('Mark lesson complete')).not.toBeInTheDocument();
  });

  it('complete button is disabled while completing', () => {
    render(<LessonRenderer content={textContent} onComplete={() => {}} completing />);
    expect(screen.getByText('Saving…')).toBeDisabled();
  });
});

describe('LessonRenderer — callout sections', () => {
  it('renders callout title and content', () => {
    render(<LessonRenderer content={calloutContent} onComplete={() => {}} />);
    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(screen.getByText('This is an info callout.')).toBeInTheDocument();
  });

  it('renders callout without title', () => {
    render(<LessonRenderer content={calloutContent} onComplete={() => {}} />);
    expect(screen.getByText('No title warning.')).toBeInTheDocument();
  });

  it('renders all four callout variants', () => {
    render(<LessonRenderer content={calloutContent} onComplete={() => {}} />);
    expect(screen.getByText('Pro Tip')).toBeInTheDocument();
    expect(screen.getByText('Danger')).toBeInTheDocument();
  });
});

describe('LessonRenderer — code block sections', () => {
  it('renders syntax highlighter with correct language', () => {
    render(<LessonRenderer content={codeContent} onComplete={() => {}} />);
    const block = screen.getByTestId('syntax-highlighter');
    expect(block).toHaveAttribute('data-language', 'typescript');
    expect(block).toHaveTextContent('const x: number = 42;');
  });

  it('renders the caption', () => {
    render(<LessonRenderer content={codeContent} onComplete={() => {}} />);
    expect(screen.getByText('Example')).toBeInTheDocument();
  });

  it('copy button is present', () => {
    render(<LessonRenderer content={codeContent} onComplete={() => {}} />);
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });
});

describe('LessonRenderer — mixed content', () => {
  it('renders all section types in one pass', () => {
    render(<LessonRenderer content={mixedContent} onComplete={() => {}} />);
    expect(screen.getByText('Intro text.')).toBeInTheDocument();
    expect(screen.getByTestId('flow-diagram')).toBeInTheDocument();
    expect(screen.getByTestId('quiz-section')).toBeInTheDocument();
  });

  it('calls onComplete when button is clicked', () => {
    const onComplete = vi.fn();
    render(<LessonRenderer content={textContent} onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Mark lesson complete'));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('does not call onComplete while completing is true', () => {
    const onComplete = vi.fn();
    render(<LessonRenderer content={textContent} onComplete={onComplete} completing />);
    fireEvent.click(screen.getByText('Saving…'));
    expect(onComplete).not.toHaveBeenCalled();
  });
});
