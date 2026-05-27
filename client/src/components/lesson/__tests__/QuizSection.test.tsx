import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizSection from '../QuizSection';
import type { QuizSection as QuizSectionType } from '@study-guild/shared';

const makeSection = (overrides: Partial<QuizSectionType> = {}): QuizSectionType => ({
  type: 'quiz',
  title: 'Test Quiz',
  passingScore: 70,
  questions: [
    {
      id: 'q1',
      question: 'What does OAuth stand for?',
      options: ['Open Auth', 'Open Authorization', 'Object Auth', 'Optional Auth'],
      correctIndex: 1,
      explanation: 'OAuth stands for Open Authorization.',
    },
    {
      id: 'q2',
      question: 'Which grant type is for SPAs?',
      options: ['Client Credentials', 'Password', 'Authorization Code + PKCE', 'Implicit'],
      correctIndex: 2,
      explanation: 'Authorization Code with PKCE is recommended for public clients.',
    },
  ],
  ...overrides,
});

describe('QuizSection — rendering', () => {
  it('renders all questions and options', () => {
    render(<QuizSection section={makeSection()} onDone={() => {}} />);
    expect(screen.getByText('What does OAuth stand for?')).toBeInTheDocument();
    expect(screen.getByText('Which grant type is for SPAs?')).toBeInTheDocument();
    expect(screen.getByText('Open Authorization')).toBeInTheDocument();
    expect(screen.getByText('Authorization Code + PKCE')).toBeInTheDocument();
  });

  it('renders the quiz title', () => {
    render(<QuizSection section={makeSection()} onDone={() => {}} />);
    expect(screen.getByText('Test Quiz')).toBeInTheDocument();
  });

  it('submit button is disabled until all questions answered', () => {
    render(<QuizSection section={makeSection()} onDone={() => {}} />);
    expect(screen.getByText('Submit answers')).toBeDisabled();
  });
});

describe('QuizSection — interaction', () => {
  it('enables submit after answering all questions', () => {
    render(<QuizSection section={makeSection()} onDone={() => {}} />);
    fireEvent.click(screen.getByText('Open Authorization'));
    fireEvent.click(screen.getByText('Authorization Code + PKCE'));
    expect(screen.getByText('Submit answers')).not.toBeDisabled();
  });

  it('shows passing result and calls onDone with 100 on all correct', () => {
    const onDone = vi.fn();
    render(<QuizSection section={makeSection()} onDone={onDone} />);
    fireEvent.click(screen.getByText('Open Authorization'));
    fireEvent.click(screen.getByText('Authorization Code + PKCE'));
    fireEvent.click(screen.getByText('Submit answers'));
    expect(screen.getByText(/Passed!/)).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledWith(100);
  });

  it('shows failing result and retry button on wrong answers', () => {
    const onDone = vi.fn();
    render(<QuizSection section={makeSection()} onDone={onDone} />);
    fireEvent.click(screen.getByText('Open Auth')); // wrong
    fireEvent.click(screen.getByText('Implicit'));   // wrong
    fireEvent.click(screen.getByText('Submit answers'));
    expect(screen.getByText(/Score: 0%/)).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledWith(0);
  });

  it('shows explanations after submit', () => {
    render(<QuizSection section={makeSection()} onDone={() => {}} />);
    fireEvent.click(screen.getByText('Open Authorization'));
    fireEvent.click(screen.getByText('Authorization Code + PKCE'));
    fireEvent.click(screen.getByText('Submit answers'));
    expect(screen.getByText(/OAuth stands for Open Authorization\./)).toBeInTheDocument();
  });

  it('retry resets the quiz', () => {
    render(<QuizSection section={makeSection()} onDone={() => {}} />);
    fireEvent.click(screen.getByText('Open Auth'));
    fireEvent.click(screen.getByText('Implicit'));
    fireEvent.click(screen.getByText('Submit answers'));
    fireEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('Submit answers')).toBeDisabled();
    expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
  });

  it('does not show retry button when passing', () => {
    render(<QuizSection section={makeSection()} onDone={() => {}} />);
    fireEvent.click(screen.getByText('Open Authorization'));
    fireEvent.click(screen.getByText('Authorization Code + PKCE'));
    fireEvent.click(screen.getByText('Submit answers'));
    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
  });

  it('partial score: 1 of 2 correct (50%) fails a 70% passing quiz', () => {
    const onDone = vi.fn();
    render(<QuizSection section={makeSection({ passingScore: 70 })} onDone={onDone} />);
    fireEvent.click(screen.getByText('Open Authorization')); // correct
    fireEvent.click(screen.getByText('Implicit'));            // wrong
    fireEvent.click(screen.getByText('Submit answers'));
    expect(onDone).toHaveBeenCalledWith(50);
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('passingScore boundary: 50% passes a 50% threshold', () => {
    render(<QuizSection section={makeSection({ passingScore: 50 })} onDone={() => {}} />);
    fireEvent.click(screen.getByText('Open Authorization')); // correct
    fireEvent.click(screen.getByText('Implicit'));            // wrong
    fireEvent.click(screen.getByText('Submit answers'));
    expect(screen.getByText(/Passed!/)).toBeInTheDocument();
    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
  });
});
