# Frontend AWS Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create, validate, audit, and apply an isolated Terraform stack for the private S3 and CloudFront frontend at `albertlukmanovlabs.lol` and `www.albertlukmanovlabs.lol`.

**Architecture:** A single Terraform root under `infra/terraform` owns only frontend S3, ACM, CloudFront, Route 53 aliases/validation records, and a least-privilege GitHub OIDC deployment role. It reads the existing hosted zone, AWS identity, and OIDC provider, and stores state in a frontend-specific object in the existing state bucket. Application deployment remains a separate workflow action after infrastructure apply.

**Tech Stack:** Terraform 1.10.5, HashiCorp AWS provider `~> 6.0`, AWS `us-east-1`, S3, ACM, CloudFront OAC, Route 53, IAM OIDC, GitHub Actions, and PowerShell plan auditing.

## Global Constraints

- Remote state bucket: `albertlukmanovlabs-terraform-state-964866958896`.
- Remote state key: `doc-helper-ai-agent-web/prod/terraform.tfstate`.
- Expected AWS account: `964866958896`.
- Apex domain: `albertlukmanovlabs.lol`.
- WWW alias: `www.albertlukmanovlabs.lol`.
- Existing API remains `https://api.albertlukmanovlabs.lol` and must not be modified.
- GitHub trust subject must be exactly `repo:etonealbert/doc-helper-ai-agent-web:environment:production`.
- Tags must include `Project=doc-helper-ai-agent-web`, `Environment=production`, and `ManagedBy=terraform`.
- Do not create public S3 website hosting, Lambda, ECS, ECR, DynamoDB, API Gateway, ALB, NAT Gateway, or CloudFront Functions.
- Do not edit the backend repository or its Terraform/state/resources.
- Do not deploy frontend assets, change backend CORS, commit, or push.
- Apply only the reviewed saved plan after verifying account ID, allowed resource types, and create-only actions.
- Stop before apply if the plan contains delete, replacement, unexpected update, or any backend-related resource.

## File Structure

```text
infra/terraform/
|-- .gitignore                         Local Terraform artifacts
|-- .terraform.lock.hcl                Locked AWS provider checksums
|-- README.md                          Operations and teardown guidance
|-- backend.tf                         Existing S3 backend and isolated key
|-- versions.tf                        Terraform and provider constraints
|-- providers.tf                       us-east-1 provider and default tags
|-- variables.tf                       Domain, GitHub, and region inputs
|-- data.tf                            Account, hosted zone, and OIDC lookups
|-- locals.tf                          Names, domains, tags, CSP, origin ID
|-- s3.tf                              Private encrypted versioned origin
|-- acm.tf                             Certificate and DNS validation records
|-- cloudfront.tf                      OAC, policies, distribution, bucket policy
|-- route53.tf                         Apex and www A/AAAA aliases
|-- iam.tf                             OIDC trust and deployment policy
|-- outputs.tf                         Six required deployment outputs
|-- terraform.tfvars.example           Non-secret example overrides
`-- scripts/
    `-- Assert-FrontendPlan.ps1         Saved-plan blast-radius audit

.github/workflows/terraform.yml        Backendless format/init/validate workflow
```

---

### Task 1: Install Terraform And Verify AWS Preconditions

**Files:**

- No repository files changed

**Interfaces:**

- Produces: Terraform CLI `1.10.5` available on `PATH`.
- Produces: verified AWS caller account `964866958896` before remote-state access.

- [ ] **Step 1: Verify package manager and AWS CLI availability**

Run:

```powershell
winget --version
aws --version
```

Expected: both commands exit `0`. If AWS CLI is absent, stop and request separate
installation authorization rather than substituting credentials tooling.

- [ ] **Step 2: Install Terraform 1.10.5**

Run:

```powershell
winget install --id Hashicorp.Terraform --version 1.10.5 --exact --accept-package-agreements --accept-source-agreements
```

Open a fresh process environment if required, then run:

```powershell
terraform version
```

Expected: `Terraform v1.10.5` for `windows_amd64`.

- [ ] **Step 3: Verify AWS caller identity**

Run:

```powershell
$identity = aws sts get-caller-identity | ConvertFrom-Json
$identity | ConvertTo-Json
if ($identity.Account -ne "964866958896") {
  throw "Refusing Terraform operations in AWS account $($identity.Account)."
}
```

