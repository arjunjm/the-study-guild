export interface TopicResource {
  title: string;
  author?: string;
  type: 'book' | 'blog' | 'course' | 'video' | 'tool' | 'docs';
  description: string;
  url: string;
}

export interface TopicResourceGroup {
  resources: TopicResource[];
}

// Keyed by "l1::l2"
const RESOURCES: Record<string, TopicResource[]> = {

  // ── Security / Authentication ────────────────────────────────────────────
  'Security::Authentication': [
    { title: 'OAuth 2.0 in Action', author: 'Justin Richer & Antonio Sanso', type: 'book', description: 'The definitive book on OAuth 2.0 — covers every grant type, security considerations, and token management in depth.', url: 'https://www.manning.com/books/oauth-2-in-action' },
    { title: 'The OAuth 2.0 Security Best Current Practice', type: 'docs', description: 'IETF draft that documents known attacks against OAuth and the mitigations every implementation must apply.', url: 'https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics' },
    { title: 'Auth0 Blog — Identity & Security', type: 'blog', description: 'In-depth articles on JWTs, PKCE, refresh token rotation, and modern auth patterns from Auth0\'s identity engineers.', url: 'https://auth0.com/blog/security/' },
    { title: 'OpenID Connect Core 1.0 Spec', type: 'docs', description: 'The official OIDC specification — essential reading once you have OAuth down.', url: 'https://openid.net/specs/openid-connect-core-1_0.html' },
    { title: 'jwt.io', type: 'tool', description: 'Interactive JWT decoder/encoder. Paste any token to inspect its header, payload, and verify signatures in the browser.', url: 'https://jwt.io' },
  ],

  // ── Security / Authorization ─────────────────────────────────────────────
  'Security::Authorization': [
    { title: 'Zanzibar: Google\'s Consistent, Global Authorization System', type: 'blog', description: 'Google\'s landmark paper on how they built the authorization system powering Drive, YouTube, and Gmail at planet scale.', url: 'https://research.google/pubs/pub48190/' },
    { title: 'OWASP Authorization Cheat Sheet', type: 'docs', description: 'Practical guide to implementing authorization correctly — covers RBAC, ABAC, and common pitfalls.', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html' },
    { title: 'OpenFGA Docs', type: 'docs', description: 'Open-source Zanzibar-inspired authorization engine by Auth0. Great for learning relationship-based access control.', url: 'https://openfga.dev/docs/fga' },
    { title: 'casbin.org', type: 'tool', description: 'Policy-based authorization library with RBAC/ABAC support for Go, Node, Python, and more.', url: 'https://casbin.org' },
  ],

  // ── Security / Network ───────────────────────────────────────────────────
  'Security::Network': [
    { title: 'The Web Application Hacker\'s Handbook', type: 'book', description: 'Classic comprehensive reference on web attack techniques and defenses — still highly relevant.', url: 'https://www.wiley.com/en-us/The+Web+Application+Hacker%27s+Handbook%3A+Finding+and+Exploiting+Security+Flaws%2C+2nd+Edition-p-9781118026472' },
    { title: 'Cloudflare Blog — Security', type: 'blog', description: 'Deep dives on TLS, DDoS mitigation, zero trust, and real-world attack post-mortems from one of the internet\'s biggest edges.', url: 'https://blog.cloudflare.com/tag/security/' },
    { title: 'OWASP Top 10', type: 'docs', description: 'The canonical list of the most critical web application security risks, updated every few years.', url: 'https://owasp.org/www-project-top-ten/' },
    { title: 'Wireshark', type: 'tool', description: 'The go-to network protocol analyser. Essential for understanding what\'s actually on the wire.', url: 'https://www.wireshark.org' },
  ],

  // ── Security / Cryptography ──────────────────────────────────────────────
  'Security::Cryptography': [
    { title: 'Cryptography Engineering', author: 'Schneier, Ferguson & Kohno', type: 'book', description: 'The practical cryptographer\'s bible — not just theory but design principles and real-world pitfalls.', url: 'https://www.schneier.com/books/cryptography-engineering/' },
    { title: 'A Graduate Course in Applied Cryptography', author: 'Boneh & Shoup', type: 'book', description: 'Free online textbook covering symmetric & public-key crypto from first principles with rigorous proofs.', url: 'https://toc.cryptobook.us' },
    { title: 'Crypto 101', type: 'course', description: 'A free introductory course explaining crypto concepts accessibly, with hands-on exercises.', url: 'https://www.crypto101.io' },
    { title: 'Cryptopals Challenges', type: 'tool', description: 'Hands-on attack-based learning: break real crypto by exploiting classic implementation mistakes.', url: 'https://cryptopals.com' },
  ],

  // ── Web Development / Frontend ───────────────────────────────────────────
  'Web Development::Frontend': [
    { title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', type: 'book', description: 'Concise, opinionated guide to the best parts of JavaScript — a rite of passage.', url: 'https://www.oreilly.com/library/view/javascript-the-good/9780596517748/' },
    { title: 'web.dev — Learn', type: 'docs', description: 'Google\'s structured learning path for modern web development: performance, accessibility, CSS, and more.', url: 'https://web.dev/learn' },
    { title: 'CSS Tricks', type: 'blog', description: 'In-depth articles and almanac on CSS, Flexbox, Grid, animations — invaluable when you\'re stuck.', url: 'https://css-tricks.com' },
    { title: 'Josh Comeau\'s Blog', type: 'blog', description: 'Beautiful interactive tutorials on CSS, React, and animation that genuinely change how you think.', url: 'https://www.joshwcomeau.com' },
    { title: 'React Docs', type: 'docs', description: 'The official React documentation — rewritten from scratch in 2023, now with excellent interactive examples.', url: 'https://react.dev' },
  ],

  // ── Web Development / Backend ────────────────────────────────────────────
  'Web Development::Backend': [
    { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', type: 'book', description: 'Required reading for backend engineers. Covers databases, distributed systems, and data pipelines with rare clarity.', url: 'https://dataintensive.net' },
    { title: 'Node.js Best Practices', type: 'blog', description: 'Community-maintained repository of Node.js best practices covering testing, security, performance, and architecture.', url: 'https://github.com/goldbergyoni/nodebestpractices' },
    { title: 'High Scalability Blog', type: 'blog', description: 'Real-world architecture case studies from companies like Twitter, Netflix, and Airbnb — how they actually scale.', url: 'http://highscalability.com' },
    { title: 'ByteByteGo', type: 'blog', description: 'Alex Xu\'s visual system design newsletter — the best visual explanations of distributed systems on the internet.', url: 'https://blog.bytebytego.com' },
  ],

  // ── Web Development / APIs ───────────────────────────────────────────────
  'Web Development::APIs': [
    { title: 'REST API Design Rulebook', author: 'Mark Masse', type: 'book', description: 'The original treatise on RESTful API design patterns — resource naming, URIs, and HTTP semantics.', url: 'https://www.oreilly.com/library/view/rest-api-design/9781449317904/' },
    { title: 'API Security in Action', type: 'book', description: 'Covers OAuth, JWT, rate limiting, and how to secure REST & GraphQL APIs from common attacks.', url: 'https://www.manning.com/books/api-security-in-action' },
    { title: 'Stripe API Docs', type: 'docs', description: 'Widely considered the gold standard of API documentation. Study these to understand what great DX looks like.', url: 'https://stripe.com/docs/api' },
    { title: 'Swagger / OpenAPI 3.1 Spec', type: 'docs', description: 'The specification for describing RESTful APIs — essential for code generation, mocking, and documentation.', url: 'https://swagger.io/specification/' },
    { title: 'Hoppscotch', type: 'tool', description: 'Open-source API testing tool — a lightweight, browser-first alternative to Postman.', url: 'https://hoppscotch.io' },
  ],

  // ── Web Development / GraphQL ────────────────────────────────────────────
  'Web Development::GraphQL': [
    { title: 'GraphQL: The Documentary', type: 'video', description: 'The story of how GraphQL was invented at Facebook and why it changed how we think about APIs. 30 minutes well spent.', url: 'https://www.youtube.com/watch?v=783ccP__No8' },
    { title: 'Production Ready GraphQL', author: 'Marc-André Giroux', type: 'book', description: 'The book on running GraphQL at scale: pagination, authorization, batching, and schema design from a Shopify engineer.', url: 'https://book.productionreadygraphql.com' },
    { title: 'The Guild Blog', type: 'blog', description: 'Highly technical articles on GraphQL tooling, schema federation, and performance from the open-source GraphQL community.', url: 'https://the-guild.dev/blog' },
  ],

  // ── Cloud / Azure ────────────────────────────────────────────────────────
  'Cloud::Azure': [
    { title: 'Microsoft Learn — Azure', type: 'docs', description: 'Microsoft\'s own free, structured learning platform for Azure — certifications paths, interactive labs, sandboxes.', url: 'https://learn.microsoft.com/en-us/training/azure/' },
    { title: 'Azure Architecture Center', type: 'docs', description: 'Official best practices, reference architectures, and decision guides for every Azure service. Bookmark it.', url: 'https://learn.microsoft.com/en-us/azure/architecture/' },
    { title: 'Azure Weekly Newsletter', type: 'blog', description: 'Curated weekly digest of Azure announcements, tutorials, and community posts.', url: 'https://azureweekly.info' },
  ],

  // ── Cloud / Kubernetes ───────────────────────────────────────────────────
  'Cloud::Kubernetes': [
    { title: 'Kubernetes in Action', author: 'Marko Lukša', type: 'book', description: 'The most thorough and accessible Kubernetes book. Covers pods, controllers, networking, and storage with great examples.', url: 'https://www.manning.com/books/kubernetes-in-action' },
    { title: 'learnk8s.io', type: 'blog', description: 'Beautifully illustrated articles explaining Kubernetes internals — networking, scheduling, autoscaling — with diagrams.', url: 'https://learnk8s.io/blog' },
    { title: 'killer.sh', type: 'tool', description: 'CKA/CKAD exam simulator with realistic scenarios. Even if you don\'t take the cert, it\'s great practice.', url: 'https://killer.sh' },
    { title: 'Kubernetes Docs', type: 'docs', description: 'The official Kubernetes documentation — excellent reference once you\'re past the basics.', url: 'https://kubernetes.io/docs/home/' },
  ],

  // ── Databases / SQL ──────────────────────────────────────────────────────
  'Databases::SQL': [
    { title: 'Use The Index, Luke', type: 'blog', description: 'The best free resource for understanding SQL query performance and indexes. Explains execution plans accessibly.', url: 'https://use-the-index-luke.com' },
    { title: 'PostgreSQL Documentation', type: 'docs', description: 'Postgres has the best database documentation in the industry. Even if you use another DB, it teaches SQL deeply.', url: 'https://www.postgresql.org/docs/' },
    { title: 'SQL Performance Explained', author: 'Markus Winand', type: 'book', description: 'Companion to Use The Index, Luke — concise, visual, and extremely practical. The index book you actually want to read.', url: 'https://sql-performance-explained.com' },
  ],

  // ── Databases / NoSQL ────────────────────────────────────────────────────
  'Databases::NoSQL': [
    { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', type: 'book', description: 'Chapters on replication, partitioning, and consistency are the best treatment of NoSQL trade-offs you\'ll find.', url: 'https://dataintensive.net' },
    { title: 'Amazon DynamoDB Deep Dive', type: 'video', description: 'Rick Houlihan\'s re:Invent talk on DynamoDB single-table design — the talk that changed how the community thinks about NoSQL.', url: 'https://www.youtube.com/watch?v=HaEPXoXVf2k' },
    { title: 'Azure Cosmos DB Documentation', type: 'docs', description: 'The official Cosmos DB docs have great coverage of partitioning strategies and the multi-model API.', url: 'https://learn.microsoft.com/en-us/azure/cosmos-db/' },
  ],

  // ── AI & ML / Machine Learning ───────────────────────────────────────────
  'AI & ML::Machine Learning': [
    { title: 'fast.ai Practical Deep Learning', type: 'course', description: 'Jeremy Howard\'s top-down, practical course. You train real models on lesson 1. One of the best ML courses available, free.', url: 'https://course.fast.ai' },
    { title: 'Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow', author: 'Aurélien Géron', type: 'book', description: 'The most practical ML book available — balanced theory and code with great exercises.', url: 'https://www.oreilly.com/library/view/hands-on-machine-learning/9781492032632/' },
    { title: 'Papers With Code', type: 'tool', description: 'Every ML paper linked to its implementation. The best way to stay current with state-of-the-art research.', url: 'https://paperswithcode.com' },
    { title: 'Andrej Karpathy\'s Blog', type: 'blog', description: 'Deep, technical posts from one of AI\'s most respected practitioners. "Unreasonable Effectiveness of RNNs" is a classic.', url: 'https://karpathy.github.io' },
  ],

  // ── AI & ML / LLMs ──────────────────────────────────────────────────────
  'AI & ML::LLMs': [
    { title: 'Attention Is All You Need', type: 'blog', description: 'The transformer paper that started it all. Surprisingly readable — understanding it makes everything else click.', url: 'https://arxiv.org/abs/1706.03762' },
    { title: 'The Illustrated Transformer', author: 'Jay Alammar', type: 'blog', description: 'The most cited visual explanation of how transformers work. Read it twice.', url: 'https://jalammar.github.io/illustrated-transformer/' },
    { title: 'Prompt Engineering Guide', type: 'docs', description: 'Comprehensive, community-maintained guide to prompt engineering techniques: chain-of-thought, few-shot, RAG, and more.', url: 'https://www.promptingguide.ai' },
    { title: 'Simon Willison\'s Weblog', type: 'blog', description: 'Simon\'s prolific, thoughtful writing on LLMs in practice — the best source for "what\'s new and what does it mean."', url: 'https://simonwillison.net' },
  ],

  // ── Systems / Linux ──────────────────────────────────────────────────────
  'Systems::Linux': [
    { title: 'The Linux Command Line', author: 'William Shotts', type: 'book', description: 'Free online book that covers the command line thoroughly — from navigation to scripting. The best beginner-to-intermediate Linux book.', url: 'https://linuxcommand.org/tlcl.php' },
    { title: 'Julia Evans\' zines', type: 'blog', description: 'Hand-drawn zines explaining Linux tools (strace, gdb, networking, awk) with joyful clarity. Highly recommend.', url: 'https://jvns.ca/zines/' },
    { title: 'Brendan Gregg\'s Blog', type: 'blog', description: 'The definitive source on Linux performance analysis, eBPF, and flame graphs from Netflix\'s performance guru.', url: 'https://www.brendangregg.com/blog/index.html' },
    { title: 'explainshell.com', type: 'tool', description: 'Paste any shell command and it shows you what every flag does, sourced directly from man pages.', url: 'https://explainshell.com' },
  ],

  // ── Systems / Architecture ───────────────────────────────────────────────
  'Systems::Architecture': [
    { title: 'Clean Architecture', author: 'Robert C. Martin', type: 'book', description: 'Uncle Bob\'s framework for building systems where business logic is independent of frameworks, UI, and databases.', url: 'https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164' },
    { title: 'System Design Interview – An Insider\'s Guide', author: 'Alex Xu', type: 'book', description: 'The most popular system design interview prep — but also genuinely teaches you how to think about large-scale systems.', url: 'https://www.amazon.com/System-Design-Interview-insiders-Second/dp/B08CMF2CQF' },
    { title: 'Microservices.io', type: 'blog', description: 'Chris Richardson\'s catalog of microservices patterns — Saga, CQRS, event sourcing, API gateway — with clear diagrams.', url: 'https://microservices.io/patterns/' },
    { title: 'Martin Fowler\'s bliki', type: 'blog', description: 'Martin Fowler\'s wiki-blog on software architecture, refactoring, domain-driven design, and patterns.', url: 'https://martinfowler.com' },
  ],

  // ── Engineering / Design Patterns ────────────────────────────────────────
  'Engineering::Design Patterns': [
    { title: 'Design Patterns (Gang of Four)', author: 'Gamma, Helm, Johnson & Vlissides', type: 'book', description: 'The original 23 patterns. Dense but essential — every design discussion references these.', url: 'https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612' },
    { title: 'Refactoring Guru', type: 'blog', description: 'Beautiful illustrated explanations of all 23 GoF patterns plus refactoring techniques. The best free pattern reference.', url: 'https://refactoring.guru' },
    { title: 'Head First Design Patterns', type: 'book', description: 'Visual, story-driven intro to design patterns — great if the GoF book feels too abstract at first.', url: 'https://www.oreilly.com/library/view/head-first-design/9781492077992/' },
  ],

  // ── Engineering / Python ─────────────────────────────────────────────────
  'Engineering::Python': [
    { title: 'Fluent Python', author: 'Luciano Ramalho', type: 'book', description: 'The definitive advanced Python book. Covers data model, iterators, closures, concurrency, and metaprogramming in depth.', url: 'https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/' },
    { title: 'Real Python', type: 'blog', description: 'High-quality tutorials on every Python topic — from basics to async, type hints, packaging, and testing.', url: 'https://realpython.com' },
    { title: 'Python Docs — Standard Library', type: 'docs', description: 'The official Python standard library reference. The itertools and functools modules alone are worth hours of study.', url: 'https://docs.python.org/3/library/' },
    { title: 'Effective Python', author: 'Brett Slatkin', type: 'book', description: '90 specific, actionable tips for writing Pythonic, idiomatic, and maintainable Python code.', url: 'https://effectivepython.com' },
    { title: 'Python Type Checking Guide (mypy)', type: 'docs', description: 'The mypy documentation explains Python\'s gradual type system and how to annotate code effectively.', url: 'https://mypy.readthedocs.io/en/stable/' },
  ],

  // ── Engineering / Testing ────────────────────────────────────────────────
  'Engineering::Testing': [
    { title: 'Testing Microservices, the sane way', type: 'blog', description: 'Vladislav Supalov\'s landmark post on the testing pyramid and why unit/integration/e2e should be balanced differently than people think.', url: 'https://saucelabs.com/blog/testing-microservices-the-sane-way' },
    { title: 'Kent C. Dodds Blog', type: 'blog', description: 'Kent\'s writing on testing philosophy — "Testing Trophy", implementation detail testing, and why test behaviour not code.', url: 'https://kentcdodds.com/blog' },
    { title: 'The Art of Unit Testing', author: 'Roy Osherove', type: 'book', description: 'Practical guidance on writing maintainable, trustworthy unit tests with real code examples.', url: 'https://www.artofunittesting.com' },
  ],
};

export function getTopicResources(l1: string, l2: string): TopicResource[] {
  return RESOURCES[`${l1}::${l2}`] ?? RESOURCES[`${l1}::*`] ?? [];
}

export const RESOURCE_TYPE_LABELS: Record<TopicResource['type'], string> = {
  book: 'Book',
  blog: 'Blog / Article',
  course: 'Course',
  video: 'Video',
  tool: 'Tool',
  docs: 'Docs',
};

export const RESOURCE_TYPE_COLORS: Record<TopicResource['type'], string> = {
  book:   'bg-amber-100 text-amber-700 border-amber-200',
  blog:   'bg-blue-100 text-blue-700 border-blue-200',
  course: 'bg-violet-100 text-violet-700 border-violet-200',
  video:  'bg-red-100 text-red-700 border-red-200',
  tool:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  docs:   'bg-slate-100 text-slate-600 border-slate-200',
};
