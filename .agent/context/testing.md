# Testing Context

Load this context when adding tests, changing behavior with regression risk,
introducing test dependencies, or updating CI and quality commands.

## Current State

There is no automated test suite yet. Available scripts are:

```bash
npm run lint
npm run build
```

`npm run build` includes TypeScript compilation. Do not run or document
`test:run`, `format:check`, or standalone `typecheck` as available until those
scripts exist in `package.json`.

## Target Tooling

When test tooling is authorized, use:

- Vitest
- React Testing Library
- `@testing-library/user-event`
- MSW for network behavior

Tests must not call the deployed API. Use realistic, fictional fixtures with no
patient or identifying data.

## API Coverage

Cover at minimum:

- valid health response;
- malformed health response;
- valid documents response;
- valid chat response and all displayed metadata;
- backend error conversion to `ApiError`;
- root and nested error envelopes;
- invalid JSON and invalid success schema;
- timeout and caller abort;
- network failure;
- `422`, `429`, `503`, `crm_unavailable`, and generic `5xx` mapping.

## UI Coverage

Cover at minimum:

- sending a message and rendering the assistant answer;
- classification, tools, sources, and trace ID;
- emergency and human-escalation warnings;
- duplicate-submission prevention;
- pending announcement and disabled state;
- safe CRM-unavailable and network errors;
- retry without a duplicate user message;
- clear conversation rotating the session;
- starter prompt populating without automatic submission;
- Enter and Shift+Enter behavior;
- online and unavailable health states;
- document loading, error, retry, and success states;
- keyboard operation of tool disclosure and trace-copy controls.

## Accessibility Expectations

Assert accessible names and roles rather than implementation selectors. Prefer
queries by role, label, and visible text. Test live status updates, native details
keyboard behavior, focusable controls, and warning semantics.

## Test Boundaries

- Keep pure validator and formatter tests fast and isolated.
- Use MSW at the network boundary rather than mocking `fetch` in component tests.
- Reset handlers, storage, clipboard stubs, and fake timers after each test.
- Keep fixtures in a shared test module once test infrastructure exists.
- Avoid snapshots for dynamic workflow output; assert behavior and key content.

## Future Quality Gate

The target full gate is:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test:run
npm run build
```

Only make this required in README, AGENTS, or CI after every script is implemented
and passing. Record unrun or unavailable checks honestly.

When tooling changes, update this file, `README.md`, `AGENTS.md`,
`docs/conventions.md`, and future CI workflows together.