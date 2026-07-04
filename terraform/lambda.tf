# AWS Lambda and EventBridge Configuration

# 1. IAM Role for Lambda Execution
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Attach standard CloudWatch policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 2. Package Lambda Code dynamically
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"
  source {
    content  = <<-EOF
def lambda_handler(event, context):
    print("Event Bridge Triggered Event:", event)
    # Perform asynchronous background operations (e.g. log auditing, cleanup, virus scanning placeholders)
    return {
        'statusCode': 200,
        'body': 'NexoCloud Serverless Event processed successfully.'
    }
EOF
    filename = "index.py"
  }
}

# 3. AWS Lambda Function (512MB RAM as requested)
resource "aws_lambda_function" "background_worker" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-background-worker"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.lambda_handler"
  runtime          = "python3.11"
  memory_size      = 512
  timeout          = 15
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  tags = {
    Name = "${var.project_name}-lambda"
  }
}

# 4. Amazon EventBridge (Custom Event Bus)
resource "aws_cloudwatch_event_bus" "custom_bus" {
  name = "${var.project_name}-event-bus"
}

# EventBridge rule: Trigger Lambda every day (or matching a specific event pattern)
resource "aws_cloudwatch_event_rule" "daily_trigger" {
  name           = "${var.project_name}-daily-trigger"
  description    = "Trigger daily background processing Lambda"
  event_bus_name = aws_cloudwatch_event_bus.custom_bus.name
  
  # Trigger rule on a schedule (e.g. once a day) or on custom audit events
  event_pattern = jsonencode({
    "source": ["nexocloud.app"]
  })
}

# Link Rule to Lambda Target
resource "aws_cloudwatch_event_target" "lambda_target" {
  rule           = aws_cloudwatch_event_rule.daily_trigger.name
  event_bus_name = aws_cloudwatch_event_bus.custom_bus.name
  target_id      = "SendToLambda"
  arn            = aws_lambda_function.background_worker.arn
}

# Permission for EventBridge to invoke Lambda
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.background_worker.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_trigger.arn
}
