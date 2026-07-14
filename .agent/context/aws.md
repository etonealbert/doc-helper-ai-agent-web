# AWS Context

Load this context before adding or reviewing infrastructure, CI deployment, DNS,
certificates, caching, IAM, or production smoke tests.

Detailed deployment contract: [../../docs/deployment.md](../../docs/deployment.md)

## Current Boundary

Frontend-only Terraform exists under `infra/terraform`, together with a
backendless validation workflow and a create-only plan-audit script. The
configuration was applied and infrastructure-verified in AWS account
`964866958896` on 2026-07-14. It provisioned the private frontend origin,
CloudFront distribution, certificate, apex/`www` DNS aliases, and constrained
GitHub deployment role. No frontend assets were deployed, and production browser
behavior remains unverified. Do not run further AWS-backed Terraform operations,
deploy, commit, push, or edit the backend without explicit authorization.

## Target Topology

```text
Route 53 apex A/AAAA aliases
  -> CloudFront distribution
     -> Origin Access Control
        -> Private S3 REST origin

Browser
  -> HTTPS https://api.albertlukmanovlabs.lol
```

Requirements:

- private S3 bucket with Block Public Access, encryption, and versioning;
- no S3 website hosting;
- CloudFront OAC restricted bucket policy;
- ACM certificate in `us-east-1`;
- apex domain and optional `www` aliases;
- HTTPS redirect, compression, security headers, HTTP/2 and HTTP/3;
- `index.html` default root;
- `403` and `404` SPA fallback to `/index.html` with response `200`.

## Terraform Ownership

The frontend stack belongs in `infra/terraform`. It uses the existing state bucket
and the separate key:

```text
s3://albertlukmanovlabs-terraform-state-964866958896/doc-helper-ai-agent-web/prod/terraform.tfstate
```

Infrastructure validation may format, initialize without the production backend,
run the fictional plan-audit tests, and validate. Pull-request automation has only
`contents: read`; it must not receive AWS credentials or OIDC permission and must
not plan or apply infrastructure.

`infra/terraform/scripts/Assert-FrontendPlan.ps1` ignores data reads and permits
only explicitly allowlisted managed frontend types whose action array is exactly
`create` or `no-op`. It must fail on malformed input, unexpected modes/types,
updates, deletes, replacements, and all other action arrays. Apply only the exact
saved plan after this audit and complete human review.

The six outputs are non-sensitive deployment and verification values. Current
provisioned values are recorded in `.agent/tasks/current.md`; read them from
Terraform again before configuring or running a deployment.

## Deployment Identity

Use a frontend-specific GitHub OIDC role restricted to:

```text
repo:etonealbert/doc-helper-ai-agent-web:environment:production
```

Grant only frontend bucket deployment and CloudFront invalidation permissions.
Do not grant ECS, ECR, DynamoDB, broad IAM, Route 53 mutation, or backend role
permissions. Do not store long-lived access keys.

## Cache Strategy

- `dist/assets/*`: `public,max-age=31536000,immutable`
- `index.html`: `no-cache,no-store,must-revalidate`
- other public files: short cache, approximately 300 seconds
- invalidations: `/` and `/index.html` only

Deploy the exact artifact that passed quality checks and wait for invalidation
completion before smoke testing.

Both deployment-workflow jobs reference the GitHub `production` environment.
Environment protection can therefore require approval before the quality job
builds with environment-scoped `VITE_API_BASE_URL`, and again when the dependent
deploy job becomes eligible. Only the deploy job grants `id-token: write`; the
quality/build job remains without OIDC permission.

## Required Backend Coordination

The backend CORS allowlist must include the apex and optional `www` frontend
origins. This repository documents that requirement but does not own the backend
change.

Update this file and `docs/deployment.md` together when infrastructure or release
behavior changes.
