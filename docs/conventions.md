# Conventions

## General Principles

- Prefer the smallest change that preserves existing ownership boundaries.
- Keep public behavior explicit and typed.
- Use browser-native APIs when they are sufficient.
- Add a dependency only when it removes meaningful complexity or risk.
- Do not mix unrelated refactoring into feature work.
- Update documentation when behavior, contracts, or architecture change.

## TypeScript

- Keep strict TypeScript enabled.
- Do not introduce `any`; accept external values as `unknown` and validate them.
- Use interfaces for object contracts and string unions for closed domain values.
- Keep backend snake_case conversion in feature API modules. Components consume
  frontend camelCase models.
- Preserve exhaustiveness in error-kind and classification handling.
- Avoid one-letter names outside conventional short callback indexes.

## Source Ownership

```text
src/
├── app/                    Configuration and app-wide Query provider
├── features/
│   └── <feature>/
│       ├── api/            Endpoint calls and runtime validation
│       ├── components/     Feature presentation
│       ├── hooks/          State and request lifecycle
│       └── model/          Feature types and constants
├── shared/
│   ├── api/                Cross-feature HTTP and error primitives
│   ├── components/         Generic presentational primitives
│   ├── hooks/              Cross-feature browser behavior
│   ├── i18n/               Typed catalogs and locale context
│   └── lib/                Pure utilities
└── styles/                 Reset, tokens, globals, and CSS Modules
```

- A feature may import from `shared`.
- Shared code must not import from a feature.
- One feature must not import another feature's internal hook or API module.
- Compose features at `App.tsx`, a feature entry component, or another explicit
  common owner.
- Do not add barrel files unless they simplify a stable public boundary.

## API Code

- Route every HTTP call through `apiRequest`.
- Keep `fetch`, timeout, JSON parsing, and error-envelope behavior out of visual
  components.
- Give each endpoint an explicit feature-owned Zod schema.
- Reject malformed success responses instead of rendering partial data.
- Keep chat mutation retries intentional and user-triggered.
- Preserve request cancellation on unmount and conversation reset.
- User-facing errors must be safe, actionable, and must not reveal raw backend
  details.

## React And State

- Use function components and focused hooks.
- Keep server-derived health and document state in TanStack Query through their
  feature hooks.
- Use a no-retry Query mutation for chat while keeping the transcript in local
  React state.
- Keep chat history as local presentation state.
- Do not persist message content.
- Use refs for request locks and DOM behavior that should not trigger rendering.
- Avoid memoization by default; add it only after a demonstrated rendering issue.
- Keep effects limited to synchronization with browser or network systems.

## Components

- Components should have one clear visual or interaction responsibility.
- Prefer semantic elements: `button`, `form`, `header`, `main`, `aside`, `article`,
  `details`, and `summary`.
- Icon-only controls require an accessible name and, where useful, a tooltip.
- Never inject backend HTML. Render answer text and structured data as text.
- Keep source names and trace IDs inspectable without allowing them to break the
  layout.

## Localization

- Support exactly `es` and `en`; Spanish is the default after every reload.
- Keep locale in the app-wide localization provider and never persist it. The
  session ID remains the only `localStorage` value.
- Put frontend-owned text in the typed catalog under `src/shared/i18n`.
- Preserve user text and backend answer text exactly. Translate known machine-code
  labels, but keep unknown identifiers, source names, trace IDs, and structured
  result data unchanged.
- Capture locale when a chat operation begins. Retries keep that locale and each
  assistant message keeps the validated response locale.
- Keep English and Spanish safety/error wording behaviorally equivalent, including
  every non-confirmation statement.
- Synchronize document language and metadata, and set `lang` on historical answer
  text and its live announcement.

## Styling

- Reuse values from `tokens.css`; add a token when a value is genuinely shared.
- Use `ui.module.css` for scoped application styles and `global.css` only for
  document-level behavior.
- Keep card radii at 8px or below unless the design system changes deliberately.
- Do not scale font sizes directly with viewport width.
- Preserve stable control dimensions and practical 44px touch targets where
  space permits.
- Support widths from approximately 360px through large desktop screens.
- Respect `prefers-reduced-motion` and maintain visible keyboard focus.
- Avoid decorative gradients, effects, or animation that compete with workflow
  information.

## Accessibility

- Every input and actionable control needs an accessible name.
- Announce pending and copied states with live regions where visual feedback is
  insufficient.
- Maintain logical heading order and landmark structure.
- Ensure disclosures remain keyboard-operable through native `details/summary`.
- Do not communicate classification or health by color alone.
- Check text wrapping and overflow at narrow widths and zoomed layouts.

## Safety Language

- Preserve backend answer text exactly in the answer area.
- Add only product-safety framing, never clinical interpretation.
- Do not say or imply that a diagnosis is known.
- Do not recommend medication or treatment.
- Do not state that emergency services, a callback, an appointment, or a ticket
  were created unless backend action data confirms it.
- Examples and test fixtures must remain fictional and non-identifying.

## Testing And Quality

The required gate is:

```text
npm run lint
npm run format:check
npm run typecheck
npm run test:run
npm run build
```

- Use Vitest, React Testing Library, and user-event for behavior tests.
- Use MSW at the HTTP boundary; automated tests must not call the deployed API.
- Prefer accessible roles, labels, and visible behavior over implementation
  selectors or broad snapshots.
- Reset MSW handlers and browser state between tests.

## Documentation

- Contract changes require updates to `docs/api.md` and
  `.agent/context/backend.md`.
- Ownership or state changes require updates to `docs/architecture.md` and
  `.agent/context/frontend.md`.
- Infrastructure changes require updates to `docs/deployment.md` and
  `.agent/context/aws.md`.
- Test tooling changes require updates to `.agent/context/testing.md`, this file,
  and the quality-command section of `README.md`.
- Keep current implementation status separate from roadmap and backlog ideas.
