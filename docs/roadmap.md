# Roadmap

Roadmap items describe possible future work, not current capabilities. Promote an
item into `.agent/tasks/current.md` only when it has an accepted scope and clear
verification criteria.

## Current Baseline

- Responsive single-page chat workspace
- Typed configuration and shared request behavior
- Runtime validation for health, documents, and chat
- In-memory conversation and pseudonymous session behavior
- Classification, actions, sources, trace, and escalation presentation
- Safety, accessibility, timeout, cancellation, retry, and responsive states
- Maintainer and agent documentation

## Near-Term Quality

1. Add Vitest and React Testing Library with MSW-backed API tests.
2. Cover response validation, invalid JSON, timeout, abort, and safe error mapping.
3. Cover chat submission, metadata rendering, escalation, duplicate prevention,
   retry, and session reset.
4. Add dedicated `typecheck`, `test:run`, `format`, and `format:check` scripts.
5. Add CI for install, lint, formatting, type checking, tests, and build.
6. Add automated accessibility checks for the primary workflow.

## Deployment

1. Add frontend-only Terraform for private S3, CloudFront OAC, ACM, Route 53, and
   the constrained GitHub OIDC role.
2. Validate infrastructure without automatic apply.
3. Add artifact-based production deployment with scoped caching and invalidation.
4. Add a production smoke test and deployment summary.
5. Capture representative desktop and mobile screenshots after verified deploy.

## Product Enhancements

- Streaming responses
- Internationalization
- Improved tool-result summaries for known action types
- Optional explicit user controls for clearing copied trace feedback
- Playwright deployment checks
- Visual regression testing

## Explicitly Deferred

- Authentication and user accounts
- Persistent chat history
- Admin dashboard
- CRM record browser
- Document uploads
- WhatsApp integration
- Analytics and trackers
- A backend-for-frontend or second backend
- Server-side rendering

Each deferred feature requires a separate privacy, security, product, and
operational review before implementation.