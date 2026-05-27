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

  // ── Cloud / Docker ───────────────────────────────────────────────────────
  'Cloud::Docker': [
    { title: 'Docker Deep Dive', author: 'Nigel Poulton', type: 'book', description: 'The most concise, accurate Docker book available. Updated regularly. Covers images, containers, Compose, and Swarm.', url: 'https://www.amazon.com/Docker-Deep-Dive-Nigel-Poulton/dp/1521822808' },
    { title: 'Play with Docker', type: 'tool', description: 'Free in-browser Docker environment from Docker. Run containers, practice commands, and try labs without installing anything.', url: 'https://labs.play-with-docker.com' },
    { title: 'Docker Official Docs', type: 'docs', description: 'The official Docker documentation — the reference chapters on Dockerfiles, networking, and volumes are excellent.', url: 'https://docs.docker.com' },
    { title: 'Dive — Image Layer Explorer', type: 'tool', description: 'CLI tool for exploring a Docker image layer by layer. Shows exactly what each layer adds and identifies wasted space.', url: 'https://github.com/wagoodman/dive' },
    { title: 'Trivy — Container Security Scanner', type: 'tool', description: 'Open-source vulnerability scanner for container images. Finds CVEs in OS packages and language dependencies.', url: 'https://github.com/aquasecurity/trivy' },
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

  // ── Engineering / Git ────────────────────────────────────────────────────
  'Engineering::Git': [
    { title: 'Pro Git', author: 'Scott Chacon & Ben Straub', type: 'book', description: 'The definitive, free Git book. Covers everything from basics to internals. Available at git-scm.com.', url: 'https://git-scm.com/book/en/v2' },
    { title: 'Oh Shit, Git!', type: 'blog', description: 'Practical guide to fixing Git mistakes. Every command is a real-life rescue scenario. Bookmarkable.', url: 'https://ohshitgit.com' },
    { title: 'Conventional Commits', type: 'docs', description: 'A specification for adding structured meaning to commit messages. Enables automatic changelog generation and semantic versioning.', url: 'https://www.conventionalcommits.org' },
    { title: 'Visualizing Git', type: 'tool', description: 'Interactive browser-based tool for visualising what Git commands do to the commit graph. Great for understanding rebase and merge.', url: 'https://git-school.github.io/visualizing-git/' },
  ],

  // ── Engineering / Code Quality ───────────────────────────────────────────
  'Engineering::Code Quality': [
    { title: 'Clean Code', author: 'Robert C. Martin', type: 'book', description: 'The classic text on writing readable, maintainable code. Covers naming, functions, comments, and formatting with concrete before/after examples.', url: 'https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882' },
    { title: 'A Philosophy of Software Design', author: 'John Ousterhout', type: 'book', description: 'A fresh perspective on software complexity — what it is, where it comes from, and how to fight it. More concise and contrarian than Clean Code.', url: 'https://www.amazon.com/Philosophy-Software-Design-John-Ousterhout/dp/1732102201' },
    { title: 'ESLint', type: 'tool', description: 'The standard JavaScript/TypeScript linter. Pluggable rules catch common bugs and enforce style. Integrates with every editor.', url: 'https://eslint.org' },
    { title: 'SonarQube Community Edition', type: 'tool', description: 'Open-source static analysis platform that catches bugs, code smells, and security hotspots across many languages.', url: 'https://www.sonarsource.com/open-source/' },
  ],

  // ── Cloud / AWS ──────────────────────────────────────────────────────────
  'Cloud::AWS': [
    { title: 'AWS Well-Architected Framework', type: 'docs', description: 'AWS\'s official guide to building reliable, secure, efficient, and cost-effective systems. The six pillars are essential reading for any AWS architect.', url: 'https://aws.amazon.com/architecture/well-architected/' },
    { title: 'AWS in Plain English', type: 'blog', description: 'Humorous but accurate one-sentence descriptions of what every AWS service actually does, in plain language.', url: 'https://expeditedsecurity.com/aws-in-plain-english/' },
    { title: 'The Open Guide to Amazon Web Services', type: 'docs', description: 'Community-maintained, opinionated guide with hard-won practical advice on every major AWS service.', url: 'https://github.com/open-guides/og-aws' },
    { title: 'AWS Skill Builder', type: 'course', description: 'AWS\'s free official learning platform with digital courses, labs, and exam prep for all AWS certifications.', url: 'https://explore.skillbuilder.aws' },
  ],

  // ── Cloud / CI/CD ────────────────────────────────────────────────────────
  'Cloud::CI/CD': [
    { title: 'GitHub Actions Documentation', type: 'docs', description: 'The official reference for GitHub Actions — workflows, triggers, jobs, steps, and marketplace actions.', url: 'https://docs.github.com/en/actions' },
    { title: 'Continuous Delivery', author: 'Jez Humble & David Farley', type: 'book', description: 'The foundational text on CD pipelines, deployment automation, and the practices that enable frequent, reliable releases.', url: 'https://continuousdelivery.com' },
    { title: 'The DORA Metrics', type: 'blog', description: 'Four metrics (deployment frequency, lead time, MTTR, change failure rate) that predict software delivery and organizational performance.', url: 'https://dora.dev/guides/dora-metrics-four/' },
    { title: 'Act — Run GitHub Actions locally', type: 'tool', description: 'Run your GitHub Actions workflows locally before pushing. Catches syntax errors and dependency issues without burning CI minutes.', url: 'https://github.com/nektos/act' },
  ],

  // ── Databases / Data Modeling ────────────────────────────────────────────
  'Databases::Data Modeling': [
    { title: 'Database Design for Mere Mortals', author: 'Michael J. Hernandez', type: 'book', description: 'The most accessible introduction to relational database design — entity-relationship modeling, normalization, and indexing explained clearly.', url: 'https://www.amazon.com/Database-Design-Mere-Mortals-Hands/dp/0136788041' },
    { title: 'dbdiagram.io', type: 'tool', description: 'Free online tool for drawing ER diagrams using a simple DSL. Great for documenting schemas and sharing with teams.', url: 'https://dbdiagram.io' },
    { title: 'The Data Warehouse Toolkit', author: 'Ralph Kimball', type: 'book', description: 'The definitive guide to dimensional modeling for analytics. Covers star schemas, slowly changing dimensions, and fact tables.', url: 'https://www.amazon.com/Data-Warehouse-Toolkit-Definitive-Dimensional/dp/1118530802' },
  ],

  // ── Databases / Performance ──────────────────────────────────────────────
  'Databases::Performance': [
    { title: 'Use The Index, Luke', type: 'blog', description: 'The best free resource for SQL performance. Explains B-tree indexes, composite indexes, and query execution plans in a database-agnostic way.', url: 'https://use-the-index-luke.com' },
    { title: 'Explain by Depesz', type: 'tool', description: 'Paste a PostgreSQL EXPLAIN ANALYZE output and get a human-readable analysis of slow nodes in the query plan.', url: 'https://explain.depesz.com' },
    { title: 'Database Internals', author: 'Alex Petrov', type: 'book', description: 'How databases work under the hood — storage engines, B-trees, LSM trees, distributed transactions, and consensus. Essential for advanced performance tuning.', url: 'https://www.databass.dev' },
  ],

  // ── Systems / Networking ─────────────────────────────────────────────────
  'Systems::Networking': [
    { title: 'Computer Networks: A Top-Down Approach', author: 'Kurose & Ross', type: 'book', description: 'The standard university networking textbook — covers HTTP, TCP/IP, DNS, routing, and security from the application layer down.', url: 'https://gaia.cs.umass.edu/kurose_ross/index.php' },
    { title: 'Julia Evans\' Networking Zines', type: 'blog', description: 'Visual, hand-drawn explanations of networking concepts — DNS, TCP, HTTP, TLS. Perfect for building mental models quickly.', url: 'https://jvns.ca/zines/' },
    { title: 'Wireshark', type: 'tool', description: 'Capture and analyse actual network traffic. Nothing builds networking intuition faster than seeing real packets.', url: 'https://www.wireshark.org' },
    { title: 'Cloudflare Learning Center', type: 'blog', description: 'Free, beautifully illustrated explanations of networking topics: DNS, CDN, DDoS, BGP, zero trust, and more.', url: 'https://www.cloudflare.com/en-gb/learning/' },
  ],

  // ── Systems / Performance ────────────────────────────────────────────────
  'Systems::Performance': [
    { title: 'Systems Performance', author: 'Brendan Gregg', type: 'book', description: 'The definitive reference on Linux systems performance. Covers CPU, memory, I/O, networking, and cloud with methodology and tools.', url: 'https://www.brendangregg.com/systems-performance-2nd-edition-book.html' },
    { title: 'Brendan Gregg\'s Blog', type: 'blog', description: 'Flame graphs, eBPF, perf, dtrace — the source. Gregg\'s tutorials on profiling Linux systems are unmatched.', url: 'https://www.brendangregg.com/blog/index.html' },
    { title: 'Pyroscope — Continuous Profiling', type: 'tool', description: 'Open-source continuous profiling platform. Profile production systems over time rather than taking one-off snapshots.', url: 'https://pyroscope.io' },
  ],

  // ── AI & ML / Computer Vision ────────────────────────────────────────────
  'AI & ML::Computer Vision': [
    { title: 'CS231n — Convolutional Neural Networks for Visual Recognition', type: 'course', description: 'Stanford\'s legendary computer vision course. Free lectures and notes covering CNNs, object detection, and image segmentation.', url: 'http://cs231n.stanford.edu' },
    { title: 'Roboflow Blog', type: 'blog', description: 'Practical articles on training object detection models, building datasets, and deploying vision models to production.', url: 'https://blog.roboflow.com' },
    { title: 'Ultralytics YOLO Docs', type: 'docs', description: 'The go-to real-time object detection model. The docs include training guides, deployment examples, and benchmarks.', url: 'https://docs.ultralytics.com' },
  ],

  // ── AI & ML / Data Science ───────────────────────────────────────────────
  'AI & ML::Data Science': [
    { title: 'Python for Data Analysis', author: 'Wes McKinney', type: 'book', description: 'The pandas creator\'s own book on data wrangling. The authoritative reference for pandas, NumPy, and Jupyter.', url: 'https://wesmckinney.com/book/' },
    { title: 'Kaggle Learn', type: 'course', description: 'Free micro-courses on pandas, SQL, ML, and data visualization with interactive notebooks. Great for hands-on practice.', url: 'https://www.kaggle.com/learn' },
    { title: 'Towards Data Science', type: 'blog', description: 'Community-curated Medium publication with practical articles on data science, ML, and visualization techniques.', url: 'https://towardsdatascience.com' },
    { title: 'Streamlit', type: 'tool', description: 'Build and share data apps in pure Python. The fastest way to turn a data analysis script into an interactive web app.', url: 'https://streamlit.io' },
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
