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

## Quality Follow-Up

- Add automated accessibility checks for the primary workflow.
- Add browser-level regression coverage where unit and component tests are
  insufficient.

## Deployment

1. Add separately authorized frontend Terraform for private S3, CloudFront OAC,
   ACM, Route 53, and a constrained GitHub OIDC role.
2. Provision and verify AWS resources without automatic pull-request apply.
3. Create and verify apex DNS records in the owning system.
4. Update and verify the backend CORS allowlist in the backend repository.
5. Configure the GitHub production environment, run the existing deployment
   workflow, and verify the intended frontend URL.
6. Capture representative fictional desktop and mobile screenshots after a
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
