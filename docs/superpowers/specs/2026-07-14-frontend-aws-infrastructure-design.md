# Frontend AWS Infrastructure Design

## Goal

Create, validate, plan, and apply an isolated Terraform stack for the Doc Helper
AI Agent static frontend at `https://albertlukmanovlabs.lol`, with
`https://www.albertlukmanovlabs.lol` included as an alias. The existing backend at
`https://api.albertlukmanovlabs.lol` remains independently owned and unchanged.

## Authorization And Boundaries

The user authorized:

- installation of Terraform 1.10.x through Windows Package Manager;
- creation of frontend Terraform and validation automation;
- AWS-backed Terraform initialization, planning, plan inspection, and application;
- creation of the resources explicitly listed in this design;
- post-apply output and endpoint verification.

This work must not modify the backend repository or its ECS, ECR, DynamoDB,
networking, IAM roles, API DNS records, or Terraform state. It must not deploy
frontend assets, change backend CORS, commit, or push unless separately requested.

## Stack Isolation

Terraform lives at `infra/terraform` in the frontend repository. It uses the
existing remote-state bucket with a frontend-specific state object:

```text
s3://albertlukmanovlabs-terraform-state-964866958896/doc-helper-ai-agent-web/prod/terraform.tfstate
```

The stack uses Terraform `>= 1.10, < 2.0`, AWS provider `~> 6.0`, and AWS region
`us-east-1`, matching the established backend Terraform conventions. It reads but
does not own:

- the public Route 53 zone `albertlukmanovlabs.lol`;
- AWS account identity `964866958896`;
- the existing GitHub OIDC provider for `token.actions.githubusercontent.com`.

No shared module or state dependency is introduced between frontend and backend.

## S3 Origin

The frontend bucket name is deterministic and account-qualified for global
uniqueness. It contains only frontend deployment objects and has:

- S3 Block Public Access enabled in all four modes;
- no website-hosting configuration;
- AES-256 default server-side encryption;
- versioning enabled;
- bucket-owner-enforced object ownership;
- a lifecycle `prevent_destroy` guard;
- project, environment, and Terraform-management tags.

The bucket policy grants `s3:GetObject` only to the CloudFront service principal
when `AWS:SourceArn` equals this stack's CloudFront distribution ARN. No public or
cross-account read is allowed.

## Certificate And DNS

ACM creates a DNS-validated certificate in `us-east-1` with:

- primary name `albertlukmanovlabs.lol`;
- subject alternative name `www.albertlukmanovlabs.lol`;
- create-before-destroy lifecycle behavior.

Terraform creates Route 53 validation records from ACM domain validation options
and waits for certificate validation. It then creates A and AAAA alias records for
both apex and `www`, targeting the CloudFront distribution. Existing
`api.albertlukmanovlabs.lol` records are never addressed by the configuration.

## CloudFront Distribution

CloudFront uses the private S3 REST endpoint through Origin Access Control with
SigV4 signing set to `always`. Distribution behavior includes:

- aliases for apex and `www`;
- default root object `index.html`;
- viewer protocol redirect from HTTP to HTTPS;
- TLS certificate from ACM with SNI-only support and TLS 1.2 minimum;
- IPv6 enabled;
- HTTP/2 and HTTP/3;
- compression enabled;
- `PriceClass_100` for cost control;
- only `GET` and `HEAD` viewer methods, with no `OPTIONS` static preflight behavior;
- no cookies, query strings, or viewer headers forwarded to the origin;
- a custom cache policy with minimum TTL 0, default TTL 300 seconds, and maximum
  TTL 31,536,000 seconds so origin `Cache-Control` metadata from the deployment
  workflow remains authoritative within safe bounds;
- custom errors mapping origin 403 and 404 to `/index.html` with HTTP 200 and zero
  error-cache TTL.

The distribution depends on certificate validation and uses the OAC-qualified
bucket policy.

## Security Headers

A dedicated CloudFront response-headers policy supplies:

- HTTP Strict Transport Security without preload;
- `X-Content-Type-Options: nosniff`;
- frame protection;
- a strict referrer policy;
- a restrictive permissions policy;
- a Content Security Policy allowing assets from the frontend origin, API
  connections to `https://api.albertlukmanovlabs.lol`, data-image URLs, and the
  inline element styling required by the current textarea auto-resize behavior.

The policy does not introduce medical or application behavior and can be reviewed
independently from the distribution.

## GitHub Deployment Identity

Terraform creates a dedicated frontend role trusted only through the existing
GitHub OIDC provider when both conditions match:

```text
aud = sts.amazonaws.com
sub = repo:etonealbert/doc-helper-ai-agent-web:environment:production
```

The inline deployment policy grants only:

- `s3:GetBucketLocation` and `s3:ListBucket` on the frontend bucket;
- object read, upload, and deletion required by `aws s3 sync` under the frontend
  bucket;
- CloudFront invalidation creation and invalidation status reads for this one
  distribution.

The role receives no ECS, ECR, DynamoDB, Route 53, IAM mutation, broad CloudFront,
or backend deployment permissions. No long-lived AWS keys are created.

## Files And Outputs

The root contains focused files for backend configuration, provider/version
constraints, variables, data sources, S3, ACM, CloudFront, Route 53, IAM, outputs,
example values, and maintainer instructions. A Terraform validation workflow runs
formatting, backendless initialization with the committed lockfile, and validation
without applying.

Required outputs are:

- `frontend_bucket_name`;
- `cloudfront_distribution_id`;
- `cloudfront_distribution_domain`;
- `frontend_url`;
- `github_deploy_role_arn`;
- `certificate_arn`.

## Plan And Apply Procedure

Execution is intentionally staged:

1. Install Terraform and verify its version.
2. Format the stack and initialize without the production backend to generate and
   verify the provider lockfile.
3. Run `terraform fmt -check -recursive` and `terraform validate`.
4. Verify AWS credentials resolve to account `964866958896` before remote-state or
   apply operations.
5. Initialize the configured S3 backend.
6. Create the saved plan `frontend.tfplan`.
7. Inspect both human-readable and JSON plan output.
8. Reject the plan if it contains deletion, replacement, unexpected updates, or
   any resource outside frontend S3, CloudFront, ACM validation, apex/`www` Route
   53 records, and frontend IAM.
9. Apply only the reviewed saved plan.
10. Read all required outputs and verify DNS/CloudFront availability without
    claiming the frontend application is deployed.

Certificate validation and CloudFront creation may take several minutes. The
saved plan and generated local Terraform working directory remain untracked.

## Post-Apply Work

After apply, Terraform outputs provide the non-secret GitHub `production`
environment values for the existing deployment workflow. Frontend asset deployment
is a separate authorized action. Backend CORS must still allow apex and `www`
before browser integration can succeed.

## Acceptance Criteria

- Backendless Terraform formatting, initialization, and validation pass.
- The reviewed AWS plan contains only expected frontend resources and data reads.
- Applying the saved plan succeeds without backend-resource changes.
- All six required outputs are available.
- The bucket is private and CloudFront uses OAC.
- Apex and `www` A/AAAA aliases target CloudFront.
- The GitHub role trust and policy match the exact least-privilege design.
- No backend, deployment, commit, push, or frontend asset upload occurs.
