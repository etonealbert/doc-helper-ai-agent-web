# Frontend Terraform

This root defines the AWS infrastructure for the Doc Helper AI Agent portfolio
frontend. It owns a private S3 origin, CloudFront distribution and policies, ACM
certificate validation, apex and optional `www` Route 53 aliases, and a constrained
GitHub OIDC deployment role. It does not own or modify the independently deployed
backend at `api.albertlukmanovlabs.lol`.

## Current Status

The Terraform stack was applied and infrastructure-verified in AWS account
`964866958896` on 2026-07-14. The audited plan created 20 resources with 0 changes
and 0 destroys, and a subsequent refresh plan reported no changes. S3 controls,
CloudFront, ACM, Route 53, and IAM scope were checked with read-only AWS calls.
Frontend assets were not deployed, so both frontend hostnames currently return an
expected `403` from the empty private origin. Do not present the application as
live until deployment, backend CORS, and production smoke testing succeed.

Provisioned outputs:

| Output                           | Value                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `frontend_bucket_name`           | `albertlukmanovlabs-lol-frontend-964866958896`                                        |
| `cloudfront_distribution_id`     | `EQ5KB7W9TDHZP`                                                                       |
| `cloudfront_distribution_domain` | `d3oa6c7grsn1bd.cloudfront.net`                                                       |
| `frontend_url`                   | `https://albertlukmanovlabs.lol`                                                      |
| `github_deploy_role_arn`         | `arn:aws:iam::964866958896:role/DocHelperFrontendGitHubDeployRole`                    |
| `certificate_arn`                | `arn:aws:acm:us-east-1:964866958896:certificate/e68688b4-8491-4f65-af46-9179b1591ba3` |

## Preconditions

- Terraform `1.10.5` (the configuration accepts `>= 1.10, < 2.0`)
- AWS CLI credentials for account `964866958896` for AWS-backed operations
- Access to the existing S3 state bucket, public Route 53 zone, and GitHub OIDC
  provider described in `backend.tf` and `variables.tf`
- A reviewed and committed `.terraform.lock.hcl` before readonly initialization

`terraform.tfvars.example` records the non-secret expected inputs. The checked-in
defaults already use those values. Do not put credentials or other secrets in a
Terraform variable file.

## Static Validation

The audit tests use only fictional JSON fixtures and make no network calls. The
runner is compatible with Windows PowerShell 5.1 and PowerShell Core:

```powershell
powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "infra/terraform/tests/Assert-FrontendPlan.Tests.ps1"
terraform fmt -check -recursive infra/terraform
```

After the provider lockfile has been generated and checked in, backendless
initialization and validation require no AWS credentials:

```powershell
terraform -chdir=infra/terraform init -backend=false -input=false -lockfile=readonly
terraform -chdir=infra/terraform validate
```

`.github/workflows/terraform.yml` runs the audit suite with `shell: pwsh` before
those Terraform checks for relevant pull requests and pushes to `main`. It has only
`contents: read`; it receives no OIDC permission or AWS credentials and does not
plan or apply.

## Saved Plan And Audit

AWS-backed commands require separate authorization. Immediately before them,
verify that the active identity belongs to the expected account:

```powershell
$identity = aws sts get-caller-identity | ConvertFrom-Json
if ($identity.Account -ne "964866958896") {
  throw "Refusing Terraform operations in AWS account $($identity.Account)."
}
```

Initialize the isolated production state, create one saved plan, inspect its human
form, and export its machine-readable form:

```powershell
terraform -chdir=infra/terraform init -reconfigure -input=false
terraform -chdir=infra/terraform plan -input=false -out=frontend.tfplan
terraform -chdir=infra/terraform show -no-color frontend.tfplan
terraform -chdir=infra/terraform show -json frontend.tfplan | Set-Content -LiteralPath "infra/terraform/frontend.tfplan.json" -Encoding utf8
powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "infra/terraform/scripts/Assert-FrontendPlan.ps1" -PlanJsonPath "infra/terraform/frontend.tfplan.json"
```

