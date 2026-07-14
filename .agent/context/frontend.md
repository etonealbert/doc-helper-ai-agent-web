# Frontend Context

Load this context when changing React components, feature state, styling,
responsive behavior, accessibility, storage, or shared frontend utilities.

Full architecture: [../../docs/architecture.md](../../docs/architecture.md)

## Stack

- React 19 and React DOM
- TanStack Query for cancellable server state
- Zod for endpoint response validation
- Vite and strict TypeScript
- Native `fetch` and `AbortController`
- CSS Modules plus global design tokens
- Dependency-free typed English/Spanish localization
- No router, state manager, component framework, or CSS framework

## Ownership

- `src/app`: validated runtime configuration and the Query provider
- `src/features/chat`: local conversation state, Query mutation, composer, answer metadata
- `src/features/health`: Query-backed status request and 45-second polling
- `src/features/documents`: Query-backed knowledge-base metadata and display
- `src/shared/api`: transport and safe errors
- `src/shared/components`: cross-feature visual primitives
- `src/shared/hooks`: browser-persistence behavior
- `src/shared/i18n`: catalogs, locale context, and document metadata synchronization
- `src/shared/lib`: pure formatting and redaction utilities
- `src/styles`: tokens, reset, globals, and application CSS Module

Features may depend on `shared`. Shared modules must not depend on features, and
one feature should not import another feature's internal hook or API module.
Cross-feature composition belongs in `App.tsx`; it injects the documents summary
into `ChatFeature`.

## State

- Chat messages and draft: memory only
- Interface locale: memory only; defaults to Spanish on every load
- Session ID: `localStorage`
- Pseudonymous user ID: memory; regenerated on page load
- Health and documents: in-memory Query cache exposed through feature hooks
- Chat request lifecycle: payload/failure-free, no-retry, zero-retention Query mutation in `useChat`
- Active request locks and scroll stickiness: refs

Clearing chat aborts the active request, resets visible state, and rotates the
session ID. Do not persist message content.

## API Boundaries

- Every consumed endpoint has a feature-owned Zod schema.
- Chat defaults omitted `actions` and `sources` to empty arrays,
  `requires_human` to `false`, and omitted action `result` to `null`.
- Present action results must be record objects; arrays, scalars, and explicit
  `null` are invalid.
- Documents default omitted `documents` to `[]` and omitted totals to `0`.
- Classifications and tool statuses remain strict enums.
- `apiRequest` combines safe root and nested error metadata, applies the timeout,
  and forwards caller cancellation.
- Components do not receive unvalidated network data.

## Components

- Components do not call `fetch` directly.
- Frontend-owned copy comes from `src/shared/i18n`; backend and user text remains
  unchanged.
- Locale changes preserve the draft, transcript, session, and active request.
- Each chat operation captures its locale; retries and validated assistant
  responses retain it.
- Keep native controls and semantics where possible.
- Tool data is sanitized and rendered as text, never HTML.
- Starter prompts populate the input; they do not submit automatically.
- Enter submits and Shift+Enter inserts a newline.
- Failed-request retry does not duplicate the user message.
- Classification, action, source, escalation, and trace metadata remain visible.

## Styling

- Reuse `tokens.css` variables.
- Keep component selectors in `ui.module.css`.
- Preserve the restrained neutral, teal, and blue visual system.
- Keep cards at 8px radius or below.
- Maintain support around 360px, tablet, desktop, and large desktop widths.
- Keep the two-language header control usable without crowding the brand or health
  control.
- Keep stable control dimensions, wrapping, and overflow behavior.
- Honor reduced motion and visible focus.

## Accessibility

- Use accessible names for inputs and controls.
- Keep the assistant completion live region mounted from initial render and
  clear it while pending or while the current request has an error before updating
  it with completed non-welcome answers; keep pending and copy status
  announcements distinct.
- Preserve semantic landmarks and heading order.
- Synchronize root `lang` and metadata, and retain response-level `lang` on
  historical assistant answers and the completion announcement.
- Keep tool disclosures keyboard-operable with native `details/summary`.
- Do not rely on color alone for health, classification, or errors.

## Safety

The demo disclaimer must remain near the chat and in the footer in both supported
languages. Emergency and
human escalation require calm, prominent framing. The UI must not claim a real
care outcome, diagnosis, treatment, appointment, callback, ticket, or emergency
contact unless confirmed by a successful backend action.

Update this file and `docs/architecture.md` when state ownership, import
boundaries, design conventions, or accessibility behavior change.
