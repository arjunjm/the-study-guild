export type LearningPathAccent = 'violet' | 'cyan' | 'amber' | 'emerald' | 'rose';

export interface LearningPathNode {
  id: string;
  courseId: string;
  label: string;
  summary: string;
  prereqCourseIds: string[];
  skills: string[];
}

export interface LearningPath {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  outcome: string;
  accent: LearningPathAccent;
  estimatedWeeks: number;
  nodes: LearningPathNode[];
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'ai-engineer',
    title: 'AI Engineer',
    subtitle: 'Build reliable AI products',
    description: 'Move from ML foundations into LLM apps, RAG, agents, evaluation, and production operations.',
    outcome: 'Ship grounded AI systems with retrieval, tools, evals, and monitoring.',
    accent: 'violet',
    estimatedWeeks: 8,
    nodes: [
      {
        id: 'ai-ml-foundations',
        courseId: 'course-ml',
        label: 'ML foundations',
        summary: 'Understand model training, loss, evaluation, and overfitting.',
        prereqCourseIds: [],
        skills: ['supervised learning', 'metrics', 'model intuition'],
      },
      {
        id: 'ai-prompting',
        courseId: 'course-prompts',
        label: 'Prompting',
        summary: 'Structure instructions, examples, outputs, and safety constraints.',
        prereqCourseIds: [],
        skills: ['prompt patterns', 'structured output', 'hallucination basics'],
      },
      {
        id: 'ai-rag',
        courseId: 'course-rag',
        label: 'RAG systems',
        summary: 'Ground LLM answers in retrieved sources and evaluate faithfulness.',
        prereqCourseIds: ['course-prompts'],
        skills: ['chunking', 'embeddings', 'hybrid retrieval', 'rag evals'],
      },
      {
        id: 'ai-agents',
        courseId: 'course-ai-agents',
        label: 'Agents',
        summary: 'Design tool-using workflows with permissions, traces, and recovery.',
        prereqCourseIds: ['course-prompts'],
        skills: ['tool use', 'workflows', 'schemas', 'observability'],
      },
      {
        id: 'ai-mcp',
        courseId: 'course-mcp',
        label: 'MCP tooling',
        summary: 'Connect AI assistants to tools, resources, and prompts through a standard protocol.',
        prereqCourseIds: ['course-ai-agents'],
        skills: ['MCP servers', 'tool schemas', 'resources', 'permissions'],
      },
      {
        id: 'ai-evals',
        courseId: 'course-llm-evals',
        label: 'Evals & guardrails',
        summary: 'Replace vibe checks with tests, metrics, and safety gates.',
        prereqCourseIds: ['course-rag'],
        skills: ['eval sets', 'faithfulness', 'guardrails', 'quality loops'],
      },
      {
        id: 'ai-security',
        courseId: 'course-llm-security',
        label: 'LLM security',
        summary: 'Defend LLM apps against prompt injection, tool misuse, and unsafe output handling.',
        prereqCourseIds: ['course-ai-agents', 'course-llm-evals'],
        skills: ['prompt injection', 'tool permissions', 'guardrails', 'red teaming'],
      },
      {
        id: 'ai-mlops',
        courseId: 'course-mlops-ai',
        label: 'Production AI',
        summary: 'Operate models and GenAI apps with versioning, monitoring, and rollback.',
        prereqCourseIds: ['course-ml', 'course-llm-evals'],
        skills: ['MLflow', 'deployment', 'drift', 'monitoring'],
      },
    ],
  },
  {
    id: 'backend-engineer',
    title: 'Backend Engineer',
    subtitle: 'Design APIs and reliable services',
    description: 'Learn backend foundations, data modeling, APIs, performance, observability, and real-time systems.',
    outcome: 'Build production services with clear APIs, durable data, and operational visibility.',
    accent: 'cyan',
    estimatedWeeks: 7,
    nodes: [
      {
        id: 'backend-node',
        courseId: 'course-backend',
        label: 'Node backend',
        summary: 'Learn server architecture, middleware, async errors, and persistence.',
        prereqCourseIds: [],
        skills: ['Node.js', 'Express', 'middleware', 'async flows'],
      },
      {
        id: 'backend-rest',
        courseId: 'course-rest-api',
        label: 'REST APIs',
        summary: 'Design resource routes, validation, auth boundaries, and error shapes.',
        prereqCourseIds: ['course-backend'],
        skills: ['REST', 'validation', 'status codes', 'TypeScript'],
      },
      {
        id: 'backend-sql',
        courseId: 'course-sql',
        label: 'SQL foundations',
        summary: 'Query relational data with joins, aggregation, and indexes.',
        prereqCourseIds: [],
        skills: ['joins', 'aggregation', 'indexes'],
      },
      {
        id: 'backend-data-modeling',
        courseId: 'course-data-modeling',
        label: 'Data modeling',
        summary: 'Shape entities, relationships, normalization, and ERDs.',
        prereqCourseIds: ['course-sql'],
        skills: ['ERDs', 'normalization', 'constraints'],
      },
      {
        id: 'backend-performance',
        courseId: 'course-db-perf',
        label: 'Performance',
        summary: 'Read query plans, fix N+1s, tune indexes, and cache safely.',
        prereqCourseIds: ['course-sql-advanced'],
        skills: ['EXPLAIN', 'caching', 'query plans'],
      },
      {
        id: 'backend-observability',
        courseId: 'course-observability',
        label: 'Observability',
        summary: 'Use logs, metrics, and traces to understand production systems.',
        prereqCourseIds: ['course-backend'],
        skills: ['logs', 'metrics', 'traces', 'OpenTelemetry'],
      },
    ],
  },
  {
    id: 'cloud-developer',
    title: 'Cloud Developer',
    subtitle: 'Ship apps on modern infrastructure',
    description: 'Progress from cloud foundations into containers, orchestration, CI/CD, and production operations.',
    outcome: 'Deploy, automate, and operate cloud applications with confidence.',
    accent: 'emerald',
    estimatedWeeks: 6,
    nodes: [
      {
        id: 'cloud-azure',
        courseId: 'course-azure',
        label: 'Azure basics',
        summary: 'Understand app hosting, identity, storage, and managed services.',
        prereqCourseIds: [],
        skills: ['App Service', 'Static Web Apps', 'CosmosDB', 'Entra ID'],
      },
      {
        id: 'cloud-aws',
        courseId: 'course-aws',
        label: 'AWS basics',
        summary: 'Learn EC2, S3, IAM, VPC, Lambda, and cloud responsibility boundaries.',
        prereqCourseIds: [],
        skills: ['EC2', 'S3', 'IAM', 'Lambda'],
      },
      {
        id: 'cloud-docker',
        courseId: 'course-docker',
        label: 'Containers',
        summary: 'Package services into images and compose local environments.',
        prereqCourseIds: ['course-backend'],
        skills: ['Dockerfiles', 'images', 'Compose'],
      },
      {
        id: 'cloud-kubernetes',
        courseId: 'course-kubernetes',
        label: 'Kubernetes',
        summary: 'Run container workloads with pods, services, deployments, and ingress.',
        prereqCourseIds: ['course-docker'],
        skills: ['pods', 'services', 'deployments', 'ingress'],
      },
      {
        id: 'cloud-cicd',
        courseId: 'course-cicd',
        label: 'CI/CD',
        summary: 'Automate builds, tests, deployments, environments, and rollbacks.',
        prereqCourseIds: ['course-git'],
        skills: ['pipelines', 'environments', 'release gates'],
      },
      {
        id: 'cloud-serverless',
        courseId: 'course-serverless-events',
        label: 'Event-driven',
        summary: 'Design serverless event flows with queues, retries, idempotency, and observability.',
        prereqCourseIds: ['course-cicd'],
        skills: ['events', 'queues', 'idempotency', 'dead letters'],
      },
      {
        id: 'cloud-platform',
        courseId: 'course-platform-engineering',
        label: 'Platform engineering',
        summary: 'Build golden paths and internal developer platforms that improve delivery flow.',
        prereqCourseIds: ['course-cicd', 'course-kubernetes'],
        skills: ['golden paths', 'IDPs', 'developer experience', 'governance'],
      },
      {
        id: 'cloud-finops',
        courseId: 'course-finops',
        label: 'FinOps',
        summary: 'Use cost data, budgets, unit economics, and guardrails to make cloud spend intentional.',
        prereqCourseIds: ['course-azure'],
        skills: ['unit cost', 'budgets', 'rightsizing', 'cost guardrails'],
      },
      {
        id: 'cloud-observability',
        courseId: 'course-observability',
        label: 'Operate',
        summary: 'Monitor health, latency, errors, saturation, and deploy confidence.',
        prereqCourseIds: ['course-cicd'],
        skills: ['SLOs', 'dashboards', 'alerts'],
      },
    ],
  },
  {
    id: 'security-foundations',
    title: 'Security Foundations',
    subtitle: 'Defend auth, APIs, and data',
    description: 'Build a practical security base across authentication, authorization, networks, crypto, and API hardening.',
    outcome: 'Design safer systems and reason about the most common web and API risks.',
    accent: 'amber',
    estimatedWeeks: 6,
    nodes: [
      {
        id: 'security-oauth',
        courseId: 'course-oauth2',
        label: 'OAuth2',
        summary: 'Learn delegated authorization, tokens, PKCE, scopes, and common pitfalls.',
        prereqCourseIds: [],
        skills: ['OAuth2', 'PKCE', 'scopes', 'tokens'],
      },
      {
        id: 'security-jwt',
        courseId: 'course-jwt',
        label: 'JWTs',
        summary: 'Understand claims, signatures, expiration, algorithms, and key rotation.',
        prereqCourseIds: ['course-oauth2'],
        skills: ['claims', 'signatures', 'JWKS', 'token validation'],
      },
      {
        id: 'security-authz',
        courseId: 'course-authz',
        label: 'Authorization',
        summary: 'Model RBAC, ABAC, claims, policies, and least privilege.',
        prereqCourseIds: ['course-oauth2'],
        skills: ['RBAC', 'ABAC', 'policies', 'least privilege'],
      },
      {
        id: 'security-https',
        courseId: 'course-https',
        label: 'HTTPS & TLS',
        summary: 'Learn certificates, handshakes, trust chains, and secure transport.',
        prereqCourseIds: [],
        skills: ['TLS', 'certificates', 'trust chains'],
      },
      {
        id: 'security-crypto',
        courseId: 'course-crypto',
        label: 'Cryptography',
        summary: 'Understand hashes, signatures, symmetric encryption, and when not to invent crypto.',
        prereqCourseIds: ['course-https'],
        skills: ['hashing', 'encryption', 'signatures'],
      },
      {
        id: 'security-ai',
        courseId: 'course-llm-security',
        label: 'AI security',
        summary: 'Threat-model LLM apps, prompt injection, tool permissions, and output handling.',
        prereqCourseIds: ['course-authz'],
        skills: ['prompt injection', 'tool scope', 'red teaming', 'evals'],
      },
      {
        id: 'security-supply-chain',
        courseId: 'course-supply-chain-security',
        label: 'Supply chain',
        summary: 'Protect builds and releases with SBOMs, provenance, signing, and SLSA-style controls.',
        prereqCourseIds: ['course-git', 'course-cicd'],
        skills: ['SBOM', 'SLSA', 'provenance', 'artifact signing'],
      },
    ],
  },
];
