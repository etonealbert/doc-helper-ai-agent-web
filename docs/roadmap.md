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
- TanStack Query server-state ownership and Zod endpoint schemas
- Vitest, React Testing Library, user-event, and MSW behavioral coverage
- Formatting, lint, strict type-checking, tests, and production build commands
- Pull-request and main-branch CI with a tested build artifact
- A separate deployment workflow definition that has not been run or verified
- Frontend-only Terraform definitions, create-only plan audit, fictional audit
  fixtures, and a backendless validation workflow definition
- Provisioned and infrastructure-verified private S3, CloudFront OAC, ACM,
  Route 53 apex/`www` aliases, and constrained GitHub OIDC deployment role

## Quality Follow-Up

- Add automated accessibility checks for the primary workflow.
- Add browser-level regression coverage where unit and component tests are
  insufficient.

## Deployment

1. Update and verify the backend CORS allowlist in the backend repository.
2. Configure the GitHub production environment from successful Terraform outputs,
   run the existing deployment
   workflow, and verify the intended frontend URL.
3. Capture representative fictional desktop and mobile screenshots after a
   verified deployment.

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
