# AWS Lambda and Amazon EventBridge Configuration for NexoCloud
# Configured for automated processing, scheduled tasks, and CloudWatch Alarm reaction.

# 1. Package the Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/index.py"
  output_path = "${path.module}/lambda_function.zip"
}

# 2. Get AWS Caller Identity to fetch AWS Account ID dynamically
data "aws_caller_identity" "current" {}

# 3. Create the Lambda Function using the pre-existing AWS Academy LabRole
resource "aws_lambda_function" "nexocloud_lambda" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-processor"
  role             = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/LabRole"
  handler          = "index.handler"
  runtime          = "python3.12"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  tags = {
    Name = "${var.project_name}-lambda"
  }
}

# 4. Amazon EventBridge: Scheduled Cron Rule (Every 5 minutes)
resource "aws_cloudwatch_event_rule" "cron_rule" {
  name                = "${var.project_name}-cron-rule"
  description         = "Trigger Lambda function every 5 minutes for automated maintenance tasks"
  schedule_expression = "rate(5 minutes)"

  tags = {
    Name = "${var.project_name}-eb-cron-rule"
  }
}

resource "aws_cloudwatch_event_target" "cron_target" {
  rule      = aws_cloudwatch_event_rule.cron_rule.name
  target_id = "TriggerLambdaCron"
  arn       = aws_lambda_function.nexocloud_lambda.arn
}

resource "aws_lambda_permission" "allow_eventbridge_cron" {
  statement_id  = "AllowExecutionFromEventBridgeCron"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.nexocloud_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cron_rule.arn
}

# 5. Amazon EventBridge: CloudWatch Alarm Reaction Rule
# Triggers Lambda whenever CPU utilization or Storage alarms transition to ALARM state
resource "aws_cloudwatch_event_rule" "alarm_rule" {
  name        = "${var.project_name}-alarm-rule"
  description = "Trigger Lambda function on CloudWatch alarm state transitions to ALARM"
  event_pattern = jsonencode({
    "source" : [
      "aws.monitoring"
    ],
    "detail-type" : [
      "CloudWatch Alarm State Change"
    ],
    "detail" : {
      "state" : {
        "value" : ["ALARM"]
      }
    }
  })

  tags = {
    Name = "${var.project_name}-eb-alarm-rule"
  }
}

resource "aws_cloudwatch_event_target" "alarm_target" {
  rule      = aws_cloudwatch_event_rule.alarm_rule.name
  target_id = "TriggerLambdaAlarm"
  arn       = aws_lambda_function.nexocloud_lambda.arn
}

resource "aws_lambda_permission" "allow_eventbridge_alarm" {
  statement_id  = "AllowExecutionFromEventBridgeAlarm"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.nexocloud_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.alarm_rule.arn
}
