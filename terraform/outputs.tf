output "alb_dns_name" {
  description = "The public DNS name of the Application Load Balancer"
  value       = aws_lb.app_alb.dns_name
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket created for user storage"
  value       = aws_s3_bucket.user_storage.id
}

output "db_private_ip" {
  description = "The private IP address of the PostgreSQL database instance"
  value       = aws_instance.db_instance.private_ip
}
