# Feature Roadmap

This document tracks major product work that has landed and larger ideas parked for later.

## Built

| Area | Feature | Status |
|---|---|---|
| Product identity | Guild Hall dashboard with rank, XP, daily contract, recommendations, achievements, leaderboard, and topic panels | Merged |
| Course discovery | Quest Board course browser with contract-style cards, stronger filters, XP potential, progress, and CTAs | Merged |
| Rewards | Polished lesson-completion reward moments with richer XP ledger, confetti, and achievement display | Merged |
| Course pages | Course quest route map showing lesson checkpoints, locked/current/cleared states, lesson features, and XP estimates | Merged |
| Content | Additional AI & ML courses for RAG, AI Agents, LLM Evaluation, and MLOps | Merged |
| Content resources | Further reading groups for new AI & ML topics | Merged |
| Learning paths | Skill-tree style paths for AI Engineer, Backend Engineer, Cloud Developer, and Security Foundations | Merged |
| Teacher tools | Deterministic teacher authoring assistant for course blueprints and draft lesson generation | Merged |
| Gamification | Centralized achievement definitions and shared evaluation logic across server, mock mode, and UI | Merged |
| Notes | Study notebook with search, course filters, review-later pins, editable notes, copy action, and hashtag extraction | Merged |
| Discovery | Ask the Guild catalog assistant for local course Q&A with cited course recommendations | Merged |

## Backburner

| Idea | Why it matters | Notes |
|---|---|---|
| Floating Guild Guide assistant avatar | High-engagement companion that can answer questions, suggest next steps, explain lessons, and celebrate progress | Start with local deterministic answers, then add server-side RAG and Azure OpenAI later |
| Real-time assistant streaming | Makes the Guild Guide feel alive and responsive | Prefer Server-Sent Events before WebSockets unless bidirectional tasks are needed |
| Assistant memory and preferences | Personalizes guidance around goals, weak areas, and current path | Needs user controls for viewing and forgetting memory |
| Course review/moderation workflow | Important before teacher-generated content scales | Add draft/review/published states, admin approval, version history, and moderation |
| Spaced repetition flashcards | Converts course consumption into durable learning | Generate cards from lesson concepts and quiz questions, then schedule reviews |
| Learner analytics dashboard | Helps learners understand strengths, weak spots, XP velocity, and recommended next steps | Could reuse progress, quiz scores, learning paths, and achievements |
| Teacher analytics dashboard | Helps teachers improve content quality | Show completion funnels, quiz miss rates, lesson drop-off, and ratings |

## Current priorities

1. Keep merged UX features stable and refine rough edges from real usage.
2. Expand curated course content in high-value paths.
3. Add backend support when frontend/mock-only features need persistence beyond local storage.
