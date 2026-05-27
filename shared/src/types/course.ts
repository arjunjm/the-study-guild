export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface CourseTaxonomy {
  l1: string; // e.g. "Security"
  l2: string; // e.g. "Authentication"
}

// ---------------------------------------------------------------------------
// Lesson content schema (versioned — v1)
// ---------------------------------------------------------------------------

export type LessonSectionType =
  | 'text'
  | 'flowDiagram'
  | 'quiz'
  | 'codeBlock'
  | 'callout'
  | 'interactive';

export interface TextSection {
  type: 'text';
  content: string; // Markdown
}

export interface CalloutSection {
  type: 'callout';
  variant: 'info' | 'warning' | 'tip' | 'danger';
  title?: string;
  content: string;
}

export interface CodeBlockSection {
  type: 'codeBlock';
  language: string;
  code: string;
  caption?: string;
}

export interface FlowDiagramNode {
  id: string;
  label?: string;
  type?: string;
  position: { x: number; y: number };
  data?: Record<string, unknown>;
  style?: Record<string, unknown>;
}

export interface FlowDiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, unknown>;
}

export interface FlowDiagramSection {
  type: 'flowDiagram';
  title?: string;
  nodes: FlowDiagramNode[];
  edges: FlowDiagramEdge[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface QuizSection {
  type: 'quiz';
  title?: string;
  questions: QuizQuestion[];
  passingScore: number; // 0-100
}

export interface InteractiveSection {
  type: 'interactive';
  component: string; // e.g. "oauth-flow-simulator"
  props?: Record<string, unknown>;
}

export type LessonSection =
  | TextSection
  | CalloutSection
  | CodeBlockSection
  | FlowDiagramSection
  | QuizSection
  | InteractiveSection;

export interface LessonContent {
  schemaVersion: '1';
  sections: LessonSection[];
}

// ---------------------------------------------------------------------------
// Lesson & Course documents
// ---------------------------------------------------------------------------

export interface Lesson {
  id: string;
  courseId: string;
  order: number;
  title: string;
  estimatedMinutes: number;
  content: LessonContent;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  taxonomy: CourseTaxonomy;
  difficulty: DifficultyLevel;
  authorId: string;
  authorName: string;
  published: boolean;
  publishedAt?: string;
  thumbnailUrl?: string;
  tags: string[];
  lessonIds: string[];
  totalLessons: number;
  estimatedMinutes: number;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Progress & ratings
// ---------------------------------------------------------------------------

export interface UserCourseProgress {
  id: string; // userId#courseId
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  lastAccessedAt: string;
  completedAt?: string;
  quizScores: Record<string, number>; // lessonId -> score (0-100)
}

export interface CourseRating {
  id: string; // userId#courseId
  userId: string;
  courseId: string;
  rating: number; // 1-5
  review?: string;
  createdAt: string;
}
