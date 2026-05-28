import type { Course, Lesson, LessonSection } from '@study-guild/shared';

const TARGET_LESSON_CHARS = 7600;
const OAUTH2_COURSE_ID = 'course-oauth2';

interface DomainGuidance {
  mentalModel: string;
  workflow: string[];
  pitfalls: string[];
  checklist: string[];
  codeLanguage: string;
  codeTitle: string;
  code: string;
}

const DEFAULT_GUIDANCE: DomainGuidance = {
  mentalModel: 'Treat the topic as a system with inputs, decisions, outputs, feedback loops, and failure modes.',
  workflow: ['Define the outcome', 'Map the moving parts', 'Build a small version', 'Test the risky assumptions', 'Iterate with evidence'],
  pitfalls: ['Skipping the problem statement', 'Copying patterns without understanding trade-offs', 'Measuring activity instead of outcomes'],
  checklist: ['Can you explain why this matters?', 'Can you build the smallest useful version?', 'Can you detect when it fails?'],
  codeLanguage: 'typescript',
  codeTitle: 'Decision checklist',
  code: `type Decision = {
  goal: string;
  tradeoffs: string[];
  failureModes: string[];
  validationPlan: string[];
};

const decision: Decision = {
  goal: 'State the learner or product outcome clearly',
  tradeoffs: ['cost', 'complexity', 'maintainability'],
  failureModes: ['wrong abstraction', 'missing feedback', 'poor observability'],
  validationPlan: ['write examples', 'test edge cases', 'review with a peer'],
};`,
};

