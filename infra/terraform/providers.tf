provider "aws" {
  region              = var.aws_region
  allowed_account_ids = ["964866958896"]

  default_tags {
    tags = local.common_tags
  }
}
