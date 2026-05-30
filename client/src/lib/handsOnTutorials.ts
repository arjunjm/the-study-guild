import type { Course, DifficultyLevel, Lesson, LessonSection } from '@study-guild/shared';

interface TutorialBlueprint {
  labTitle: string;
  scenario: string;
  toolbox: string[];
  deliverable: string;
  funTwist: string;
  missions: string[];
  language: string;
  starterCode: string;
}

const DEFAULT_TUTORIAL: TutorialBlueprint = {
  labTitle: 'Build a tiny proof-of-skill',
  scenario: 'You are turning the lesson into a small artifact that proves you can apply the idea, not just define it.',
  toolbox: ['notes', 'a timer', 'a scratch file', 'one realistic example'],
  deliverable: 'A one-page field note with the decision, trade-offs, failure modes, and a next step.',
  funTwist: 'Run it like a guild quest: give yourself 20 minutes, name the artifact, and write one boss-fight question at the end.',
  missions: ['Map the concept', 'Build the smallest useful example', 'Break it on purpose', 'Explain the trade-off'],
  language: 'markdown',
  starterCode: `# Mini proof-of-skill

Goal:
Assumption:
Small experiment:
What broke:
What I would improve next:`,
};

const DOMAIN_TUTORIALS: Record<string, TutorialBlueprint> = {
  'AI & ML': {
    labTitle: 'Run an AI product lab',
    scenario: 'You are the AI engineer for a product team that needs a useful baseline, an evaluation set, and a clear failure report before shipping.',
    toolbox: ['notebook', 'sample inputs', 'expected outputs', 'failure log', 'simple metric'],
    deliverable: 'A baseline experiment card with inputs, expected behavior, observed failures, and one improvement idea.',
    funTwist: 'Treat each bad output like a monster card: name it, classify it, and decide which guardrail defeats it.',
    missions: ['Collect examples', 'Build a baseline', 'Score the output', 'Patch the weakest failure'],
    language: 'python',
    starterCode: `examples = [
    {"input": "example question", "expected": "grounded answer"},
]

def score(output: str, expected: str) -> bool:
    return expected.lower() in output.lower()`,
  },
  Security: {
    labTitle: 'Run an attack-and-defend drill',
    scenario: 'You are defending a small app. First make the risky path visible, then add the smallest control that reduces real abuse.',
    toolbox: ['threat model', 'sample token/request', 'abuse case', 'audit log'],
    deliverable: 'A before/after security note with one exploit, one defense, and one test that proves the defense works.',
    funTwist: 'Play red team vs blue team: write the attacker move first, then answer with the defender move.',
    missions: ['Draw the trust boundary', 'Forge or misuse an input', 'Add a control', 'Write the abuse-case test'],
    language: 'typescript',
    starterCode: `type RequestContext = {
  userId?: string;
  roles: string[];
  action: string;
};

function canAccess(ctx: RequestContext) {
  return ctx.roles.includes('admin');
}`,
  },
  'Web Development': {
    labTitle: 'Ship a tiny user-facing slice',
    scenario: 'You are building a small web feature with loading, success, empty, and error states so the behavior is visible before it is polished.',
    toolbox: ['browser devtools', 'fake data', 'network throttling', 'component boundary'],
    deliverable: 'A small component or API contract with at least one deliberate error state.',
    funTwist: 'Give the feature a chaos button that simulates slowness, empty data, or a failed request.',
    missions: ['Sketch the user flow', 'Build the happy path', 'Simulate failure', 'Tighten the contract'],
    language: 'typescript',
    starterCode: `type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };`,
  },
  Cloud: {
    labTitle: 'Deploy a pocket-sized cloud system',
    scenario: 'You are turning a local idea into an automated cloud deployment with repeatable config, least privilege, and a rollback story.',
    toolbox: ['resource diagram', 'IaC sketch', 'pipeline step', 'health check'],
    deliverable: 'A deploy plan with resources, secrets, health checks, rollback, and cost-risk notes.',
    funTwist: 'Pretend the app is launching for a guild raid: every missing health check costs the party one potion.',
    missions: ['Draw the architecture', 'Automate one step', 'Add a health check', 'Practice rollback'],
    language: 'yaml',
    starterCode: `checks:
  build: npm run build
  test: npm test
  health: GET /health
rollback:
  strategy: redeploy-last-known-good`,
  },
  Databases: {
    labTitle: 'Become the query detective',
    scenario: 'You are investigating why a feature is slow or awkward. The clues are queries, indexes, document shape, and access patterns.',
    toolbox: ['sample rows/documents', 'query plan', 'index list', 'slow query'],
    deliverable: 'A query detective report with the access pattern, data shape, index choice, and one trade-off.',
    funTwist: 'Score your database design like a mystery: motive is the user query, suspect is the bottleneck, clue is the plan.',
    missions: ['Name the access pattern', 'Run the query', 'Inspect the plan', 'Change one index or shape'],
    language: 'sql',
    starterCode: `-- Explain the query before changing it.
EXPLAIN ANALYZE
SELECT *
FROM items
WHERE owner_id = 'guild-member'
ORDER BY created_at DESC
LIMIT 20;`,
  },
  Systems: {
    labTitle: 'Run a production incident simulator',
    scenario: 'You are on call. A service is slow, and your job is to gather signals, form a hypothesis, test it, and write the incident note.',
    toolbox: ['terminal', 'metrics', 'logs', 'one hypothesis', 'runbook notes'],
    deliverable: 'A mini incident report with symptom, evidence, suspected cause, experiment, and follow-up action.',
    funTwist: 'Use a five-minute incident timer. You only win if the evidence, not your hunch, identifies the culprit.',
    missions: ['Observe the symptom', 'Collect one signal per layer', 'Run a narrow experiment', 'Write the runbook patch'],
    language: 'bash',
    starterCode: `date
uptime
free -h
df -h
ss -tuna
top -b -n 1 | head`,
  },
  Mobile: {
    labTitle: 'Build a device-realistic mini app',
    scenario: 'You are designing a mobile flow that must survive small screens, interruptions, offline mode, and platform conventions.',
    toolbox: ['phone or simulator', 'offline toggle', 'accessibility settings', 'screen recording'],
    deliverable: 'A mobile checklist with lifecycle behavior, offline behavior, accessibility notes, and one performance observation.',
    funTwist: 'Run the app gauntlet: rotate, background, go offline, increase font size, and see what survives.',
    missions: ['Build the screen', 'Interrupt it', 'Test accessibility', 'Record one performance note'],
    language: 'typescript',
    starterCode: `type MobileScenario = {
  offline: boolean;
  fontScale: 'normal' | 'large';
  appState: 'active' | 'background';
};`,
  },
  Engineering: {
    labTitle: 'Run a code dojo',
    scenario: 'You are improving a small piece of code through tests, refactoring, naming, and review notes.',
    toolbox: ['tiny function', 'test runner', 'diff view', 'review checklist'],
    deliverable: 'A before/after diff with a test, one refactor, and a review note explaining why the change is safer.',
    funTwist: 'Treat each failing test as a training dummy. Defeat it with the smallest clear change, then refactor.',
    missions: ['Pin behavior with a test', 'Make the small change', 'Refactor names or shape', 'Review your own diff'],
    language: 'typescript',
    starterCode: `function rule(input: string) {
  return input.trim().toLowerCase();
}

// Add one test before changing the rule.`,
  },
};

