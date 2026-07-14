locals {
  www_domain           = "www.${var.domain_name}"
  domain_names         = var.include_www ? [var.domain_name, local.www_domain] : [var.domain_name]
  frontend_bucket_name = "${replace(var.domain_name, ".", "-")}-frontend-${data.aws_caller_identity.current.account_id}"
  origin_id            = "frontend-s3-origin"
  common_tags = {
    Project     = "doc-helper-ai-agent-web"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