Expected: account `964866958896`. Stop on expired credentials, access denial, or
any other account.

---

### Task 2: Create The Terraform Foundation And Private S3 Origin

**Files:**

- Create: `infra/terraform/.gitignore`
- Create: `infra/terraform/backend.tf`
- Create: `infra/terraform/versions.tf`
- Create: `infra/terraform/providers.tf`
- Create: `infra/terraform/variables.tf`
- Create: `infra/terraform/data.tf`
- Create: `infra/terraform/locals.tf`
- Create: `infra/terraform/s3.tf`

**Interfaces:**

- Produces: `local.domain_names`, `local.frontend_bucket_name`, `local.common_tags`, and `aws_s3_bucket.frontend`.
- Consumes: existing account, hosted zone, and GitHub OIDC provider as data only.

- [ ] **Step 1: Protect local Terraform artifacts**

Create `infra/terraform/.gitignore`:

```gitignore
.terraform/
*.tfplan
*.tfplan.json
crash.log
crash.*.log
override.tf
override.tf.json
*_override.tf
*_override.tf.json
```

- [ ] **Step 2: Configure versions and remote state**

Create `versions.tf`:

```hcl
terraform {
  required_version = ">= 1.10, < 2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
```

Create `backend.tf`:

```hcl
terraform {
  backend "s3" {
    bucket       = "albertlukmanovlabs-terraform-state-964866958896"
    key          = "doc-helper-ai-agent-web/prod/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
```

- [ ] **Step 3: Define validated inputs and provider**

Create variables for `aws_region`, `domain_name`, `include_www`,
`github_oidc_provider_arn`, and `github_repository`. Defaults must be:

```hcl
aws_region                  = "us-east-1"
domain_name                 = "albertlukmanovlabs.lol"
include_www                 = true
github_oidc_provider_arn    = "arn:aws:iam::964866958896:oidc-provider/token.actions.githubusercontent.com"
github_repository           = "etonealbert/doc-helper-ai-agent-web"
```

Validate `aws_region == "us-east-1"`, the domain is the expected apex, the OIDC
ARN belongs to account `964866958896`, and the repository has `owner/name` form.

Create `providers.tf`:

```hcl
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}
```

- [ ] **Step 4: Add existing-resource lookups and locals**

Create `data.tf`:

```hcl
data "aws_caller_identity" "current" {}

data "aws_route53_zone" "main" {
  name         = "${var.domain_name}."
  private_zone = false
}

data "aws_iam_openid_connect_provider" "github" {
  arn = var.github_oidc_provider_arn
}
```

Create locals that resolve:

```hcl
www_domain           = "www.${var.domain_name}"
domain_names         = var.include_www ? [var.domain_name, local.www_domain] : [var.domain_name]
frontend_bucket_name = "${replace(var.domain_name, ".", "-")}-frontend-${data.aws_caller_identity.current.account_id}"
origin_id            = "frontend-s3-origin"
common_tags = {
  Project     = "doc-helper-ai-agent-web"
  Environment = "production"
  ManagedBy   = "terraform"
}
```

- [ ] **Step 5: Create the private origin bucket**

Create `s3.tf` with these resources:

```hcl
resource "aws_s3_bucket" "frontend" {
  bucket = local.frontend_bucket_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}
```

Do not add website configuration or public ACL/policy resources.

---

### Task 3: Add ACM, CloudFront OAC, Security, Caching, And DNS

**Files:**

- Create: `infra/terraform/acm.tf`
- Create: `infra/terraform/cloudfront.tf`
- Create: `infra/terraform/route53.tf`

**Interfaces:**

- Consumes: `local.domain_names`, `local.origin_id`, `aws_s3_bucket.frontend`, and `data.aws_route53_zone.main`.
- Produces: validated ACM certificate and `aws_cloudfront_distribution.frontend`.

- [ ] **Step 1: Create and validate the certificate**

Create `acm.tf` with:

```hcl
resource "aws_acm_certificate" "frontend" {
  domain_name               = var.domain_name
  subject_alternative_names = var.include_www ? [local.www_domain] : []
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "certificate_validation" {
  for_each = {
    for option in aws_acm_certificate.frontend.domain_validation_options :
    option.domain_name => {
      name   = option.resource_record_name
      record = option.resource_record_value
      type   = option.resource_record_type
    }
  }

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "frontend" {
  certificate_arn         = aws_acm_certificate.frontend.arn
  validation_record_fqdns = [for record in aws_route53_record.certificate_validation : record.fqdn]
}
```

