# Frontend Context

Load this context when changing React components, feature state, styling,
responsive behavior, accessibility, storage, or shared frontend utilities.

Full architecture: [../../../docs/architecture.md](../../../docs/architecture.md)

## Stack

- React 19 and React DOM
- Vite and strict TypeScript
- Native `fetch` and `AbortController`
- Local runtime validation
- CSS Modules plus global design tokens
- No router, state manager, component framework, or CSS framework

## Ownership

- `src/app`: validated runtime configuration
- `src/features/chat`: conversation state, mutation, composer, answer metadata
- `src/features/health`: status request and 45-second polling
- `src/features/documents`: knowledge-base metadata request and display
- `src/shared/api`: transport, validation primitives, and safe errors
- `src/shared/components`: cross-feature visual primitives
- `src/shared/hooks`: browser-persistence behavior
- `src/shared/lib`: pure formatting and redaction utilities
- `src/styles`: tokens, reset, globals, and application CSS Module

Features may depend on `shared`. Shared modules must not depend on features, and
one feature should not import another feature's internal hook or API module.

## State

- Chat messages and draft: memory only
- Session ID: `localStorage`
- Pseudonymous user ID: memory; regenerated on page load
- Health and documents: local feature-hook state
- Active request locks and scroll stickiness: refs

Clearing chat aborts the active request, resets visible state, and rotates the
session ID. Do not persist message content.

## Components

- Components do not call `fetch` directly.
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
- Keep stable control dimensions, wrapping, and overflow behavior.
- Honor reduced motion and visible focus.

## Accessibility

- Use accessible names for inputs and controls.
- Keep live announcements for asynchronous and copy states.
- Preserve semantic landmarks and heading order.
- Keep tool disclosures keyboard-operable with native `details/summary`.
- Do not rely on color alone for health, classification, or errors.

## Safety

The demo disclaimer must remain near the chat and in the footer. Emergency and
human escalation require calm, prominent framing. The UI must not claim a real
care outcome, diagnosis, treatment, appointment, callback, ticket, or emergency
contact unless confirmed by a successful backend action.

Update this file and `docs/architecture.md` when state ownership, import
boundaries, design conventions, or accessibility behavior change.