The audit validates the plan root, every resource-change object, scalar string
`mode`/`address`/`type` fields, change objects, and one-element scalar string action
arrays before comparison. It then ignores structurally valid data-source reads.
For managed resources it accepts only the explicit frontend resource-type
allowlist and action arrays exactly equal to `["create"]` or `["no-op"]`. It fails
on malformed or missing fields, coercible arrays/numbers/nulls, nested arrays,
unexpected modes or types, updates, deletes, replacements, and every other action
combination. Each approved managed address and action is printed for human review.

The script is a guard, not a substitute for reviewing names, IAM documents, DNS
records, and the complete human-readable plan. Stop if anything references backend
infrastructure or differs from the reviewed design.

Apply only the exact saved plan that passed both automated and human review:

```powershell
terraform -chdir=infra/terraform apply -input=false frontend.tfplan
terraform -chdir=infra/terraform output
terraform -chdir=infra/terraform output -json
```

Do not regenerate the plan between audit and apply. Local working directories,
state and state-lock artifacts, saved plans, and plan JSON are ignored at both
repository root and Terraform-root levels. The provider dependency lockfile
`.terraform.lock.hcl` is intentionally not ignored and must be reviewed and
committed when generated in the separately scoped initialization task.

## Outputs And GitHub Environment

After a successful apply, configure these non-secret GitHub `production`
environment variables from Terraform outputs and fixed configuration:

| GitHub variable              | Source                               |
| ---------------------------- | ------------------------------------ |
| `AWS_REGION`                 | `us-east-1`                          |
| `AWS_ROLE_ARN`               | `github_deploy_role_arn`             |
| `FRONTEND_BUCKET_NAME`       | `frontend_bucket_name`               |
| `CLOUDFRONT_DISTRIBUTION_ID` | `cloudfront_distribution_id`         |
| `FRONTEND_URL`               | `frontend_url`                       |
| `VITE_API_BASE_URL`          | `https://api.albertlukmanovlabs.lol` |

`cloudfront_distribution_domain` and `certificate_arn` support infrastructure
verification but are not required by the deployment workflow. Environment
protection and values must be configured and verified separately; Terraform apply
does not deploy frontend assets or run that workflow.

## Caching And Cost

The distribution cache policy permits origin metadata from the deployment
workflow within TTL bounds of 0 to 31,536,000 seconds. The deployment contract is:

- `dist/assets/*`: `public,max-age=31536000,immutable`
- `index.html`: `no-cache,no-store,must-revalidate`
- other public files: `public,max-age=300`
- invalidations: `/` and `/index.html` only

S3 storage and requests, CloudFront transfer/requests/invalidations, and Route 53
hosted-zone/query usage can incur charges. The ACM public certificate itself has no
additional charge while used with supported AWS services. `PriceClass_100` limits
CloudFront edge locations for cost control; actual cost still depends on traffic
and retained S3 object versions.

## Destruction

The frontend bucket has `prevent_destroy = true`. Routine plans must retain this
guard, and the create-only audit intentionally rejects every deletion or
replacement. Teardown therefore requires separate explicit authorization and a
dedicated review outside the normal create-only procedure.

For deliberate teardown, first preserve any required state or objects, disable
the deployment workflow, account for versioned bucket contents, and review DNS,
certificate, CloudFront, IAM, and S3 removal order. Removing `prevent_destroy` is a
reviewed code change, not a command-line bypass. Generate and inspect a dedicated
destruction plan and verify it affects only this frontend stack before executing
it. Never use the create-only audit result as approval for teardown.

Backend CORS remains independently owned. Infrastructure creation, GitHub
environment configuration, frontend asset deployment, backend CORS changes, and
production smoke testing are distinct actions with distinct authorization and
verification.
