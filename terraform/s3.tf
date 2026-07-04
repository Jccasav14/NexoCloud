# S3 Bucket configuration for NexoCloud user uploads

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket" "user_storage" {
  bucket        = "${var.project_name}-user-uploads-${random_string.bucket_suffix.result}"
  force_destroy = true # Allows terraform destroy to succeed even if files are in bucket during testing

  tags = {
    Name = "${var.project_name}-s3-bucket"
  }
}

# Block all public access for security
resource "aws_s3_bucket_public_access_block" "user_storage_block" {
  bucket = aws_s3_bucket.user_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 CORS configuration
resource "aws_s3_bucket_cors_configuration" "user_storage_cors" {
  bucket = aws_s3_bucket.user_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"] # Adjust to ALB DNS in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