const DOMAIN_GUIDANCE: Record<string, DomainGuidance> = {
  'AI & ML': {
    mentalModel: 'AI systems are probabilistic product systems. Quality depends on data, prompts, retrieval, evaluation, monitoring, and human feedback, not just on the model.',
    workflow: ['Define the task and success criteria', 'Create a small evaluation set', 'Choose data and retrieval strategy', 'Build a baseline', 'Measure failures before adding complexity'],
    pitfalls: ['Vibe-checking outputs instead of evaluating them', 'Ignoring latency and cost', 'Treating model output as ground truth', 'Skipping data quality work'],
    checklist: ['What does a correct answer look like?', 'How will hallucinations be detected?', 'What evidence or evaluation gates protect users?'],
    codeLanguage: 'python',
    codeTitle: 'Minimal evaluation loop',
    code: `examples = [
    {"input": "user question", "expected": "grounded answer"},
]

def evaluate(app, examples):
    results = []
    for case in examples:
        output = app(case["input"])
        results.append({
            "input": case["input"],
            "passed": case["expected"].lower() in output.lower(),
            "output": output,
        })
    return results`,
  },
  'Security': {
    mentalModel: 'Security is about controlling trust boundaries. Every token, request, role, key, and network hop should have an explicit owner and threat model.',
    workflow: ['Identify assets', 'Map actors and trust boundaries', 'Choose controls', 'Validate inputs and authorization', 'Log security-relevant events'],
    pitfalls: ['Confusing authentication with authorization', 'Trusting client-side checks', 'Leaking secrets into logs', 'Forgetting revocation and rotation'],
    checklist: ['Who can perform this action?', 'What happens if a token leaks?', 'How are failures logged and reviewed?'],
    codeLanguage: 'typescript',
    codeTitle: 'Authorize before action',
    code: `function requirePermission(userRoles: string[], required: string) {
  if (!userRoles.includes(required)) {
    throw new Error(\`Missing permission: \${required}\`);
  }
}

function updateResource(userRoles: string[]) {
  requirePermission(userRoles, 'resource:update');
  // Perform the state change only after authorization passes.
}`,
  },
  'Web Development': {
    mentalModel: 'Web systems are contracts between users, browsers, APIs, data stores, and deployment environments. Good design makes those contracts explicit.',
    workflow: ['Define the user flow', 'Model the API contract', 'Handle loading and error states', 'Validate at boundaries', 'Measure performance and accessibility'],
    pitfalls: ['Letting UI state and server state drift', 'Skipping empty/error states', 'Overfetching data', 'Mixing validation rules across layers'],
    checklist: ['What happens on slow networks?', 'Can the user recover from errors?', 'Is the API response shape stable?'],
    codeLanguage: 'typescript',
    codeTitle: 'Boundary validation pattern',
    code: `type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function loadResource<T>(url: string): Promise<ApiResult<T>> {
  const response = await fetch(url);
  if (!response.ok) return { ok: false, error: response.statusText };
  return { ok: true, data: await response.json() as T };
}`,
  },
  'Databases': {
    mentalModel: 'Databases optimize for access patterns. Schema, indexes, transactions, partition keys, and consistency choices should follow the questions the application asks.',
    workflow: ['List read and write paths', 'Model entities and relationships', 'Choose keys and indexes', 'Test with realistic volume', 'Inspect query plans'],
    pitfalls: ['Designing tables without queries', 'Adding indexes blindly', 'Ignoring transaction boundaries', 'Benchmarking with toy data'],
    checklist: ['Which query must be fastest?', 'What guarantees does this write need?', 'How will data grow over time?'],
    codeLanguage: 'sql',
    codeTitle: 'Inspect before optimizing',
    code: `EXPLAIN ANALYZE
SELECT user_id, COUNT(*) AS completed_lessons
FROM progress_events
WHERE created_at >= now() - interval '30 days'
GROUP BY user_id
ORDER BY completed_lessons DESC
LIMIT 10;`,
  },
  'Cloud': {
    mentalModel: 'Cloud engineering is about composing managed capabilities while keeping ownership of reliability, cost, security, and deployment flow.',
    workflow: ['Define runtime requirements', 'Pick managed services deliberately', 'Automate provisioning', 'Add observability', 'Practice rollback'],
    pitfalls: ['ClickOps without source control', 'Unbounded costs', 'Missing least-privilege IAM', 'No deployment rollback path'],
    checklist: ['Can this environment be recreated?', 'What fails when a region or dependency is down?', 'Who can deploy and approve changes?'],
    codeLanguage: 'yaml',
    codeTitle: 'Deployment gate sketch',
    code: `name: deploy
on:
  push:
    branches: [main]
jobs:
  build-test-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      - run: npm run build`,
  },
  'Systems': {
    mentalModel: 'Systems work is about resource constraints and feedback. CPU, memory, disk, network, queues, and processes all expose signals if you know where to look.',
    workflow: ['Reproduce the symptom', 'Measure before changing anything', 'Form a hypothesis', 'Run a narrow experiment', 'Document the result'],
    pitfalls: ['Optimizing without profiling', 'Ignoring tail latency', 'Changing many variables at once', 'Forgetting operational runbooks'],
    checklist: ['What metric proves the problem?', 'What changed recently?', 'How do we know the fix worked?'],
    codeLanguage: 'bash',
    codeTitle: 'Measure first',
    code: `# CPU, memory, disk, and network are different bottlenecks.
uptime
free -h
df -h
ss -tuna
top -o %CPU`,
  },
  'Mobile': {
    mentalModel: 'Mobile apps run in constrained, interrupt-driven environments. Great mobile engineering handles lifecycle, offline states, permissions, and platform conventions.',
    workflow: ['Design the user flow', 'Handle lifecycle transitions', 'Model local and remote state', 'Test on real devices', 'Measure startup and interaction latency'],
    pitfalls: ['Assuming stable connectivity', 'Ignoring permissions and background limits', 'Skipping accessibility', 'Testing only on simulators'],
    checklist: ['What happens offline?', 'What happens when the app is backgrounded?', 'How does the UI scale across devices?'],
    codeLanguage: 'typescript',
    codeTitle: 'Offline-first state sketch',
    code: `type SyncState = 'local-only' | 'syncing' | 'synced' | 'conflict';

function canEdit(state: SyncState) {
  return state === 'local-only' || state === 'synced' || state === 'conflict';
}`,
  },
  'Engineering': {
    mentalModel: 'Engineering quality comes from feedback loops: readable code, tests, reviews, observability, and small reversible changes.',
    workflow: ['Clarify the behavior', 'Write the smallest design', 'Add tests around risk', 'Refactor after behavior is safe', 'Review the diff as a future maintainer'],
    pitfalls: ['Optimizing for cleverness', 'Testing implementation details', 'Letting abstractions hide business rules', 'Shipping changes that cannot be rolled back'],
    checklist: ['Can a teammate explain this quickly?', 'What breaks if the requirement changes?', 'Is there a test for the risky part?'],
    codeLanguage: 'typescript',
    codeTitle: 'Make the rule explicit',
    code: `function canPublishCourse(args: { lessonCount: number; hasTitle: boolean }) {
  return args.hasTitle && args.lessonCount > 0;
}

// A named rule is easier to test and discuss than a hidden inline condition.`,
  },
};

