# AWS Systems Manager Parameter Store Configuration

resource "aws_ssm_parameter" "db_host" {
  name        = "/${var.project_name}/database/host"
  description = "Database private IP"
  type        = "String"
  value       = aws_instance.db_instance.private_ip
}

resource "aws_ssm_parameter" "db_port" {
  name        = "/${var.project_name}/database/port"
  description = "Database port"
  type        = "String"
  value       = "5432"
}

resource "aws_ssm_parameter" "db_name" {
  name        = "/${var.project_name}/database/name"
  description = "Database name"
  type        = "String"
  value       = var.db_name
}

resource "aws_ssm_parameter" "db_user" {
  name        = "/${var.project_name}/database/username"
  description = "Database admin username"
  type        = "String"
  value       = var.db_username
}

resource "aws_ssm_parameter" "db_password" {
  name        = "/${var.project_name}/database/password"
  description = "Database admin password"
  type        = "SecureString"
  value       = var.db_password
}

resource "aws_ssm_parameter" "s3_bucket" {
  name        = "/${var.project_name}/s3/bucket_name"
  description = "S3 bucket for user uploads"
  type        = "String"
  value       = aws_s3_bucket.user_storage.id
}

resource "aws_ssm_parameter" "environment" {
  name        = "/${var.project_name}/app/environment"
  description = "Application deployment environment"
  type        = "String"
  value       = "production"
}

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/${var.project_name}/app/jwt_secret"
  description = "Secret key for signing JWT tokens"
  type        = "SecureString"
  value       = "super-secret-nexocloud-jwt-signing-key-for-token-generation"
}

resource "aws_ssm_parameter" "log_level" {
  name        = "/${var.project_name}/app/log_level"
  description = "Application logger verbosity level"
  type        = "String"
  value       = "info"
}

resource "aws_ssm_parameter" "storage_quota_gb" {
  name        = "/${var.project_name}/app/storage_quota_gb"
  description = "Default client storage quota in GB"
  type        = "String"
  value       = "10"
}
