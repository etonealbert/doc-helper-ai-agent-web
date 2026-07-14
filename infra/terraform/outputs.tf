output "frontend_bucket_name" {
  description = "Name of the private S3 bucket that stores frontend assets."
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution serving the frontend."
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_distribution_domain" {
  description = "CloudFront-assigned domain name for the frontend distribution."
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_url" {
  description = "Intended HTTPS URL for the frontend apex domain."
  value       = "https://${var.domain_name}"
}

output "github_deploy_role_arn" {
  description = "ARN of the GitHub OIDC role used by the frontend deployment workflow."
  value       = aws_iam_role.github_deploy.arn
}

output "certificate_arn" {
  description = "ARN of the DNS-validated ACM certificate used by CloudFront."
  value       = aws_acm_certificate_validation.frontend.certificate_arn
}
