resource "aws_iam_role" "scheduler" {
  name = "${var.project}-scheduler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "scheduler_invoke_lambda" {
  name = "invoke-alerts-lambda"
  role = aws_iam_role.scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = aws_lambda_function.alerts.arn
    }]
  })
}

resource "aws_scheduler_schedule" "daily_alerts" {
  name = "${var.project}-daily-alerts"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = var.schedule_expression
  schedule_expression_timezone = "Australia/Sydney"

  target {
    arn      = aws_lambda_function.alerts.arn
    role_arn = aws_iam_role.scheduler.arn
  }

  depends_on = [aws_iam_role_policy.scheduler_invoke_lambda]
}
