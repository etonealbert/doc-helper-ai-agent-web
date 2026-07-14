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
verified production release. It did not include AWS provisioning, DNS change,
backend CORS change, deployment, commit, or push.

## Frontend Infrastructure Definition

Status: applied and infrastructure-verified in AWS account `964866958896` on
2026-07-14. Frontend assets have not been deployed.

The current infrastructure definition includes:

- an isolated frontend Terraform root for private S3, CloudFront OAC, ACM, Route
  53 apex/`www` aliases, and constrained GitHub deployment IAM;
- six non-sensitive outputs and non-secret example variable values;
- a fail-closed PowerShell audit that allows only expected managed types and exact
  `create` or `no-op` action arrays while ignoring data reads;
- fictional safe and unsafe JSON fixtures for static audit tests;
- a backendless, credential-free Terraform validation workflow definition; and
- operations, cost, cache, teardown, deployment-boundary, and agent documentation.

The audited apply created 20 resources with 0 changes and 0 destroys. A subsequent
refresh plan reported no changes. Verified outputs are:

- frontend bucket: `albertlukmanovlabs-lol-frontend-964866958896`;
- CloudFront distribution: `EQ5KB7W9TDHZP` at
  `d3oa6c7grsn1bd.cloudfront.net`;
- certificate:
  `arn:aws:acm:us-east-1:964866958896:certificate/e68688b4-8491-4f65-af46-9179b1591ba3`;
- deployment role:
  `arn:aws:iam::964866958896:role/DocHelperFrontendGitHubDeployRole`; and
- frontend URL: `https://albertlukmanovlabs.lol`.

S3 privacy, encryption, versioning, ownership, the OAC-only bucket policy,
CloudFront aliases and controls, ACM issuance, Route 53 A/AAAA aliases, and GitHub
OIDC trust/policy scope were checked with read-only AWS calls. The empty origin
returns an expected `403`. GitHub environment setup, frontend deployment, backend
CORS coordination, and production smoke testing remain in
[backlog.md](backlog.md).
