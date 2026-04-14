data "archive_file" "alerts" {
  type        = "zip"
  source_file = "${path.module}/../dist/lambda.mjs"
  output_path = "${path.module}/alerts-lambda.zip"
}

resource "aws_iam_role" "alerts_lambda" {
  name = "${var.project}-alerts-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "alerts_lambda_basic" {
  role       = aws_iam_role.alerts_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "alerts_lambda_dynamodb" {
  name = "dynamodb-access"
  role = aws_iam_role.alerts_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
      ]
      Resource = aws_dynamodb_table.alerts.arn
    }]
  })
}

resource "aws_iam_role_policy" "alerts_lambda_ssm" {
  name = "ssm-access"
  role = aws_iam_role.alerts_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "ssm:GetParameter"
      Resource = local.discord_webhook_parameter_arn
    }]
  })
}

resource "aws_cloudwatch_log_group" "alerts" {
  name              = "/aws/lambda/${var.project}-alerts"
  retention_in_days = 7
  tags              = local.tags
}

resource "aws_lambda_function" "alerts" {
  function_name    = "${var.project}-alerts"
  role             = aws_iam_role.alerts_lambda.arn
  filename         = data.archive_file.alerts.output_path
  source_code_hash = data.archive_file.alerts.output_base64sha256
  handler          = "lambda.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_TABLE        = aws_dynamodb_table.alerts.name
      DISCORD_WEBHOOK_PARAM = local.discord_webhook_parameter_name
      MIN_SCORE             = tostring(var.min_score)
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.alerts,
    aws_iam_role_policy_attachment.alerts_lambda_basic,
    aws_iam_role_policy.alerts_lambda_dynamodb,
    aws_iam_role_policy.alerts_lambda_ssm,
  ]

  tags = local.tags
}