- [ ] **Step 2: Create OAC and cache policy**

Create a CloudFront OAC with origin type `s3`, signing behavior `always`, and
protocol `sigv4`. Create a cache policy with:

```hcl
min_ttl     = 0
default_ttl = 300
max_ttl     = 31536000
```

Enable gzip and Brotli cache keys, and set cookies, headers, and query strings to
`none`.

- [ ] **Step 3: Create the response-headers policy**

Create a custom response-headers policy containing:

```text
Content-Security-Policy:
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.albertlukmanovlabs.lol;
object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self';
upgrade-insecure-requests

Permissions-Policy:
camera=(), geolocation=(), microphone=(), payment=(), usb=()
```

Also configure HSTS for `63072000` seconds with subdomains and no preload,
`nosniff`, `DENY` framing, and `strict-origin-when-cross-origin` referrer policy.

- [ ] **Step 4: Create the CloudFront distribution**

The distribution must use:

```hcl
enabled             = true
is_ipv6_enabled     = true
default_root_object = "index.html"
aliases             = local.domain_names
price_class         = "PriceClass_100"
http_version        = "http2and3"
wait_for_deployment = true
```

The S3 REST origin uses OAC and `aws_s3_bucket.frontend.bucket_regional_domain_name`.
The default behavior allows and caches exactly `GET` and `HEAD`, with no `OPTIONS`
static preflight behavior. It redirects HTTP to HTTPS, compresses responses, and
attaches the custom cache and response-header policies. Geo restrictions are
`none`. The viewer certificate uses the validated ACM ARN, `sni-only`, and
`TLSv1.2_2021`.

Add both fallback blocks:

```hcl
custom_error_response {
  error_code            = 403
  response_code         = 200
  response_page_path    = "/index.html"
  error_caching_min_ttl = 0
}

custom_error_response {
  error_code            = 404
  response_code         = 200
  response_page_path    = "/index.html"
  error_caching_min_ttl = 0
}
```

- [ ] **Step 5: Restrict S3 reads to this distribution**

Create an `aws_iam_policy_document` and `aws_s3_bucket_policy` granting only
`s3:GetObject` to principal `cloudfront.amazonaws.com`, resource
`${aws_s3_bucket.frontend.arn}/*`, with `StringEquals` on `AWS:SourceArn` equal to
`aws_cloudfront_distribution.frontend.arn`.

- [ ] **Step 6: Create apex and www aliases**

Create A and AAAA `aws_route53_record` resources using
`for_each = toset(local.domain_names)`. Each alias targets the distribution domain
and hosted zone ID with `evaluate_target_health = false`. Do not create or select
records for `api.${var.domain_name}`.

---

### Task 4: Add Least-Privilege GitHub OIDC Deployment IAM

**Files:**

- Create: `infra/terraform/iam.tf`

**Interfaces:**

- Consumes: existing OIDC provider, frontend bucket, distribution, account ID.
- Produces: `aws_iam_role.github_deploy` and its inline policy.

- [ ] **Step 1: Create exact OIDC trust**

Create an assume-role document allowing only `sts:AssumeRoleWithWebIdentity` from
the existing provider with:

```hcl
condition {
  test     = "StringEquals"
  variable = "token.actions.githubusercontent.com:aud"
  values   = ["sts.amazonaws.com"]
}

condition {
  test     = "StringEquals"
  variable = "token.actions.githubusercontent.com:sub"
  values   = ["repo:${var.github_repository}:environment:production"]
}
```

Create role `DocHelperFrontendGitHubDeployRole` with session duration 3600.

- [ ] **Step 2: Add bucket deployment permissions**

Grant bucket-level `s3:GetBucketLocation` and `s3:ListBucket` only on the frontend
bucket ARN. Grant `s3:GetObject`, `s3:PutObject`, and `s3:DeleteObject` only on the
frontend object ARN.

- [ ] **Step 3: Add invalidation permissions**

Grant only `cloudfront:CreateInvalidation` and `cloudfront:GetInvalidation` on
`aws_cloudfront_distribution.frontend.arn`. Attach the document as an inline role
policy named `DocHelperFrontendDeploy`.

