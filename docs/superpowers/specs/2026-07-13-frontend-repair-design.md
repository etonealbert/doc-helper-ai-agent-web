# Frontend Repair Design

## Goal

Bring the existing Doc Helper AI Agent frontend to a verifiable release-quality
baseline without redesigning the product or modifying AWS infrastructure or the
backend. The completed frontend must build in strict TypeScript, pass lint and
format checks, have automated behavioral coverage, and expose a working CI gate.

## Scope

This change includes:

- current frontend build and lint failures;
- TanStack Query for health, documents, and chat request lifecycle;
- Zod validation for all consumed API responses;
- error-envelope, cancellation, privacy, accessibility, and contrast fixes;
- Vitest, React Testing Library, user-event, and MSW tests;
- formatting, type-check, and test scripts;
- pull-request and main-branch CI;
- repairs to the existing deployment workflow so its quality stage uses valid
  repository commands;
- README and maintainer documentation updates.

This change excludes:

- Terraform or AWS resource creation;
- DNS changes or frontend deployment;
- backend CORS changes;
- commits, pushes, or deployment actions.

The backend CORS allowlist and the production apex DNS records remain external
release blockers until they are changed in their owning systems.

## Architecture

The existing feature-oriented source structure remains in place. An application
provider owns a conservatively configured TanStack Query client. Health and
documents use queries with bounded retries, suitable stale times, and query-owned
abort signals. Chat uses a no-retry mutation while conversation messages remain
local React state and are never stored in Query cache or browser storage.

Endpoint modules receive `unknown` data from the shared request layer and parse it
with Zod schemas. The shared request layer continues to own URL construction,
headers, timeout behavior, caller cancellation, safe JSON parsing, and typed API
errors. Visual components do not call `fetch` directly.

Cross-feature composition belongs in `App`. The chat feature must not import the
documents feature's internal component; the application layer will compose or
inject the knowledge-base presentation instead.

## API Validation And Errors

The chat schema accepts fields that the deployed OpenAPI contract defaults when
omitted: `actions` and `sources` default to empty arrays, and `requires_human`
defaults to `false`. It continues to require message, classification, and trace
ID. Classifications and action statuses are strict enums.

Error parsing combines root and nested `detail` metadata instead of selecting
only one object. Root or nested message, code, and trace ID values are retained,
with response headers used as the trace fallback. This preserves the specific
`crm_unavailable` safety message that no appointment or callback was created.

The request layer immediately propagates a caller signal that was already
aborted. Timeout aborts remain distinguishable from caller cancellation and
network failures. Health and document refreshes use Query cancellation rather
than unmanaged request controllers.

## Chat And Session Behavior

`useChat` owns the in-memory transcript, retry payload, mutation lifecycle, and
active chat cancellation. Duplicate submission is prevented while a mutation is
pending. Clearing a conversation aborts the current request, clears visible state,
and rotates the persisted session ID. Only the session ID is persisted;
pseudonymous user IDs and message content remain in memory.

Backend answer text is rendered unchanged. Emergency or pain classifications and
responses requiring a human retain the calm professional-help warning. The UI
does not claim that emergency services, an appointment, callback, or ticket were
created unless successful backend action data explicitly confirms it.

## Privacy And Accessibility

Structured action results remain text-only. Recursive redaction expands beyond
credentials and contact fields to common name, address, birth-date, and medical
identifier keys. Redaction behavior receives direct regression tests.

New assistant responses are announced through a polite live region after the
pending announcement. Existing semantic controls, keyboard-operable disclosures,
focus styles, and reduced-motion behavior remain. Low-contrast soft text and
placeholder tokens are raised to WCAG-conscious contrast without changing the
overall visual identity.

## Test Strategy

Vitest runs in jsdom with React Testing Library, user-event, and MSW. Tests do not
depend on the deployed API.

API coverage includes:

- valid and malformed health responses;
- valid chat responses, including omitted default fields;
- unsupported classifications and action statuses;
- backend errors and mixed root/nested metadata;
- invalid JSON;
- timeout and caller abort behavior.

UI coverage includes:

- sending a message and rendering the answer, classification, tools, sources,
  and trace ID;
- escalation warnings;
- duplicate-submission prevention;
- safe handling of CRM unavailability and network failure;
- retry and clear-conversation session rotation;
- health online and unavailable states;
- accessible composer names, pending and completed announcements, and keyboard
  operation of tool disclosures;
- structured-result redaction.

## Tooling And Workflows

The repository gains Prettier and scripts for `format`, `format:check`,
`typecheck`, and `test:run`, plus an `.nvmrc` compatible with the installed Vite
version. TypeScript strict mode is enabled.

The CI workflow runs on pull requests and pushes to `main` with least permissions,
concurrency cancellation, `npm ci`, formatting, lint, type-checking, tests, and a
production build. The existing deployment workflow remains separate, consumes the
same valid quality commands, and still requires pre-provisioned AWS resources and
GitHub environment variables. It does not provision infrastructure.

## Documentation

The malformed README fencing and stale Vite template content are removed.
Architecture, testing, deployment, and agent context documents are updated so
they describe TanStack Query, Zod, the available commands, current CI, and the
remaining external deployment blockers accurately.

## Acceptance Criteria

All of the following commands must complete successfully in the final working
tree:

```text
npm run lint
npm run format:check
npm run typecheck
npm run test:run
npm run build
```

The final review must also confirm that no AWS command, Terraform apply, commit,
push, or backend modification occurred.
