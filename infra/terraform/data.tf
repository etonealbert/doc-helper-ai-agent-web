data "aws_caller_identity" "current" {}

data "aws_route53_zone" "main" {
  name         = "${var.domain_name}."
  private_zone = false
}

data "aws_iam_openid_connect_provider" "github" {
  arn = var.github_oidc_provider_arn
}