const COURSE_TUTORIALS: Record<string, Partial<TutorialBlueprint>> = {
  'course-oauth2': {
    labTitle: 'OAuth playground heist',
    scenario: 'Use an OAuth playground mindset to trace authorization code + PKCE from login request to token exchange.',
    deliverable: 'A hand-drawn OAuth sequence with every redirect, code, verifier, token, and validation point labeled.',
    missions: ['Trace the redirect', 'Identify where PKCE protects the code', 'Mark which party sees each secret', 'Write one misuse case'],
  },
  'course-jwt': {
    labTitle: 'JWT detective lab',
    scenario: 'Decode a token, inspect claims, challenge its trust assumptions, and decide what the API must verify.',
    deliverable: 'A token inspection sheet with header, claims, signature algorithm, expiry, audience, and issuer checks.',
    missions: ['Decode the token', 'Find risky claims', 'Write validation rules', 'Design a rotation test'],
  },
  'course-https': {
    labTitle: 'TLS handshake field trip',
    scenario: 'Inspect an HTTPS connection like a browser: certificate chain, protocol version, cipher suite, and trust decisions.',
    deliverable: 'A TLS report card for one real site, including what the browser trusts and what would break trust.',
    missions: ['Inspect a certificate', 'Find the chain', 'Check HSTS', 'Explain one failed-handshake scenario'],
  },
  'course-react-hooks': {
    labTitle: 'Hook arcade',
    scenario: 'Build a small component, then deliberately create stale state, excessive renders, and an effect-loop boss fight.',
    deliverable: 'A custom hook with a render-count note and one avoided dependency bug.',
    missions: ['Build state', 'Add an effect', 'Extract a custom hook', 'Profile a render'],
  },
  'course-prompts': {
    labTitle: 'Prompt tournament',
    scenario: 'Run three prompt variants against the same task and score them for accuracy, format, safety, and usefulness.',
    deliverable: 'A prompt scoreboard with winning prompt, losing failure mode, and one improved instruction.',
    missions: ['Write a baseline prompt', 'Add examples', 'Constrain output', 'Score the responses'],
  },
  'course-azure': {
    labTitle: 'Azure launch checklist',
    scenario: 'Plan a tiny Azure app using App Service, Static Web Apps, Cosmos DB, identity, and health checks.',
    deliverable: 'A resource map with app settings, secrets, deployment path, and smoke tests.',
    missions: ['Map resources', 'Separate secrets from config', 'Add health checks', 'Plan rollback'],
  },
  'course-sql': {
    labTitle: 'Guild tavern query game',
    scenario: 'Model guild members, quests, and rewards, then answer questions with SELECT, JOIN, GROUP BY, and indexes.',
    deliverable: 'A mini schema plus three queries that answer product questions.',
    missions: ['Create tables', 'Join quests to members', 'Aggregate rewards', 'Add one helpful index'],
  },
  'course-sql-advanced': {
    labTitle: 'Analytics boss fight',
    scenario: 'Use CTEs and window functions to build a leaderboard with rank changes and running totals.',
    deliverable: 'A leaderboard query with a readable CTE pipeline and a query-plan note.',
    missions: ['Build a CTE', 'Add a window function', 'Compare ranks', 'Explain the plan'],
  },
  'course-rest-api': {
    labTitle: 'API contract forge',
    scenario: 'Design a quest API with resources, validation, errors, idempotency, and versioning.',
    deliverable: 'A route table with request/response examples and failure cases.',
    missions: ['Name resources', 'Pick status codes', 'Validate inputs', 'Document errors'],
  },
  'course-testing': {
    labTitle: 'Bug museum',
    scenario: 'Collect tiny bugs, write tests that reproduce them, then fix each one with the smallest change.',
    deliverable: 'A test file with one happy path, one edge case, and one regression test.',
    missions: ['Write the test name', 'Make it fail', 'Fix the behavior', 'Refactor the setup'],
  },
  'course-typescript': {
    labTitle: 'Type safety treasure hunt',
    scenario: 'Convert a loose JavaScript object flow into typed data with narrowing and safer return shapes.',
    deliverable: 'A typed function that removes one runtime assumption.',
    missions: ['Define the type', 'Narrow unknown input', 'Model success/error', 'Remove one unsafe cast'],
  },
  'course-graphql': {
    labTitle: 'GraphQL query bazaar',
    scenario: 'Design a schema for a course marketplace, then query exactly the fields the UI needs.',
    deliverable: 'A schema snippet, one query, one mutation, and one N+1 mitigation note.',
    missions: ['Model types', 'Write a query', 'Add a resolver', 'Spot N+1'],
  },
  'course-architecture': {
    labTitle: 'Architecture courtroom',
    scenario: 'Put an architecture pattern on trial: defend it, prosecute it, and decide when it fits.',
    deliverable: 'An ADR comparing two patterns against quality attributes.',
    missions: ['Name quality attributes', 'Draw context', 'Compare options', 'Write an ADR'],
  },
  'course-kubernetes': {
    labTitle: 'Cluster quest board',
    scenario: 'Deploy a tiny service into Kubernetes and trace traffic from Deployment to Service to Ingress.',
    deliverable: 'A manifest bundle plus a debug checklist for failed pods and broken routing.',
    missions: ['Create a pod/deployment', 'Expose it', 'Inspect logs/events', 'Practice rollback'],
  },
  'course-data-modeling': {
    labTitle: 'Entity relationship map room',
    scenario: 'Turn messy product requirements into entities, relationships, constraints, and access patterns.',
    deliverable: 'An ERD or document model with one normalized and one denormalized trade-off.',
    missions: ['Extract nouns', 'Choose cardinality', 'Add constraints', 'Test an access pattern'],
  },
  'course-linux': {
    labTitle: 'Shell scavenger hunt',
    scenario: 'Use Linux commands to find files, inspect processes, transform text, and automate a repeatable task.',
    deliverable: 'A shell script that turns raw logs into a useful summary.',
    missions: ['Navigate and inspect', 'Pipe text', 'Write a script', 'Handle an error'],
  },
  'course-ml': {
    labTitle: 'Model zoo experiment',
    scenario: 'Train a simple baseline, track metrics, overfit it on purpose, and explain what changed.',
    deliverable: 'A model card with data, metric, baseline, overfit symptom, and next experiment.',
    missions: ['Split data', 'Train baseline', 'Measure error', 'Diagnose overfit'],
  },
  'course-rag': {
    labTitle: 'RAG treasure map',
    scenario: 'Build a tiny retrieval set, ask questions, inspect retrieved chunks, and score faithfulness.',
    deliverable: 'A RAG eval sheet with query, retrieved sources, answer, citation, and faithfulness score.',
    missions: ['Chunk documents', 'Retrieve context', 'Answer with citations', 'Score hallucination risk'],
  },
  'course-ai-agents': {
    labTitle: 'Tiny agent workshop',
    scenario: 'Design a tool-using agent that can plan, call one safe tool, observe output, and stop.',
    deliverable: 'An agent loop trace showing goal, tool call, observation, decision, and guardrail.',
    missions: ['Define a tool schema', 'Run one tool call', 'Handle a bad result', 'Add a stop rule'],
  },
  'course-llm-evals': {
    labTitle: 'Eval arena',
    scenario: 'Build a small eval set, run two model/prompt variants, and compare correctness, faithfulness, and refusal quality.',
    deliverable: 'An eval table with cases, expected behavior, scores, and a release recommendation.',
    missions: ['Write eval cases', 'Run baseline', 'Score failures', 'Add guardrail criteria'],
  },
  'course-mlops-ai': {
    labTitle: 'ML delivery pipeline',
    scenario: 'Track an experiment, package an artifact, define deployment checks, and monitor drift.',
    deliverable: 'A mini MLOps runbook with experiment metadata, release gate, and rollback trigger.',
    missions: ['Log an experiment', 'Version an artifact', 'Gate deployment', 'Monitor drift'],
  },
  'course-backend': {
    labTitle: 'Backend dungeon crawl',
    scenario: 'Build a tiny service route by route, then add validation, errors, persistence, and logs.',
    deliverable: 'A service slice with one route, one schema, one error response, and one log line.',
    missions: ['Create a route', 'Validate input', 'Persist state', 'Log a request'],
  },
  'course-code-quality': {
    labTitle: 'Refactor dojo',
    scenario: 'Take a smelly function, pin behavior with tests, then refactor names, boundaries, and dependencies.',
    deliverable: 'A before/after diff with a short code review note.',
    missions: ['Find a smell', 'Write a characterization test', 'Extract a rule', 'Review the diff'],
  },
  'course-crypto': {
    labTitle: 'Crypto lockbox',
    scenario: 'Use hashes, encryption, and signatures for the right jobs, then explain what each does not protect.',
    deliverable: 'A lockbox note comparing hashing, signing, encryption, keys, and rotation.',
    missions: ['Hash data', 'Sign a message', 'Encrypt a secret', 'Plan key rotation'],
  },
  'course-react-native': {
    labTitle: 'Pocket quest app',
    scenario: 'Build one React Native screen, then test it through offline mode, navigation, gestures, and accessibility.',
    deliverable: 'A mobile screen checklist with state, navigation, offline behavior, and a11y notes.',
    missions: ['Build the screen', 'Fetch data', 'Handle offline', 'Test accessibility'],
  },
  'course-cicd': {
    labTitle: 'Pipeline pinball',
    scenario: 'Create a pipeline that bounces code through lint, test, build, artifact, deploy, and rollback gates.',
    deliverable: 'A CI/CD workflow with one quality gate and one failure notification.',
    missions: ['Run tests', 'Cache dependencies', 'Publish artifact', 'Add deploy gate'],
  },
  'course-nosql': {
    labTitle: 'Document design studio',
    scenario: 'Model a feature twice: once embedded, once referenced, then choose based on read/write patterns.',
    deliverable: 'A document schema with access pattern notes and one index.',
    missions: ['Model documents', 'Run a query', 'Add an index', 'Compare embed vs reference'],
  },
  'course-design-patterns': {
    labTitle: 'Pattern card battle',
    scenario: 'Pick a design pattern, play it against a real problem, then identify when it becomes overengineering.',
    deliverable: 'A pattern card with intent, collaborators, code sketch, and misuse warning.',
    missions: ['Name the intent', 'Sketch classes/functions', 'Implement tiny example', 'Write misuse warning'],
  },
  'course-python': {
    labTitle: 'Python quest script',
    scenario: 'Write a small Python script that reads data, transforms it, handles errors, and prints a useful result.',
    deliverable: 'A script with functions, tests or assertions, and a CLI-friendly output.',
    missions: ['Parse input', 'Transform data', 'Handle edge case', 'Package a function'],
  },
  'course-git': {
    labTitle: 'Time-travel repo',
    scenario: 'Create a toy repo, make messy commits, branch, rebase safely, resolve conflict, and inspect history.',
    deliverable: 'A Git history diagram plus commands used to recover from one mistake.',
    missions: ['Create commits', 'Branch and merge', 'Resolve conflict', 'Recover with reflog'],
  },
  'course-aws': {
    labTitle: 'AWS mini launch',
    scenario: 'Plan a small AWS app using IAM, S3 or Lambda, logging, and least-privilege access.',
    deliverable: 'An AWS resource map with IAM boundary, cost note, and health check.',
    missions: ['Choose services', 'Design IAM', 'Add logging', 'Estimate cost'],
  },
  'course-data-science': {
    labTitle: 'Notebook investigation',
    scenario: 'Turn a messy dataset into a story with cleaning, visualization, hypothesis, and conclusion.',
    deliverable: 'A notebook narrative with one chart, one cleaned column, and one caveat.',
    missions: ['Load data', 'Clean one issue', 'Plot a signal', 'Write insight and caveat'],
  },
  'course-flutter': {
    labTitle: 'Widget workshop',
    scenario: 'Build a Flutter screen, wire state, test responsiveness, and polish one animation or transition.',
    deliverable: 'A widget tree sketch plus a working mini screen.',
    missions: ['Compose widgets', 'Add state', 'Handle loading', 'Polish interaction'],
  },
  'course-networking': {
    labTitle: 'Packet detective',
    scenario: 'Trace a request from browser to server through DNS, TCP, TLS, HTTP, and response handling.',
    deliverable: 'A packet journey map with each layer and one failure mode.',
    missions: ['Resolve DNS', 'Trace connection', 'Inspect headers', 'Explain latency'],
  },
  'course-authz': {
    labTitle: 'Permission maze',
    scenario: 'Design RBAC/ABAC rules for a guild app, then test allowed and denied paths.',
    deliverable: 'A policy table with users, resources, actions, decisions, and audit events.',
    missions: ['List actions', 'Define roles/attributes', 'Test denies', 'Log decision reason'],
  },
  'course-db-perf': {
    labTitle: 'Slow query rescue',
    scenario: 'Start with a slow query, inspect the plan, add or change an index, and measure improvement.',
    deliverable: 'A before/after query plan note with one chosen index and one rejected index.',
    missions: ['Capture baseline', 'Read the plan', 'Change index', 'Measure again'],
  },
  'course-ios': {
    labTitle: 'SwiftUI field kit',
    scenario: 'Build a SwiftUI view, bind state, preview layouts, and test a lifecycle or accessibility scenario.',
    deliverable: 'A SwiftUI mini-screen with state and a preview checklist.',
    missions: ['Build view', 'Bind state', 'Preview variants', 'Check accessibility'],
  },
  'course-android': {
    labTitle: 'Compose mission board',
    scenario: 'Build a Jetpack Compose screen with state, navigation, loading, and accessibility labels.',
    deliverable: 'A Compose mini-screen plus a state diagram.',
    missions: ['Compose UI', 'Model state', 'Add navigation', 'Test content descriptions'],
  },
  'course-cv': {
    labTitle: 'Computer vision lab bench',
    scenario: 'Load an image, transform it, run a simple detector/classifier, and inspect false positives.',
    deliverable: 'A vision notebook with input, preprocessing, output, and error analysis.',
    missions: ['Load images', 'Preprocess', 'Run baseline', 'Inspect mistakes'],
  },
  'course-redis': {
    labTitle: 'Cache carnival',
    scenario: 'Add a cache to a slow path, choose keys and TTLs, then simulate stale data and eviction.',
    deliverable: 'A caching plan with key format, TTL, invalidation, and failure fallback.',
    missions: ['Choose key', 'Set TTL', 'Measure hit rate', 'Test stale data'],
  },
  'course-docker': {
    labTitle: 'Container kitchen',
    scenario: 'Package a tiny app, shrink the image, pass config safely, and debug why it fails to start.',
    deliverable: 'A Dockerfile plus a runbook for build, run, logs, and cleanup.',
    missions: ['Write Dockerfile', 'Build image', 'Run with env', 'Debug logs'],
  },
  'course-sys-perf': {
    labTitle: 'Flame graph hunt',
    scenario: 'Create a performance symptom, measure it with the right tool, and identify the hottest path.',
    deliverable: 'A performance note with symptom, tool, bottleneck, and validated improvement.',
    missions: ['Generate load', 'Measure CPU/memory/IO', 'Find hotspot', 'Validate fix'],
  },
  'course-react-perf': {
    labTitle: 'Render speedrun',
    scenario: 'Make a React screen slow, profile it, then fix unnecessary renders or expensive work.',
    deliverable: 'A profiler note showing before/after render behavior.',
    missions: ['Create slow list', 'Profile renders', 'Memoize carefully', 'Verify improvement'],
  },
  'course-grpc': {
    labTitle: 'Proto courier route',
    scenario: 'Define a proto contract, generate a service/client, and compare unary vs streaming behavior.',
    deliverable: 'A proto file plus a client trace of one request and one error.',
    missions: ['Write proto', 'Generate client', 'Call service', 'Handle status code'],
  },
  'course-observability': {
    labTitle: 'Three pillars incident room',
    scenario: 'Instrument a tiny service with one metric, one structured log, and one trace/span.',
    deliverable: 'An observability dashboard sketch with SLO, alert, log field, and trace question.',
    missions: ['Define SLO', 'Add metric', 'Add log context', 'Trace a request'],
  },
  'course-websockets': {
    labTitle: 'Real-time tavern chat',
    scenario: 'Build a tiny real-time message flow, then handle reconnects, heartbeats, and duplicate messages.',
    deliverable: 'A WebSocket protocol note with message types, reconnect policy, and backpressure plan.',
    missions: ['Connect socket', 'Send message', 'Simulate disconnect', 'Add heartbeat'],
  },
};