export function applyLessonDepthEnhancements(courses: Course[], lessons: Lesson[]) {
  const courseById = new Map(courses.map(course => [course.id, course]));

  for (const lesson of lessons) {
    const course = courseById.get(lesson.courseId);
    if (!course || course.id === OAUTH2_COURSE_ID) continue;
    if (lessonDepth(lesson) >= TARGET_LESSON_CHARS) continue;

    const guidance = DOMAIN_GUIDANCE[course.taxonomy.l1] ?? DEFAULT_GUIDANCE;
    const additions = buildEnhancements(course, lesson, guidance, lessonDepth(lesson));
    lesson.content = {
      ...lesson.content,
      sections: [...lesson.content.sections, ...additions],
    };
  }
}

function buildEnhancements(course: Course, lesson: Lesson, guidance: DomainGuidance, originalDepth: number): LessonSection[] {
  const sections: LessonSection[] = [
    {
      type: 'text',
      content: [
        `## Deep dive: ${lesson.title}`,
        guidance.mentalModel,
        `For **${course.title}**, this lesson matters because it connects the abstract concept to a concrete decision a practitioner has to make. Do not stop at definitions. Ask what input the system receives, what decision is made, what output is produced, and how a team can tell whether the result is correct.`,
        'A useful way to study this material is to move through four layers: vocabulary, architecture, trade-offs, and operational signals. Vocabulary helps you talk about the idea. Architecture shows where it sits in a system. Trade-offs explain why reasonable teams choose different approaches. Operational signals tell you whether the approach is working after it ships.',
        `When reviewing this lesson, write down one example from your own work or a product you use. Then identify which part of the example maps to **${lesson.title}**, what could fail, and which metric or user behavior would reveal the failure.`,
      ].join('\n\n'),
    },
    {
      type: 'text',
      content: [
        '## Practical workflow',
        `Use this workflow when applying **${lesson.title}** in a real project:`,
        ...guidance.workflow.map((step, index) => `${index + 1}. **${step}.** Explain what evidence you need before moving to the next step.`),
        '',
        'The important habit is sequencing. Beginners often jump straight to tools or syntax. Senior engineers first define the outcome, constraints, and failure modes, then choose tools that make those constraints easier to manage.',
      ].join('\n'),
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Common failure modes',
      content: guidance.pitfalls.map(pitfall => `- ${pitfall}`).join('\n'),
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Review checklist',
      content: guidance.checklist.map(item => `- ${item}`).join('\n'),
    },
    {
      type: 'codeBlock',
      language: guidance.codeLanguage,
      caption: guidance.codeTitle,
      code: guidance.code,
    },
    {
      type: 'quiz',
      title: 'Deep understanding check',
      passingScore: 70,
      questions: [
        {
          id: `${lesson.id}-depth-1`,
          question: `What is the best way to apply "${lesson.title}" beyond memorizing definitions?`,
          options: [
            'Map the concept to a real system, identify trade-offs, and define how success or failure will be measured',
            'Skip the problem statement and immediately pick the most popular tool',
            'Assume the first implementation is correct if it works once',
            'Avoid writing down failure modes because they slow down delivery',
          ],
          correctIndex: 0,
          explanation: 'Deep learning means connecting the concept to real constraints, trade-offs, and validation signals.',
        },
        {
          id: `${lesson.id}-depth-2`,
          question: `Which question should you ask before using a pattern from "${course.title}" in production?`,
          options: [
            'Does this pattern look impressive in a demo?',
            'Which failure mode does this pattern reduce, and what new trade-off does it introduce?',
            'Can we avoid testing it because the pattern is common?',
            'Will this let us skip monitoring?',
          ],
          correctIndex: 1,
          explanation: 'Every useful pattern reduces some risks while introducing others. Naming that trade-off is the key production skill.',
        },
      ],
    },
  ];

  if (originalDepth < 4500) {
    sections.push(...buildFoundationalExpansion(course, lesson));
  }

  return sections;
}

