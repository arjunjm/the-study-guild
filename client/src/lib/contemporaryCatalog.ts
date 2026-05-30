import type { Course, CourseTaxonomy, DifficultyLevel, Lesson, LessonContent } from '@study-guild/shared';

const PUBLISHED_AT = '2026-05-30T00:00:00.000Z';

interface CourseSpec {
  id: string;
  title: string;
  description: string;
  taxonomy: CourseTaxonomy;
  difficulty: DifficultyLevel;
  tags: string[];
  ratingAverage: number;
  ratingCount: number;
  lessons: LessonSpec[];
}

interface LessonSpec {
  id: string;
  title: string;
  minutes: number;
  focus: string;
  practice: string;
  pitfall: string;
  check: string;
}

const COURSE_SPECS: CourseSpec[] = [
  {
    id: 'course-mcp',
    title: 'Model Context Protocol (MCP) for AI Apps',
    description: 'Learn how MCP connects AI assistants to tools, data, and workflows through a standard protocol. Build a safe mental model for servers, clients, tools, resources, prompts, permissions, and threat boundaries.',
    taxonomy: { l1: 'AI & ML', l2: 'MCP' },
    difficulty: 'intermediate',
    tags: ['mcp', 'ai-tools', 'agents', 'protocols', 'tool-use', 'security'],
    ratingAverage: 4.9,
    ratingCount: 22,
    lessons: [
      {
        id: 'lesson-mcp-1',
        title: 'Why MCP exists',
        minutes: 16,
        focus: 'MCP standardizes how assistants discover and call tools instead of every integration inventing its own adapter.',
        practice: 'Sketch an assistant that needs files, issues, and a database. Mark which capabilities should be MCP tools, resources, or prompts.',
        pitfall: 'Treating MCP as a magic security boundary. It is a protocol; the host application still owns consent, isolation, and auditing.',
        check: 'What problem does MCP primarily solve for AI applications?',
      },
      {
        id: 'lesson-mcp-2',
        title: 'Tools, resources, prompts, and clients',
        minutes: 18,
        focus: 'MCP applications are built from clients that connect to servers, discover capabilities, and request tool/resource/prompt operations.',
        practice: 'Design a tiny MCP server for a study app with one read-only resource, one search tool, and one guided prompt.',
        pitfall: 'Creating broad tools like runAnything(command). Safer MCP tools are narrow, typed, permissioned, and observable.',
        check: 'Why should MCP tools be narrow and typed?',
      },
      {
        id: 'lesson-mcp-3',
        title: 'Securing MCP in production',
        minutes: 18,
        focus: 'Production MCP needs least privilege, user confirmation, sandboxing, output validation, and protection against tool poisoning and prompt injection.',
        practice: 'Threat-model an MCP server that can read project files and create GitHub issues. Add approval gates for risky actions.',
        pitfall: 'Letting tool descriptions, resource content, or remote servers quietly change what the assistant is allowed to do.',
        check: 'Which control best limits blast radius for an MCP tool?',
      },
    ],
  },
  {
    id: 'course-llm-security',
    title: 'LLM App Security & Prompt Injection Defense',
    description: 'Defend AI applications against prompt injection, data leakage, overbroad tool permissions, insecure output handling, and model supply-chain risk using OWASP-aligned controls.',
    taxonomy: { l1: 'Security', l2: 'AI Security' },
    difficulty: 'intermediate',
    tags: ['llm-security', 'prompt-injection', 'owasp', 'ai-safety', 'guardrails', 'tools'],
    ratingAverage: 4.9,
    ratingCount: 27,
    lessons: [
      {
        id: 'lesson-llmsec-1',
        title: 'Prompt injection as untrusted input',
        minutes: 17,
        focus: 'Prompt injection happens when untrusted text tries to override system or developer intent. Treat retrieved documents, web pages, emails, and user text as hostile input.',
        practice: 'Write a malicious support-ticket message that tries to exfiltrate hidden instructions, then design a safe response policy.',
        pitfall: 'Assuming delimiters or “ignore previous instructions” warnings are enough by themselves.',
        check: 'What should an LLM app assume about retrieved content?',
      },
      {
        id: 'lesson-llmsec-2',
        title: 'Tool permissions and blast radius',
        minutes: 18,
        focus: 'The most dangerous LLM failures happen when model output can trigger real actions. Permissions, scopes, dry runs, and human approval reduce blast radius.',
        practice: 'Take a fictional email assistant and split tools into read-only, draft-only, and send-with-confirmation categories.',
        pitfall: 'Giving the model a single tool with broad credentials because it is convenient for demos.',
        check: 'What makes a tool safer for agentic use?',
      },
      {
        id: 'lesson-llmsec-3',
        title: 'Output handling, evals, and incident response',
        minutes: 18,
        focus: 'LLM security is operational: validate structured outputs, log decisions, test adversarial cases, and add incidents back into evals.',
        practice: 'Create five adversarial test cases for a RAG chatbot and define what a safe answer should do.',
        pitfall: 'Shipping guardrails without measuring false positives, false negatives, and user impact.',
        check: 'Why do LLM security controls need ongoing evaluation?',
      },
    ],
  },
  {
    id: 'course-supply-chain-security',
    title: 'Software Supply Chain Security with SBOM & SLSA',
    description: 'Protect build pipelines and dependencies with SBOMs, provenance, signed artifacts, dependency review, SLSA levels, and practical CI/CD hardening.',
    taxonomy: { l1: 'Security', l2: 'Supply Chain' },
    difficulty: 'intermediate',
    tags: ['supply-chain', 'sbom', 'slsa', 'provenance', 'signing', 'ci-cd'],
    ratingAverage: 4.8,
    ratingCount: 20,
    lessons: [
      {
        id: 'lesson-supply-1',
        title: 'Threat model the build pipeline',
        minutes: 16,
        focus: 'Modern attacks target dependency resolution, build scripts, CI secrets, artifact registries, and release automation.',
        practice: 'Draw a pipeline from pull request to production and mark every place code, secrets, or artifacts can be tampered with.',
        pitfall: 'Only scanning runtime containers while ignoring build credentials and generated artifacts.',
        check: 'Why is the build system part of the production attack surface?',
      },
      {
        id: 'lesson-supply-2',
        title: 'SBOMs, dependency review, and vulnerability triage',
        minutes: 17,
        focus: 'An SBOM lists what is inside software; useful programs pair SBOM generation with policy, vulnerability triage, and update workflows.',
        practice: 'Generate a mock SBOM for a small app and classify dependencies by direct/transitive, runtime/dev, and criticality.',
        pitfall: 'Treating an SBOM as compliance paperwork instead of an operational inventory.',
        check: 'What makes an SBOM useful after it is generated?',
      },
      {
        id: 'lesson-supply-3',
        title: 'Provenance, signing, and SLSA levels',
        minutes: 18,
        focus: 'Provenance answers who built an artifact, from which source, with which process. Signing and SLSA controls make tampering harder.',
        practice: 'Design a release gate that requires tests, signed artifacts, and provenance before deployment.',
        pitfall: 'Signing artifacts while leaving the CI workflow mutable by anyone with repository write access.',
        check: 'What question does build provenance answer?',
      },
    ],
  },
  {
    id: 'course-platform-engineering',
    title: 'Platform Engineering & Internal Developer Platforms',
    description: 'Build platforms as products: golden paths, developer portals, self-service infrastructure, paved roads, DORA/SPACE metrics, and governance without bottlenecks.',
    taxonomy: { l1: 'Cloud', l2: 'Platform Engineering' },
    difficulty: 'advanced',
    tags: ['platform-engineering', 'idp', 'backstage', 'golden-paths', 'developer-experience', 'devops'],
    ratingAverage: 4.8,
    ratingCount: 18,
    lessons: [
      {
        id: 'lesson-platform-1',
        title: 'Platforms as products',
        minutes: 18,
        focus: 'A platform team succeeds when developers willingly use the paved road because it is faster, safer, and better supported than hand-rolled alternatives.',
        practice: 'Interview an imaginary product team and identify their top three delivery pains. Turn one pain into a platform capability.',
        pitfall: 'Building a control plane nobody wants because the platform team optimized for governance before usability.',
        check: 'Why should an internal platform be treated like a product?',
      },
      {
        id: 'lesson-platform-2',
        title: 'Golden paths and developer portals',
        minutes: 18,
        focus: 'Golden paths combine templates, docs, automation, and guardrails into repeatable workflows for common engineering jobs.',
        practice: 'Design a golden path for shipping a new API service: repo template, CI, deploy, secrets, logs, alerts, and ownership.',
        pitfall: 'Confusing a catalog of tools with a coherent workflow that gets a developer from idea to production.',
        check: 'What does a golden path include beyond documentation?',
      },
      {
        id: 'lesson-platform-3',
        title: 'Measuring platform impact',
        minutes: 17,
        focus: 'Use delivery metrics, experience surveys, support load, adoption, reliability, and qualitative feedback to evaluate platform value.',
        practice: 'Create a platform scorecard with two DORA metrics, two developer-experience signals, and one risk/control signal.',
        pitfall: 'Measuring only number of platform users without proving that the platform made delivery better.',
        check: 'Which metric combination best captures platform health?',
      },
    ],
  },
  {
    id: 'course-serverless-events',
    title: 'Serverless & Event-Driven Architecture',
    description: 'Design event-driven systems with queues, topics, serverless functions, idempotency, retries, ordering, dead-letter queues, and observability.',
    taxonomy: { l1: 'Cloud', l2: 'Serverless' },
    difficulty: 'intermediate',
    tags: ['serverless', 'event-driven', 'queues', 'functions', 'idempotency', 'distributed-systems'],
    ratingAverage: 4.7,
    ratingCount: 23,
    lessons: [
      {
        id: 'lesson-serverless-1',
        title: 'Events, commands, queues, and topics',
        minutes: 16,
        focus: 'Event-driven systems decouple producers and consumers, but they introduce delivery semantics, ordering questions, and debugging challenges.',
        practice: 'Model a course-completed flow with one command, one event, one queue, and one notification subscriber.',
        pitfall: 'Calling every message an event. Commands ask something to happen; events state that something already happened.',
        check: 'What is the difference between a command and an event?',
      },
      {
        id: 'lesson-serverless-2',
        title: 'Retries, idempotency, and dead letters',
        minutes: 18,
        focus: 'Reliable event systems expect duplicate delivery, partial failure, poison messages, and retry storms. Idempotency is not optional.',
        practice: 'Design an idempotency key and dead-letter policy for awarding XP after a lesson completion event.',
        pitfall: 'Retrying failed messages forever without visibility or a dead-letter workflow.',
        check: 'Why must event handlers be idempotent?',
      },
      {
        id: 'lesson-serverless-3',
        title: 'Observability for async systems',
        minutes: 17,
        focus: 'Async systems need correlation IDs, queue depth metrics, dead-letter alerts, distributed traces, and replay tooling.',
        practice: 'Create a dashboard sketch for an event pipeline with producer rate, consumer lag, failures, and replay count.',
        pitfall: 'Only logging inside functions and losing the connection between the original request and downstream work.',
        check: 'What signal tells you an event consumer is falling behind?',
      },
    ],
  },
  {
    id: 'course-finops',
    title: 'FinOps & Cloud Cost Engineering',
    description: 'Learn how engineering teams control cloud spend with tagging, unit economics, budgets, rightsizing, reserved capacity, autoscaling, and cost-aware architecture.',
    taxonomy: { l1: 'Cloud', l2: 'FinOps' },
    difficulty: 'intermediate',
    tags: ['finops', 'cloud-cost', 'unit-economics', 'budgets', 'rightsizing', 'cost-optimization'],
    ratingAverage: 4.7,
    ratingCount: 19,
    lessons: [
      {
        id: 'lesson-finops-1',
        title: 'Cloud cost as an engineering signal',
        minutes: 15,
        focus: 'FinOps is a collaboration model: engineering, finance, and product teams use cost data to make better trade-offs.',
        practice: 'Take a fictional cloud bill and allocate spend by service, team, environment, and user-facing feature.',
        pitfall: 'Treating cost as a monthly finance surprise instead of a design constraint and feedback signal.',
        check: 'Why should engineers understand unit cost?',
      },
      {
        id: 'lesson-finops-2',
        title: 'Rightsizing, autoscaling, and commitment discounts',
        minutes: 17,
        focus: 'Cost optimization balances utilization, reliability, performance, and commitment risk.',
        practice: 'Choose between on-demand, reserved, and autoscaled capacity for a workload with predictable weekday traffic.',
        pitfall: 'Buying commitments before understanding usage patterns, seasonality, and ownership.',
        check: 'What risk comes with reserved capacity?',
      },
      {
        id: 'lesson-finops-3',
        title: 'Cost guardrails in delivery pipelines',
        minutes: 16,
        focus: 'Budgets, alerts, policy-as-code, tagging checks, and cost previews catch waste before it becomes normal.',
        practice: 'Add a hypothetical CI gate that blocks untagged resources and warns when infrastructure changes exceed a budget threshold.',
        pitfall: 'Relying on manual dashboards while infrastructure changes are automated.',
        check: 'Where should cost guardrails live in a modern delivery flow?',
      },
    ],
  },
  {
    id: 'course-streaming-data',
    title: 'Streaming Data with Kafka & Flink',
    description: 'Learn stream-processing fundamentals: logs, partitions, consumer groups, event time, windows, state, exactly-once thinking, and operational signals.',
    taxonomy: { l1: 'Databases', l2: 'Data Engineering' },
    difficulty: 'advanced',
    tags: ['kafka', 'flink', 'streaming', 'data-engineering', 'event-time', 'consumer-groups'],
    ratingAverage: 4.8,
    ratingCount: 21,
    lessons: [
      {
        id: 'lesson-streaming-1',
        title: 'Streams, logs, and partitions',
        minutes: 18,
        focus: 'A stream is an ordered log of events. Partitioning gives scale and ordering boundaries, but consumers must handle replay and lag.',
        practice: 'Model a learning-event stream with partitions by userId and explain what ordering is guaranteed.',
        pitfall: 'Assuming a distributed stream has one global order across all partitions.',
        check: 'What ordering guarantee does a partition provide?',
      },
      {
        id: 'lesson-streaming-2',
        title: 'Consumer groups, offsets, and replay',
        minutes: 18,
        focus: 'Consumers track offsets to coordinate work, recover from failure, and replay historical data safely.',
        practice: 'Design a consumer group for XP analytics and describe what happens when one consumer crashes.',
        pitfall: 'Committing offsets before side effects are durable, causing silent data loss.',
        check: 'Why do offset commits matter?',
      },
      {
        id: 'lesson-streaming-3',
        title: 'Windows, state, and late events',
        minutes: 20,
        focus: 'Stream processors compute over event time, processing time, windows, state stores, watermarks, and late-arriving events.',
        practice: 'Calculate a rolling seven-day streak metric and decide how late lesson-completion events should be handled.',
        pitfall: 'Using processing time when business logic depends on when the event actually happened.',
        check: 'Why is event time different from processing time?',
      },
    ],
  },
  {
    id: 'course-wasm-webgpu',
    title: 'WebAssembly & WebGPU for High-Performance Web Apps',
    description: 'Explore modern browser performance tools: WebAssembly modules, JS/WASM boundaries, WebGPU pipelines, shaders, compute workloads, and safe progressive enhancement.',
    taxonomy: { l1: 'Web Development', l2: 'WebAssembly' },
    difficulty: 'advanced',
    tags: ['webassembly', 'wasm', 'webgpu', 'performance', 'graphics', 'browser'],
    ratingAverage: 4.8,
    ratingCount: 17,
    lessons: [
      {
        id: 'lesson-wasm-1',
        title: 'When WebAssembly helps',
        minutes: 17,
        focus: 'WebAssembly is useful for predictable compute-heavy work, language reuse, and sandboxed modules—not for replacing all JavaScript.',
        practice: 'Choose whether image resizing, form validation, markdown rendering, and a physics simulation belong in JS or WASM.',
        pitfall: 'Ignoring boundary costs between JavaScript and WebAssembly.',
        check: 'When is WebAssembly most likely to help a web app?',
      },
      {
        id: 'lesson-wasm-2',
        title: 'WebGPU mental model',
        minutes: 18,
        focus: 'WebGPU exposes modern GPU concepts: adapters, devices, buffers, pipelines, shaders, command encoders, and queues.',
        practice: 'Sketch a compute pipeline that transforms an array of numbers on the GPU and returns results to the UI.',
        pitfall: 'Assuming GPU acceleration is free; data transfer and setup overhead can dominate small tasks.',
        check: 'What cost can erase a GPU speedup?',
      },
      {
        id: 'lesson-wasm-3',
        title: 'Progressive enhancement and fallbacks',
        minutes: 16,
        focus: 'High-performance browser APIs require feature detection, graceful fallback, worker boundaries, and careful UX around device capabilities.',
        practice: 'Design a fallback plan for a WebGPU-powered data visualization when the browser or device does not support WebGPU.',
        pitfall: 'Shipping a feature that works on your GPU but fails silently for users with unsupported browsers.',
        check: 'Why does WebGPU need progressive enhancement?',
      },
    ],
  },
  {
    id: 'course-ebpf-observability',
    title: 'eBPF & Modern Linux Observability',
    description: 'Learn how eBPF powers low-overhead observability, security, networking, and profiling by safely running programs inside the Linux kernel.',
    taxonomy: { l1: 'Systems', l2: 'Observability' },
    difficulty: 'advanced',
    tags: ['ebpf', 'linux', 'observability', 'profiling', 'networking', 'kernel'],
    ratingAverage: 4.8,
    ratingCount: 16,
    lessons: [
      {
        id: 'lesson-ebpf-1',
        title: 'Why eBPF changed observability',
        minutes: 17,
        focus: 'eBPF lets teams observe kernel and application behavior with lower overhead and less invasive instrumentation.',
        practice: 'Map a request from process to socket to network and mark where eBPF probes can observe latency or drops.',
        pitfall: 'Thinking eBPF replaces application logs and traces. It complements them with kernel-level signals.',
        check: 'What makes eBPF useful for observability?',
      },
      {
        id: 'lesson-ebpf-2',
        title: 'Probes, maps, and safety',
        minutes: 18,
        focus: 'eBPF programs attach to hooks, store data in maps, and pass verification before they can run in the kernel.',
        practice: 'Sketch an eBPF program that counts failed TCP connections by process and stores counts in a map.',
        pitfall: 'Ignoring verifier constraints and assuming arbitrary kernel code can run.',
        check: 'Why does the eBPF verifier matter?',
      },
      {
        id: 'lesson-ebpf-3',
        title: 'From signals to incident response',
        minutes: 17,
        focus: 'eBPF shines when kernel-level data is connected to service names, traces, dashboards, and on-call workflows.',
        practice: 'Design an incident dashboard that combines eBPF network drops, application latency, and deployment markers.',
        pitfall: 'Collecting low-level signals without mapping them to user-facing services or owners.',
        check: 'What makes eBPF data actionable during an incident?',
      },
    ],
  },
];

