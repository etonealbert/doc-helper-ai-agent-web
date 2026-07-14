# Current Milestone

## Frontend Release-Quality Baseline

Status: completed and locally verified on 2026-07-13.

The approved frontend milestone includes:

- TanStack Query ownership for health, documents, and chat mutation lifecycles;
- feature-owned Zod validation for every consumed endpoint;
- strict TypeScript, safe errors, cancellation, privacy, accessibility, and
  contrast repairs;
- Vitest, React Testing Library, user-event, and MSW coverage using fictional data;
- formatting, lint, type-check, test, and build scripts;
- pull-request and main-branch CI with a tested `dist` artifact;
- repair of the existing deployment workflow definition; and
- current architecture, API, testing, deployment, and maintainer documentation.

The milestone is a verified frontend code and workflow-definition baseline, not a
verified production release. No Terraform, AWS provisioning, DNS change, backend
CORS change, deployment, commit, or push is included.

All future infrastructure, release, and product work remains in
[backlog.md](backlog.md).