function buildFoundationalExpansion(course: Course, lesson: Lesson): LessonSection[] {
  return [
    {
      type: 'text',
      content: [
        `## Worked example: applying ${lesson.title}`,
        `Imagine a team is adding **${course.title}** to a real product. The first discussion should not be about tools. It should be about the user problem, the data available, the risk of being wrong, and the operational constraints the team must live with.`,
        'A strong implementation plan starts with a small, observable slice. Define one user question or workflow, write down the expected behavior, and build the narrowest version that can prove whether the approach works. Then collect examples where it fails and turn those failures into tests or review criteria.',
        `For this lesson, a good worked example should include three artifacts: a diagram of the flow, a decision table listing trade-offs, and a validation checklist. If you cannot produce those artifacts, you probably do not understand **${lesson.title}** well enough to ship it safely.`,
        'When learners review this example, ask them to identify which assumptions are technical, which assumptions are product assumptions, and which assumptions need human review before release.',
      ].join('\n\n'),
    },
    {
      type: 'callout',
      variant: 'info',
      title: 'Production lens',
      content: [
        'Before shipping, answer these questions:',
        '- What data or input does this depend on?',
        '- How do we know the output is correct enough?',
        '- What does a safe fallback look like?',
        '- What should be logged for debugging and audit?',
        '- Which part needs a human decision instead of automation?',
      ].join('\n'),
    },
    {
      type: 'quiz',
      title: 'Applied scenario check',
      passingScore: 70,
      questions: [
        {
          id: `${lesson.id}-scenario-1`,
          question: `A team wants to ship "${lesson.title}" quickly. What should they do before choosing tools?`,
          options: [
            'Define the user problem, success criteria, data assumptions, and failure modes',
            'Pick the most popular framework and skip evaluation',
            'Assume a demo proves the production system is safe',
            'Wait until launch to decide what to monitor',
          ],
          correctIndex: 0,
          explanation: 'Tool choice is easier and safer after the team understands the problem, constraints, and how success will be measured.',
        },
      ],
    },
    {
      type: 'text',
      content: [
        '## Instructor facilitation guide',
        `To teach **${lesson.title}** well, begin with a concrete scenario and ask learners to predict what will go wrong before showing the recommended approach. This makes the trade-offs memorable instead of abstract.`,
        'A good live exercise is to split learners into three roles: builder, reviewer, and operator. The builder proposes the design. The reviewer challenges assumptions and security boundaries. The operator asks how the team will observe, debug, and roll back the system after launch.',
        `End the session with a short design review: what would you build first, what would you deliberately postpone, and which signal would convince you that **${course.title}** is working for real users?`,
      ].join('\n\n'),
    },
  ];
}

function lessonDepth(lesson: Lesson) {
  return lesson.content.sections.reduce((sum, section) => sum + JSON.stringify(section).length, 0);
}