Search `iam.tf` and the rendered plan to confirm no ECS, ECR, DynamoDB, Route 53,
IAM mutation, wildcard resource, or wildcard action permission exists.

---

### Task 5: Add Outputs, Plan Audit, Validation Workflow, And Documentation

**Files:**

- Create: `infra/terraform/outputs.tf`
- Create: `infra/terraform/terraform.tfvars.example`
- Create: `infra/terraform/scripts/Assert-FrontendPlan.ps1`
- Create: `infra/terraform/README.md`
- Create: `.github/workflows/terraform.yml`
- Modify: `docs/deployment.md`
- Modify: `.agent/context/aws.md`
- Modify: `.agent/tasks/current.md`
- Modify: `.agent/tasks/backlog.md`
- Modify: `docs/roadmap.md`
- Modify: `AGENTS.md`
- Modify: root `.gitignore`

**Interfaces:**

- Produces: six required Terraform outputs.
- Produces: deterministic create-only plan audit before apply.
- Produces: backendless CI validation with no AWS credentials.

- [ ] **Step 1: Add required outputs**

Create outputs for:

```hcl
frontend_bucket_name          = aws_s3_bucket.frontend.id
cloudfront_distribution_id    = aws_cloudfront_distribution.frontend.id
cloudfront_distribution_domain = aws_cloudfront_distribution.frontend.domain_name
frontend_url                  = "https://${var.domain_name}"
github_deploy_role_arn        = aws_iam_role.github_deploy.arn
certificate_arn               = aws_acm_certificate_validation.frontend.certificate_arn
```

Each output must have a clear description and must not be marked sensitive.

- [ ] **Step 2: Add the plan assertion script**

`Assert-FrontendPlan.ps1` accepts a required plan JSON path, parses
`resource_changes`, ignores data sources, and permits only these managed types:

```text
aws_s3_bucket
aws_s3_bucket_public_access_block
aws_s3_bucket_ownership_controls
aws_s3_bucket_server_side_encryption_configuration
aws_s3_bucket_versioning
aws_s3_bucket_policy
aws_acm_certificate
aws_acm_certificate_validation
aws_route53_record
aws_cloudfront_origin_access_control
aws_cloudfront_cache_policy
aws_cloudfront_response_headers_policy
aws_cloudfront_distribution
aws_iam_role
aws_iam_role_policy
```

Require every managed action list to be exactly `create` or `no-op`. Reject delete,
update, replace combinations, and unexpected types with a nonzero exit. Print each
approved resource address/action for human review.

- [ ] **Step 3: Add backendless Terraform CI**

Create `.github/workflows/terraform.yml` triggered for Terraform path changes on
pull requests and `main`, with `contents: read`, concurrency cancellation,
Terraform `1.10.5`, then:

```text
terraform fmt -check -recursive infra/terraform
terraform -chdir=infra/terraform init -backend=false -input=false -lockfile=readonly
terraform -chdir=infra/terraform validate
```

Do not grant OIDC or run plan/apply in CI.

- [ ] **Step 4: Document operations and current boundaries**

Document initialization, validation, saved plan, JSON audit, apply, outputs,
GitHub environment values, cache behavior, cost notes, `prevent_destroy`, and
deliberate teardown. Update current docs to say Terraform code exists; only after
successful apply state that resources are provisioned. Keep frontend deployment
and backend CORS explicitly separate.

Add root ignore entries for `.terraform/`, `*.tfplan`, and `*.tfplan.json` without
removing existing patterns.

---

### Task 6: Initialize And Validate Without The Production Backend

**Files:**

- Create through Terraform: `infra/terraform/.terraform.lock.hcl`

**Interfaces:**

- Produces: a committed-ready provider lockfile and validated configuration.

- [ ] **Step 1: Format Terraform**

Run:

```powershell
terraform fmt -recursive infra/terraform
terraform fmt -check -recursive infra/terraform
```

Expected: both exit `0` after formatting.

- [ ] **Step 2: Initialize without backend and generate lockfile**

Run:

```powershell
terraform -chdir=infra/terraform init -backend=false -input=false
terraform -chdir=infra/terraform providers lock -platform=windows_amd64 -platform=linux_amd64
```

