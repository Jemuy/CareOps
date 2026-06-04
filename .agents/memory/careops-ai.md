---
name: CareOps AI
description: Ofsted Inspection Readiness Platform for Children's Homes — stack, routing quirks, and import conventions.
---

# CareOps AI

## Stack
- React + Vite frontend at `/` (careops-ai artifact)
- Express 5 API server at `/api` (api-server artifact)
- PostgreSQL + Drizzle ORM (`lib/db`)
- Orval codegen: types + hooks in `lib/api-client-react`, Zod in `lib/api-zod`

## Critical import rule
All generated types (enums, interfaces) must be imported from `@workspace/api-client-react` (the main entry), NOT from `@workspace/api-client-react/src/generated/api.schemas`. The package only exports `"."` — deep imports cause Vite 500 errors.

**Why:** The package.json `exports` field only maps `"." → "./src/index.ts"`. Deep path imports are not exposed and will fail at runtime.

## Route mounting
Training and supervisions are separate routers mounted at `/api/training` and `/api/supervisions`. The regulation router is split into `reg44Router`, `reg45Router`, and `regulationRouter` exported from `routes/regulation.ts`.

**Why:** A single training router with sub-paths for supervisions would incorrectly serve training data when the `/supervisions` prefix is hit.

## Inspection page riskSummary
The `/api/inspection/pack` endpoint returns `riskSummary` as an array of evidence gap objects (not strings). Render with `(risk: any)` and access `.description`, `.severity`, `.domain`, `.recommendation` properties.
