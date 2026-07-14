variable "aws_region" {
  description = "AWS region for the frontend infrastructure."
  type        = string
  default     = "us-east-1"

  validation {
    condition     = var.aws_region == "us-east-1"
    error_message = "aws_region must be us-east-1."
  }
}

variable "domain_name" {
  description = "Apex domain for the frontend."
  type        = string
  default     = "albertlukmanovlabs.lol"

  validation {
    condition     = var.domain_name == "albertlukmanovlabs.lol"
    error_message = "domain_name must be albertlukmanovlabs.lol."
  }
}

variable "include_www" {
  description = "Whether to include the www frontend domain."
  type        = bool
  default     = true
}

variable "github_oidc_provider_arn" {
  description = "ARN of the existing GitHub Actions OIDC provider."
  type        = string
  default     = "arn:aws:iam::964866958896:oidc-provider/token.actions.githubusercontent.com"

  validation {
    condition     = can(regex("^arn:aws:iam::964866958896:oidc-provider/.+$", var.github_oidc_provider_arn))
    error_message = "github_oidc_provider_arn must identify an OIDC provider in AWS account 964866958896."
  }
}

variable "github_repository" {
  description = "GitHub repository in owner/name form."
  type        = string
  default     = "etonealbert/doc-helper-ai-agent-web"

  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "github_repository must use owner/name form."
  }
}
