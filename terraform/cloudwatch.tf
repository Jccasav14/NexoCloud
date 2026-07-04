# Amazon CloudWatch Monitoring and Alarms

# 1. CloudWatch Log Group for Application Auditing
resource "aws_cloudwatch_log_group" "app_log_group" {
  name              = "/${var.project_name}/application"
  retention_in_days = 7 # Automatically deletes old logs to save costs during testing
}

# 2. CPU Utilization Alarm for Backend Instances
resource "aws_cloudwatch_metric_alarm" "backend_cpu_high" {
  alarm_name          = "${var.project_name}-backend-cpu-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Triggers when Backend CPU usage exceeds 80% for 4 minutes"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.backend_asg.name
  }
}

# 3. CPU Utilization Alarm for Database Instance
resource "aws_cloudwatch_metric_alarm" "db_cpu_high" {
  alarm_name          = "${var.project_name}-db-cpu-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "Triggers when Database CPU usage exceeds 85% for 4 minutes"

  dimensions = {
    InstanceId = aws_instance.db_instance.id
  }
}

# 4. S3 Bucket Size Alarm (Optional trigger if uploads exceed limit)
# Note: Bucket metrics are reported once a day under AWS/S3 namespace
resource "aws_cloudwatch_metric_alarm" "s3_size_alarm" {
  alarm_name          = "${var.project_name}-s3-storage-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "BucketSizeBytes"
  namespace           = "AWS/S3"
  period              = "86400" # 24 hours
  statistic           = "Maximum"
  threshold           = "10737418240" # 10 GB limit in bytes
  alarm_description   = "Triggers when the total S3 bucket storage exceeds 10 GB"

  dimensions = {
    BucketName = aws_s3_bucket.user_storage.id
    StorageType = "StandardStorage"
  }
}