Expected: AWS provider matching `~> 6.0` is locked with Windows and Linux hashes.

- [ ] **Step 3: Validate with the locked provider**

Run:

```powershell
terraform -chdir=infra/terraform init -backend=false -input=false -lockfile=readonly
terraform -chdir=infra/terraform validate
```

Expected: `Success! The configuration is valid.`

- [ ] **Step 4: Run repository quality checks**

Run:

```powershell
npm run format
npm run lint
npm run format:check
npm run typecheck
npm run test:run
npm run build
git diff --check
```

Expected: every command exits `0`; Terraform files do not weaken frontend gates.

---

### Task 7: Create And Audit The Real AWS Plan

**Files:**

- Generated and ignored: `infra/terraform/frontend.tfplan`
- Generated and ignored: `infra/terraform/frontend.tfplan.json`

**Interfaces:**

- Consumes: verified AWS account and validated stack.
- Produces: a saved, create-only, audited frontend plan.

- [ ] **Step 1: Reverify AWS identity immediately before backend initialization**

Run the account assertion from Task 1 again. Expected account:
`964866958896`.

- [ ] **Step 2: Initialize the real backend**

Run:

```powershell
terraform -chdir=infra/terraform init -reconfigure -input=false
```

Expected: S3 backend initialization succeeds using the frontend-specific key.

- [ ] **Step 3: Create the saved plan**

Run:

```powershell
terraform -chdir=infra/terraform plan -input=false -out=frontend.tfplan
terraform -chdir=infra/terraform show -no-color frontend.tfplan
terraform -chdir=infra/terraform show -json frontend.tfplan | Set-Content -LiteralPath "infra/terraform/frontend.tfplan.json"
```

Expected: only frontend resources are proposed.

- [ ] **Step 4: Run deterministic blast-radius audit**

Run:

```powershell
& "infra/terraform/scripts/Assert-FrontendPlan.ps1" -PlanJsonPath "infra/terraform/frontend.tfplan.json"
```

Expected: all managed changes are allowed types with create-only actions.

- [ ] **Step 5: Manually inspect plan addresses and names**

Reject the plan if any address/type/name references ECS, ECR, DynamoDB, API DNS,
backend IAM, VPC/subnet/security group, deletion, replacement, or unexpected
update. Confirm certificate and DNS records cover only apex/`www`, the state key is
frontend-specific, and IAM trust/policy match the design.

---

### Task 8: Apply The Saved Plan And Verify Outputs

**Files:**

- Remote state only: frontend-specific S3 state object

**Interfaces:**

- Consumes: exact audited `frontend.tfplan` from Task 7.
- Produces: provisioned frontend AWS resources and six outputs.

- [ ] **Step 1: Apply only the reviewed plan**

Run:

```powershell
terraform -chdir=infra/terraform apply -input=false frontend.tfplan
```

Expected: apply succeeds. Do not regenerate a plan between audit and apply.

- [ ] **Step 2: Read outputs**

Run:

```powershell
terraform -chdir=infra/terraform output
terraform -chdir=infra/terraform output -json
```

Confirm all six required outputs are present and record their non-secret values.

- [ ] **Step 3: Verify provisioned controls without deploying assets**

Use Terraform state/output and read-only AWS CLI calls to verify:

- S3 public-access block, encryption, versioning, and no website endpoint;
- CloudFront aliases, OAC origin, HTTPS redirect, certificate, response headers,
  default root, HTTP version, and 403/404 mappings;
- Route 53 apex/`www` A and AAAA aliases;
- IAM role trust subject and policy action/resource scope.

Do not upload `dist`, run the deployment workflow, invalidate CloudFront, or claim
the frontend application is live. An empty private origin may return fallback
errors until the separate deployment occurs.

- [ ] **Step 4: Update post-apply documentation truthfully**

Update infrastructure status and exact Terraform outputs in the appropriate task
record without exposing credentials. Continue to list backend CORS, GitHub
environment configuration, asset deployment, and production smoke testing as
remaining work.

- [ ] **Step 5: Run final static checks and review repository state**

Run:

```powershell
terraform fmt -check -recursive infra/terraform
terraform -chdir=infra/terraform validate
npm run format:check
git diff --check
git status --short
```

Expected: no plan/state/local Terraform working files are tracked, no backend files
changed, and only intended infrastructure/workflow/documentation changes remain.