export const CONTEMPORARY_COURSES: Course[] = COURSE_SPECS.map((spec) => ({
  id: spec.id,
  title: spec.title,
  description: spec.description,
  taxonomy: spec.taxonomy,
  difficulty: spec.difficulty,
  authorId: 'teacher-001',
  authorName: 'The Guild',
  published: true,
  publishedAt: PUBLISHED_AT,
  tags: spec.tags,
  lessonIds: spec.lessons.map((lesson) => lesson.id),
  totalLessons: spec.lessons.length,
  estimatedMinutes: spec.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
  ratingAverage: spec.ratingAverage,
  ratingCount: spec.ratingCount,
  createdAt: PUBLISHED_AT,
  updatedAt: PUBLISHED_AT,
}));

export const CONTEMPORARY_LESSONS: Lesson[] = COURSE_SPECS.flatMap((course) =>
  course.lessons.map((lesson, order) => ({
    id: lesson.id,
    courseId: course.id,
    order,
    title: lesson.title,
    estimatedMinutes: lesson.minutes,
    createdAt: PUBLISHED_AT,
    updatedAt: PUBLISHED_AT,
    content: buildLessonContent(course, lesson),
  })),
);

function buildLessonContent(course: CourseSpec, lesson: LessonSpec): LessonContent {
  return {
    schemaVersion: '1',
    sections: [
      {
        type: 'text',
        content: [
          `## ${lesson.title}`,
          lesson.focus,
          `In **${course.title}**, this lesson is about making a modern engineering trade-off visible. Contemporary teams need to connect concepts to production constraints: safety, cost, latency, ownership, and developer experience.`,
          `A useful way to learn this topic is to ask: what capability are we enabling, what new risk are we introducing, and what signal would tell us the implementation is working?`,
        ].join('\n\n'),
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Try this now',
        content: lesson.practice,
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Watch out',
        content: lesson.pitfall,
      },
      {
        type: 'quiz',
        title: 'Concept check',
        passingScore: 70,
        questions: [
          {
            id: `${lesson.id}-q1`,
            question: lesson.check,
            options: [
              lesson.focus,
              'It mainly exists to add a fashionable tool to the stack.',
              'It removes the need to test or monitor the system.',
              'It is only useful when there are no production constraints.',
            ],
            correctIndex: 0,
            explanation: 'The correct answer ties the topic to the practical capability or trade-off introduced in the lesson.',
          },
        ],
      },
    ],
  };
}