export function applyHandsOnTutorials(courses: Course[], lessons: Lesson[]) {
  const courseById = new Map(courses.map(course => [course.id, course]));

  for (const lesson of lessons) {
    const course = courseById.get(lesson.courseId);
    if (!course) continue;
    if (hasHandsOnTutorial(lesson)) continue;

    const tutorial = tutorialFor(course);
    lesson.content = {
      ...lesson.content,
      sections: [
        ...lesson.content.sections,
        ...buildTutorialSections(course, lesson, tutorial),
      ],
    };
  }
}

function tutorialFor(course: Course): TutorialBlueprint {
  return {
    ...(DOMAIN_TUTORIALS[course.taxonomy.l1] ?? DEFAULT_TUTORIAL),
    ...(COURSE_TUTORIALS[course.id] ?? {}),
  };
}

function buildTutorialSections(course: Course, lesson: Lesson, tutorial: TutorialBlueprint): LessonSection[] {
  const mission = tutorial.missions[lesson.order % tutorial.missions.length] ?? tutorial.missions[0];
  const levelGuidance = difficultyGuidance(course.difficulty);

  return [
    {
      type: 'text',
      content: [
        `## Hands-on tutorial: ${tutorial.labTitle}`,
        `**Mission for this lesson:** ${mission}.`,
        tutorial.scenario,
        `Because this lesson is **${lesson.title}**, focus on turning the concept into one concrete artifact. ${levelGuidance}`,
        '### Your lab path',
        '1. **Warm up.** Re-read the lesson and write a one-sentence claim you can test.',
        `2. **Build.** Use the toolbox: ${tutorial.toolbox.join(', ')}.`,
        '3. **Break it.** Change one assumption, bad input, dependency, or constraint and observe what fails.',
        '4. **Explain it.** Write what changed, why it mattered, and what you would do next.',
        `### Deliverable`,
        tutorial.deliverable,
      ].join('\n\n'),
    },
    {
      type: 'codeBlock',
      language: tutorial.language,
      caption: `${course.title} lab starter`,
      code: tutorial.starterCode,
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Make it playful',
      content: tutorial.funTwist,
    },
    {
      type: 'quiz',
      title: 'Hands-on lab debrief',
      passingScore: 70,
      questions: [
        {
          id: `${lesson.id}-hands-on-1`,
          question: `What should you produce for the "${tutorial.labTitle}" activity?`,
          options: [
            tutorial.deliverable,
            'Only a memorized definition with no artifact',
            'A copied solution that you do not run or inspect',
            'A list of tools without a scenario or trade-off',
          ],
          correctIndex: 0,
          explanation: 'The lab is designed around a visible artifact so learners can prove practical understanding.',
        },
        {
          id: `${lesson.id}-hands-on-2`,
          question: 'Why does the lab ask you to break or vary one assumption?',
          options: [
            'To reveal trade-offs and failure modes instead of only practicing the happy path',
            'To make the exercise slower without adding learning value',
            'To avoid writing down what happened',
            'To replace the lesson content with trial and error',
          ],
          correctIndex: 0,
          explanation: 'Breaking one assumption makes the lesson stick because it connects theory to real-world constraints.',
        },
      ],
    },
  ];
}

function difficultyGuidance(difficulty: DifficultyLevel) {
  if (difficulty === 'beginner') {
    return 'Keep the first version tiny and guided: copy, run, observe, then change one thing.';
  }
  if (difficulty === 'advanced') {
    return 'Push beyond a demo: compare alternatives, measure a trade-off, and write a defensible recommendation.';
  }
  return 'Build the normal path first, then add one realistic constraint such as latency, security, cost, or failure recovery.';
}

function hasHandsOnTutorial(lesson: Lesson) {
  return lesson.content.sections.some(section => section.type === 'text' && section.content.includes('## Hands-on tutorial:'));
}
