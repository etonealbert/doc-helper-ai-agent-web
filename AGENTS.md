# Agent Guide

## Project

This repository contains the React/Vite frontend for the Doc Helper AI Agent
portfolio demonstration. The existing backend is external and must not be
reimplemented here.

- Production API: `https://api.albertlukmanovlabs.lol`
- Swagger UI: `https://api.albertlukmanovlabs.lol/docs`
- Intended frontend URL: `https://albertlukmanovlabs.lol`
- Product status: demonstration only, not a medical product

Start with [docs/architecture.md](docs/architecture.md) for ownership boundaries
and [docs/api.md](docs/api.md) for endpoint contracts.

## Commands

The required quality gate is:

```text
npm run lint
npm run format:check
npm run typecheck
npm run test:run
npm run build
```

`npm run dev`, `npm run format`, and `npm run preview` are also available for local
development. Tests use MSW and must not call the deployed API. Do not claim a
command passed unless it was actually run in the current working tree.

## Architecture Rules

- Keep endpoint code in `src/features/<feature>/api`.
- Treat every network response as `unknown` until its feature Zod schema succeeds.
- Keep Query lifecycle and feature state in hooks.
- Keep visual components free of direct `fetch` calls.
- Put cross-feature primitives in `src/shared`; do not import one feature's
  internals into another feature.
- Keep conversation messages in React state, not API cache or browser storage.
- Store only the generated session ID in `localStorage`.
- Route all HTTP calls through `src/shared/api/request.ts`.
- Keep environment access and defaults in `src/app/config.ts`.
- Use CSS design tokens from `src/styles/tokens.css` and component styles from
  `src/styles/ui.module.css`.
- Prefer browser APIs and existing local patterns over new dependencies.

See [.agent/context/frontend.md](.agent/context/frontend.md) for detailed component,
state, styling, and accessibility conventions.

## Safety Rules

These requirements are non-negotiable:

- Always identify the application as a portfolio demonstration.
- Never present the interface as medical diagnosis or treatment.
- Never add medication, diagnosis, or treatment advice to backend responses.
- Never use real patient data in examples, fixtures, screenshots, or docs.
- For `emergency_or_pain` or `requires_human=true`, preserve the backend answer
  and show a calm, high-visibility professional-help warning.
- Never imply that emergency services were contacted.
- Confirm a callback, appointment, or ticket only when a successful backend
  action explicitly confirms it.
- Render tool results as text, never arbitrary HTML, and keep sensitive-key
  redaction in place.

## Backend And Errors

The frontend consumes `GET /health`, `GET /api/documents`, and `POST /api/chat`.
Requests time out after approximately 25 seconds. Preserve safe handling for
invalid responses, network failures, `422`, `429`, `503`, and generic `5xx`
responses. A failed scheduling or escalation request must never appear successful.

The full contract and CORS assumptions are in:

- [.agent/context/backend.md](.agent/context/backend.md)
- [docs/api.md](docs/api.md)
- [docs/deployment.md](docs/deployment.md)

## AWS Boundary

No Terraform or provisioned AWS infrastructure exists in this repository. A
deployment workflow definition is present but has not been run or
production-verified by this change. The intended design is a private S3 origin
behind CloudFront OAC, Route 53 aliases, and an ACM certificate in `us-east-1`.
Apex DNS and backend CORS remain external blockers. Do not run Terraform, deploy,
make AWS changes, commit, or push unless the user explicitly authorizes it. Read
[.agent/context/aws.md](.agent/context/aws.md) first.

## Authoritative Files

- Runtime configuration: `src/app/config.ts`
- HTTP behavior: `src/shared/api/request.ts` and `src/shared/api/ApiError.ts`
- Endpoint validation: feature Zod schemas in `api` modules
- Query configuration: `src/app/queryClient.ts` and `src/app/providers.tsx`
- Chat state: `src/features/chat/hooks/useChat.ts`
- Product composition: `src/App.tsx` and `src/features/chat/ChatFeature.tsx`
- Visual tokens and layout: `src/styles/tokens.css` and
  `src/styles/ui.module.css`
- Human documentation: `docs/`
- Current work: `.agent/tasks/current.md`
- Deferred work: `.agent/tasks/backlog.md`

## Change Checklist

1. Make the smallest change within the owning feature or shared boundary.
2. Preserve runtime validation, request cancellation, and safe error language.
3. Verify keyboard behavior, focus visibility, reduced motion, and narrow layouts
   for UI changes.
4. Run the narrowest relevant check, then the complete five-command quality gate
   when command execution is allowed.
5. Update the matching `docs/` and `.agent/context/` files when contracts,
   architecture, deployment, or conventions change.

Do not place future ideas in current implementation docs. Add them to
[.agent/tasks/backlog.md](.agent/tasks/backlog.md) and
[docs/roadmap.md](docs/roadmap.md).
