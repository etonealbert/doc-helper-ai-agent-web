# Testing Context

Load this context when adding tests, changing behavior with regression risk,
introducing test dependencies, or updating CI and quality commands.

## Current State

The repository uses Vitest in jsdom with React Testing Library,
`@testing-library/user-event`, `@testing-library/jest-dom`, and MSW. The current
suite contains API, request-layer, configuration, formatter, Query configuration,
and component behavior tests.

The required quality gate is:

```text
npm run lint
npm run format:check
npm run typecheck
npm run test:run
npm run build
```

`npm run build` includes TypeScript compilation. CI runs the same five commands
after `npm ci` and uploads the resulting `dist` artifact.

## Test Isolation

- Tests must never call the deployed API.
- `src/test/server.ts` creates the MSW Node server.
- `src/test/setup.ts` starts it with `onUnhandledRequest: 'error'`.
- `src/test/handlers.ts` supplies default health, documents, and chat handlers.
- Shared fixtures are fictional, non-identifying demonstration data.
- Global setup resets MSW handlers and `localStorage` after each test.
- Use per-test MSW handlers for errors, delays, malformed payloads, and aborts.

## Current Coverage

API and request coverage includes:

- valid and malformed health responses;
- document key conversion and non-negative integer validation;
- empty document-response defaults;
- chat metadata conversion and omitted backend defaults;
- object-only present action results and rejection of arrays, scalars, and null;
- strict classifications and action statuses;
- mixed root and nested error metadata;
- safe `422`, `429`, generic `5xx`, invalid JSON, timeout, and caller abort behavior;
- Query retry and stale-time defaults; and
- configuration error cause retention.

UI and utility coverage includes:

- complete chat response rendering and persistent live announcement, including
  identical consecutive answers and failed follow-up requests;
- payload/failure-free, zero-retention mutation behavior and duplicate-submission prevention;
- CRM-unavailable and network error safety language;
- retry without a duplicate user message;
- emergency response preservation and professional-help warning;
- starter prompts, Enter, and Shift+Enter behavior;
- clear, abort, transcript reset, and session rotation;
- health display, cancellation, and 45-second polling;
- document retry and cancellation; and
- recursive structured-result redaction.

## Testing Conventions

- Assert accessible names, roles, and visible behavior rather than implementation
  selectors.
- Use MSW at the network boundary rather than mocking `fetch` in component tests.
- Keep pure schema and formatter tests fast and isolated.
- Restore handlers, storage, clipboard stubs, mocks, and fake timers after use.
- Avoid snapshots for dynamic workflow output; assert key behavior and content.
- Add regression coverage with every bug fix or behavior change.

## Remaining Gaps

Automated browser-level accessibility, end-to-end deployment, and visual
regression checks are not part of the current suite. Keep these in the roadmap or
backlog rather than describing them as implemented.

When tooling changes, update this file, `README.md`, `AGENTS.md`,
`docs/conventions.md`, and CI workflow documentation together.
